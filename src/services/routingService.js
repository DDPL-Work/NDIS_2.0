// OSRM driving-route client (frontend-only; no backend routing API).
//
// STRICT TWO-POINT MODEL — exactly one origin and one destination per
// request.  Multi-stop / one-to-many routing is intentionally NOT supported:
// the OSRM URL always contains exactly two coordinates
//   originLng,originLat;destinationLng,destinationLat
// and never a waypoint chain (A;B;C / A;B;C;D).  The provider response may
// internally contain a legs[] array, but legs are provider-internal segments
// of the single origin→destination path — they never become route stops on
// the frontend.
import { getDevicePosition } from '../utils/geo'

const OSRM_BASE = 'https://router.project-osrm.org'
const ROUTE_TIMEOUT_MS = 12000
const CACHE_MAX_ENTRIES = 100

// Dev-only coordinate-contract diagnostics.  No-ops in production builds
// (Vite statically replaces import.meta.env.DEV) and safe outside the browser
// (import.meta.env may not exist).  Lets the acceptance scenario
// (Current Location → GIS feature) be traced in the browser console:
//   [ROUTE TARGET]      origin/destination route targets with positions
//   [OSRM COORDINATES]  the exact { lng, lat } pairs sent in the URL
//   [OSRM URL]          the exact two-coordinate request
//   [ROUTE]             resolved totals (km / min)
function devLog(...args) {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && import.meta.env.DEV) console.debug(...args)
}

const CACHE = new Map() // "lng1,lat1;lng2,lat2" → normalized route

export function clearCache() {
  CACHE.clear()
}

function validatePoint(point, label) {
  const lat = Number(point?.lat)
  const lng = Number(point?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw Object.assign(new Error('invalid-coordinates'), { label })
  }
  return { lat, lng }
}

function cacheKeyFor(origin, destination) {
  return [origin.lng.toFixed(6), origin.lat.toFixed(6), destination.lng.toFixed(6), destination.lat.toFixed(6)].join(';')
}

async function fetchRoute(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('routing-unavailable')
    return await response.json()
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('route-timeout')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

// Normalizes the provider response for the single origin→destination path.
// Totals are aggregated from the provider's own leg summaries — never
// Haversine/straight-line estimates.  legs[] stays a provider-internal detail
// (per-segment geometry/duration), not a list of routable stops.
function normalizeRoute(origin, destination, json) {
  const routeJson = json?.routes?.[0]
  const summary = (routeJson?.legs || []).reduce(
    (acc, leg) => ({ distance: acc.distance + (leg.distance || 0), duration: acc.duration + (leg.duration || 0) }),
    { distance: 0, duration: 0 }
  )
  return {
    coordinates: routeJson?.geometry?.coordinates || [],
    legs: routeJson?.legs || [],
    distanceKm: Number.isFinite(summary.distance) ? Number((summary.distance / 1000).toFixed(2)) : null,
    distanceMeters: Number.isFinite(summary.distance) ? Math.round(summary.distance) : null,
    durationMinutes: Number.isFinite(summary.duration) ? Number((summary.duration / 60).toFixed(1)) : null,
    durationSeconds: Number.isFinite(summary.duration) ? Math.round(summary.duration) : null,
  }
}

export const routingService = {
  // Two-point road route.  `origin` and `destination` are { lat, lng } pairs.
  // Rejects invalid coordinates; never accepts waypoints.
  async getRoute({ origin, destination } = {}) {
    const from = validatePoint(origin, 'origin')
    const to = validatePoint(destination, 'destination')
    devLog('[ROUTE TARGET]', {
      origin,
      destination,
      originPosition: origin?.position,
      destinationPosition: destination?.position,
    })
    const key = cacheKeyFor(from, to)
    const cached = CACHE.get(key)
    if (cached) return cached
    const url = `${OSRM_BASE}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&alternatives=false`
    devLog('[OSRM COORDINATES]', {
      origin: { lng: from.lng, lat: from.lat },
      destination: { lng: to.lng, lat: to.lat },
    })
    devLog('[OSRM URL]', url)
    const json = await fetchRoute(url)
    if (!json?.routes?.length) throw new Error('no-route')
    const route = normalizeRoute(from, to, json)
    devLog('[ROUTE]', {
      origin: { lng: from.lng, lat: from.lat },
      destination: { lng: to.lng, lat: to.lat },
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
    })
    if (CACHE.size >= CACHE_MAX_ENTRIES) CACHE.delete(CACHE.keys().next().value)
    CACHE.set(key, route)
    return route
  },

  // Geolocation helper reused by the two-point origin prepend (Current
  // Location → Facility).  Null when the device location is unavailable.
  getDevicePosition,
}

export default routingService