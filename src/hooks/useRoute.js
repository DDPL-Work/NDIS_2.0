import { useState, useCallback, useRef } from 'react'
import { routingService } from '../services/routingService'
import { getDevicePosition } from '../utils/geo'

export const ROUTE_MODES = {
  USER_TO_FACILITY: 'user_to_facility',
  FACILITY_TO_FACILITY: 'facility_to_facility',
}

const COORD_ERR = 'Route unavailable because this facility does not have valid coordinates.'
const NOT_ROUTABLE_ERR = 'Route is available only for facilities with valid location coordinates.'
const LOCATION_ERR = 'Your location is required to calculate the route.'
const USER_TO_FACILITY_ERR = 'Unable to calculate a road route for this location.'
const FACILITY_ERR_NO_ROUTE = 'No road route could be found between these facilities.'
const FACILITY_ERR_UNAVAILABLE = 'Unable to calculate a road route between these facilities.'
const DEFAULT_ERR_UNAVAILABLE = 'Unable to calculate a road route between these facilities.'
const SAME_TARGET_ERR = 'Origin and destination must be different.'

// STRICT TWO-POINT routing state — exactly ONE origin and ONE destination at
// any time.  Selecting a new origin/destination REPLACES the previous one;
// nothing is ever appended, so A → B → C is impossible by construction.
//
//   {
//     origin:      RouteTarget | null,   // facility / user-location
//     destination: RouteTarget | null,
//     route, status, mode, errorMessage
//   }
//
// RouteTarget = { type, facilityId, id, sourceType, sourceId, layerId,
//                 routeKey, name, position: [lng, lat], sub }
//
// HARD ROUTING RULE: a route endpoint must be an EXPLICITLY selected routable
// point — a facility with valid [lng, lat] coordinates, or the user's device
// location.  GIS layer features, administrative boundaries (District /
// Block), polygons, derived geometry points and generic map features are
// NEVER accepted as targets (see isRoutablePoint).  Every entry point
// validates the entity before any routing state is touched.
//
// Entry points (all funnel through the same origin/destination pair):
//   - search "Show Route"          -> Current Location → facility, routed at once
//   - search "Start From Here"     -> setRouteStart(target)    [replaces origin]
//   - search "Route To Here"       -> setRouteDestination(target) [replaces dest]
//   - search "Show Shortest Route" -> showFacilityRoute()      [2-point OSRM]
//   - map popup "Route to here"    -> routeTo(target)  [GPS origin prepend when
//                                     no route exists, else replaces destination]
//   - route panel "Start Route"/"Recalculate" -> calculateRoute() [one OSRM req]
//
// Route calculation only ever runs on an explicit user action.  Replacing an
// endpoint drops the current geometry immediately (the map must never show a
// stale route) and bumps a request id so an in-flight OSRM response can never
// overwrite a newer endpoint pair.  One active calculation at a time.
function validPosition(target) {
  const position = target?.position
  return Array.isArray(position) && position.length >= 2 && Number.isFinite(position[0]) && Number.isFinite(position[1])
}

