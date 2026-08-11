// Road routing service — the single HTTP boundary for the in-map route
// feature.  The routing provider is isolated here so the GIS UI never depends
// on a provider-specific response shape; swapping OSRM for OpenRouteService /
// GraphHopper later requires no changes outside this file.
//
// Provider: OSRM-compatible engine (public demo by default, no API key).
//   GET {OSRM}/route/v1/driving/{lng1},{lat1};{lng2},{lat2}
//        ?overview=full&geometries=geojson&steps=false&alternatives=false
// The provider base can be overridden with VITE_OSRM_URL for self-hosted
// instances.  Routes are cached in memory keyed by rounded origin+destination.
const OSRM_BASE_URL = (import.meta.env.VITE_OSRM_URL || 'https://router.project-osrm.org').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 12000
const CACHE_MAX_ENTRIES = 100

// Key via ~6 decimals so identical devices/facilities always hit the cache.
function cacheKey(origin, destination) {
  return [
    Number(origin.lng).toFixed(6),
    Number(origin.lat).toFixed(6),
    Number(destination.lng).toFixed(6),
    Number(destination.lat).toFixed(6),
  ].join(',')
}

function isFiniteLatLng(point) {
  return Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
}

async function fetchOsrmRoute(origin, destination) {
  const url = `${OSRM_BASE_URL}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false&alternatives=false`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('routing-unavailable')
    const payload = await response.json().catch(() => null)
    if (!payload || payload.code !== 'Ok' || !Array.isArray(payload.routes) || !payload.routes.length) throw new Error('no-route')
    return payload
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('route-timeout')
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

// OSRM geojson geometry is [lng, lat]; the app's map layer consumes [lat, lng].
function normalizeRoute(payload) {
  const raw = payload.routes[0]
  const distanceMeters = Math.round(Number(raw.distance) || 0)
  const durationSeconds = Math.round(Number(raw.duration) || 0)
  return {
    coordinates: (raw.geometry?.coordinates || []).map(([lng, lat]) => [Number(lat), Number(lng)]),
    distanceMeters,
    distanceKm: distanceMeters ? Number((distanceMeters / 1000).toFixed(2)) : 0,
    durationSeconds,
    durationMinutes: durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : 0,
  }
}

const cache = new Map()

export const routingService = {
  // Interface: getRoute({ origin: { lat, lng }, destination: { lat, lng } })
  // -> { coordinates, distanceMeters, distanceKm, durationSeconds, durationMinutes }
  async getRoute({ origin, destination } = {}) {
    if (!isFiniteLatLng(origin) || !isFiniteLatLng(destination)) {
      throw new Error('invalid-coordinates')
    }
    origin = { lat: Number(origin.lat), lng: Number(origin.lng) }
    destination = { lat: Number(destination.lat), lng: Number(destination.lng) }
    const key = cacheKey(origin, destination)
    const hit = cache.get(key)
    if (hit) return hit.promise

    const promise = (async () => {
      const payload = await fetchOsrmRoute(origin, destination)
      return normalizeRoute(payload)
    })()
    cache.set(key, { promise })
    if (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value)
    try {
      return await promise
    } catch (error) {
      cache.delete(key)
      throw error
    }
  },

  clearCache() {
    cache.clear()
  },
}