// STRICT route-target validation (the hard routing rule).  A route endpoint
// MUST be an explicitly selected facility point with a real, in-range
// [lng, lat] position.  GIS layer features, administrative polygons, derived
// geometry points and anything without valid coordinates are NEVER routable.
function isRoutablePoint(entity) {
  if (!entity || entity?.sourceType === 'gis-layer') return false
  const position = entity?.position
  if (!Array.isArray(position) || position.length < 2) return false
  const lng = Number(position[0])
  const lat = Number(position[1])
  return Number.isFinite(lng) && Number.isFinite(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

function pointFor(position) {
  return { lat: position[1], lng: position[0] }
}

// Normalises an explicitly selected FACILITY into a RouteTarget.  GIS layer
// features are deliberately not handled here — only facilities (and the
// user location) may ever become route endpoints, so a district boundary can
// never become a destination by construction.  `routeKey` is the single
// source-aware identity used to reject origin === destination: facility:12
// and facility:143 are always different entities, even when their ids
// collide.
function toRouteTarget(entity = {}) {
  const id = entity?.id != null ? String(entity.id) : null
  return {
    type: 'facility',
    facilityId: id,
    id,
    sourceType: 'facility',
    sourceId: id,
    layerId: null,
    routeKey: id ? `facility:${id}` : `facility:${entity?.name || 'unknown'}`,
    name: entity?.name || entity?.title || entity?.departmentName || 'Facility',
    position: entity?.position,
    sub: entity?.departmentName || entity?.categoryLabel || '',
  }
}

function keyOf(target) {
  return target?.routeKey ?? null
}

function userLocationTarget({ lng, lat }) {
  return {
    type: 'user-location',
    facilityId: null,
    id: 'user-location',
    sourceType: 'user-location',
    sourceId: 'user-location',
    layerId: null,
    routeKey: 'user-location',
    name: 'Your location',
    position: [Number(lng), Number(lat)],
    sub: '',
  }
}

// Dev-only endpoint sanity checks + trace logging for the acceptance scenario.
// No-ops in production (Vite replaces import.meta.env.DEV statically) and safe
// outside the browser (import.meta.env may not exist).
function devLog(...args) {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && import.meta.env.DEV) console.debug(...args)
}

function assertEndpoint(target, label) {
  if (!target) return
  const position = target.position
  console.assert(Array.isArray(position) && position.length === 2, `[ROUTE] ${label} position must be [lng, lat]`, position)
  if (!Array.isArray(position)) return
  console.assert(Number.isFinite(position[0]) && Number.isFinite(position[1]), `[ROUTE] ${label} coordinates must be finite`, position)
  console.assert(position[0] >= -180 && position[0] <= 180, `[ROUTE] ${label} longitude out of range`, position[0])
  console.assert(position[1] >= -90 && position[1] <= 90, `[ROUTE] ${label} latitude out of range`, position[1])
}

export function useRoute() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error'
  const [mode, setMode] = useState(null)
  const [route, setRoute] = useState(null)
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const originRef = useRef(null)
  const destinationRef = useRef(null)
  const requestIdRef = useRef(0)
  const loadingRef = useRef(false)

  // Every endpoint mutation goes through applyTargets so refs stay in lockstep
  // with state (calculateRoute reads the refs synchronously).
  const applyTargets = useCallback((nextOrigin, nextDestination) => {
    originRef.current = nextOrigin
    destinationRef.current = nextDestination
    setOrigin(nextOrigin)
    setDestination(nextDestination)
  }, [])

  const dropRoute = useCallback(() => {
    setStatus('idle')
    setRoute(null)
    setErrorMessage(null)
  }, [])

  const routeError = useCallback((message) => {
    setStatus('error')
    setRoute(null)
    setErrorMessage(message)
  }, [])

  // Single OSRM pipeline for the current origin → destination pair.
  const calculateRoute = useCallback(async ({ noRouteMessage = FACILITY_ERR_NO_ROUTE, unavailableMessage = DEFAULT_ERR_UNAVAILABLE, mode: forceMode = null } = {}) => {
    const from = originRef.current
    const to = destinationRef.current
    if (!validPosition(from) || !validPosition(to)) {
      routeError(COORD_ERR)
      return
    }
    const nextMode = forceMode || mode || ROUTE_MODES.FACILITY_TO_FACILITY
    if (import.meta.env.DEV) {
      assertEndpoint(from, 'origin')
      assertEndpoint(to, 'destination')
      devLog('[ROUTE TARGET]', {
        routeMode: nextMode,
        origin: from,
        destination: to,
        destinationType: to?.type ?? null,
        destinationId: to?.facilityId ?? null,
        destinationName: to?.name ?? null,
        geometryType: 'Point',
        originPosition: from.position,
        destinationPosition: to.position,
      })
    }
    if (keyOf(from) && keyOf(to) && keyOf(from) === keyOf(to)) {
      routeError(SAME_TARGET_ERR)
      return
    }
    if (loadingRef.current) return // one active calculation at a time
    const id = ++requestIdRef.current
    loadingRef.current = true
    setMode(nextMode)
    setStatus('loading')
    setErrorMessage(null)
    try {
      const calculated = await routingService.getRoute({
        origin: pointFor(from.position),
        destination: pointFor(to.position),
      })
      if (id !== requestIdRef.current) return // a newer endpoint pair superseded this request
      setRoute({
        ...calculated,
        origin: { lat: from.position[1], lng: from.position[0], name: from.name, id: from.facilityId, type: from.type },
        destination: { lat: to.position[1], lng: to.position[0], name: to.name, id: to.facilityId, type: to.type },
        mode: nextMode,
      })
      setStatus('ready')
      setErrorMessage(null)
    } catch (error) {
      if (id !== requestIdRef.current) return
      if (error?.message === 'no-route') routeError(noRouteMessage)
      else if (error?.message === 'invalid-coordinates') routeError(COORD_ERR)
      else if (error?.message === 'route-timeout') routeError('The routing request timed out. Please try again.')
      else if (error?.message === 'routing-unavailable') routeError('The routing service is currently unavailable. Please try again.')
      else routeError(unavailableMessage)
    } finally {
      loadingRef.current = false
    }
  }, [mode, routeError])

  // ---- SEARCH "Show Route" — Current Location → facility, routed immediately.
  const showRoute = useCallback(async (facility) => {
    if (!isRoutablePoint(facility)) {
      routeError(NOT_ROUTABLE_ERR)
      return
    }
    requestIdRef.current += 1
    setMode(ROUTE_MODES.USER_TO_FACILITY)
    setStatus('loading')
    setErrorMessage(null)
    const device = await getDevicePosition()
    if (!device) {
      routeError(LOCATION_ERR)
      return
    }
    applyTargets(userLocationTarget(device), toRouteTarget(facility))
    await calculateRoute({
      noRouteMessage: USER_TO_FACILITY_ERR,
      unavailableMessage: USER_TO_FACILITY_ERR,
      mode: ROUTE_MODES.USER_TO_FACILITY,
    })
  }, [routeError, applyTargets, calculateRoute])

  // ---- SEARCH "Start From Here" — selected facility becomes (replaces) the origin.
  const setRouteStart = useCallback((facility) => {
    if (!isRoutablePoint(facility)) {
      routeError(NOT_ROUTABLE_ERR)
      return
    }
    const picked = toRouteTarget(facility)
    if (!validPosition(picked)) {
      routeError(COORD_ERR)
      return
    }
    if (destinationRef.current && keyOf(destinationRef.current) === picked.routeKey) {
      routeError(SAME_TARGET_ERR)
      return
    }
    applyTargets(picked, destinationRef.current)
    requestIdRef.current += 1
    dropRoute()
  }, [routeError, applyTargets, dropRoute])

  // ---- SEARCH "Route To Here" — selected facility becomes (replaces) the destination.
  const setRouteDestination = useCallback((facility) => {
    if (!isRoutablePoint(facility)) {
      routeError(NOT_ROUTABLE_ERR)
      return
    }
    const picked = toRouteTarget(facility)
    if (!validPosition(picked)) {
      routeError(COORD_ERR)
      return
    }
    if (originRef.current && keyOf(originRef.current) === picked.routeKey) {
      routeError(SAME_TARGET_ERR)
      return
    }
    applyTargets(originRef.current, picked)
    requestIdRef.current += 1
    dropRoute()
  }, [routeError, applyTargets, dropRoute])

  // ---- SEARCH "Show Shortest Route" — calculate the picked pair.
  const showFacilityRoute = useCallback(async () => {
    const from = originRef.current
    const to = destinationRef.current
    if (!from || !to) {
      routeError('Select a start facility and a destination facility to calculate a route.')
      return
    }
    setMode(ROUTE_MODES.FACILITY_TO_FACILITY)
    await calculateRoute({
      noRouteMessage: FACILITY_ERR_NO_ROUTE,
      unavailableMessage: FACILITY_ERR_UNAVAILABLE,
      mode: ROUTE_MODES.FACILITY_TO_FACILITY,
    })
  }, [calculateRoute, routeError])

  // ---- MAP POPUP "Route to here" — destination (replaces any existing one).
  // Only explicitly selected facilities pass the routable-point check; GIS
  // layer features and administrative boundaries are rejected before any
  // routing state is touched.  With no route at all, a device-location origin
  // is prepended when available (Current Location → Facility).  Returns
  // { ok, reason } so the caller can surface "already the start point /
  // destination" to the user.
  const routeTo = useCallback(async (entity) => {
    if (!isRoutablePoint(entity)) {
      routeError(NOT_ROUTABLE_ERR)
      return { ok: false, reason: 'invalid' }
    }
    const picked = toRouteTarget(entity)
    if (!validPosition(picked)) {
      routeError(COORD_ERR)
      return { ok: false, reason: 'invalid' }
    }
    if (originRef.current && keyOf(originRef.current) === picked.routeKey) {
      return { ok: false, reason: 'same-as-origin' }
    }
    if (destinationRef.current && keyOf(destinationRef.current) === picked.routeKey) {
      return { ok: false, reason: 'same-as-destination' }
    }
    let nextOrigin = originRef.current
    if (!nextOrigin && !destinationRef.current) {
      const device = await getDevicePosition()
      if (device) nextOrigin = userLocationTarget(device)
    }
    applyTargets(nextOrigin, picked)
    requestIdRef.current += 1
    dropRoute()
    return { ok: true }
  }, [routeError, applyTargets, dropRoute])

  // ---- Swap the two endpoints (Facility → Facility pickup flow).
  const swapFacilities = useCallback(() => {
    const from = originRef.current
    const to = destinationRef.current
    if (!from || !to) return
    applyTargets(to, from)
    requestIdRef.current += 1
    dropRoute()
  }, [applyTargets, dropRoute])

  const clearRoute = useCallback(() => {
    applyTargets(null, null)
    requestIdRef.current += 1
    setMode(null)
    dropRoute()
  }, [applyTargets, dropRoute])

  // Derived values — kept for every existing consumer.
  const startFacility = origin?.type === 'facility' ? origin : null
  const destinationFacility = destination?.type === 'facility' ? destination : null
  const routeStartId = origin?.facilityId != null ? String(origin.facilityId) : null
  const routeDestinationId = destination?.facilityId != null ? String(destination.facilityId) : null
  const routeActiveId = route?.destination?.id != null ? String(route.destination.id) : null
  const routeOriginKey = origin?.routeKey ?? null
  const routeDestinationKey = destination?.routeKey ?? null

  return {
    status, mode, route, errorMessage,
    origin, destination,
    startFacility, destinationFacility,
    routeStartId, routeDestinationId, routeActiveId,
    routeOriginKey, routeDestinationKey,
    showRoute, setRouteStart, setRouteDestination, showFacilityRoute, swapFacilities, clearRoute,
    routeTo, calculateRoute,
  }
}