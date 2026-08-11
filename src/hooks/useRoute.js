import { useState, useCallback } from 'react'
import { routingService } from '../services/routingService'
import { getDevicePosition } from '../utils/geo'

export const ROUTE_MODES = {
  USER_TO_FACILITY: 'user_to_facility',
  FACILITY_TO_FACILITY: 'facility_to_facility',
}

const COORD_ERR = 'Route unavailable because this facility does not have valid coordinates.'

function validPosition(facility) {
  const position = facility?.position
  return Array.isArray(position) && position.length >= 2 && Number.isFinite(position[0]) && Number.isFinite(position[1])
}

function pointFor(position) {
  return { lat: position[1], lng: position[0] }
}

function toFacility(facility) {
  return {
    id: facility?.id,
    name: facility?.name || facility?.title || facility?.departmentName || 'Facility',
    position: facility?.position,
  }
}

// Route state for both GIS routing modes on a single map surface.
//
// MODE A — USER_TO_FACILITY:      showRoute(facility)      [GPS required]
// MODE B — FACILITY_TO_FACILITY:  setRouteStart(facility)
//                                 setRouteDestination(facility)
//                                 showFacilityRoute()       [no GPS — coordinates only]
//
// Both modes call the same routingService and expose the same { route } shape
// { coordinates, distanceKm, durationMinutes, origin, destination } so the map
// layer and route card stay provider-agnostic.  One hook instance per GIS
// surface keeps one active route per map; switching modes replaces it.
export function useRoute() {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error'
  const [mode, setMode] = useState(null)
  const [route, setRoute] = useState(null)
  const [startFacility, setStartFacility] = useState(null)
  const [destinationFacility, setDestinationFacility] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const dropRoute = useCallback(() => {
    setStatus('idle')
    setRoute(null)
    setErrorMessage(null)
  }, [])

  const applyRoute = useCallback((calculated, origin, destination, mode) => {
    setRoute({ ...calculated, origin, destination, mode })
    setStatus('ready')
    setErrorMessage(null)
  }, [])

  const routeError = useCallback((message) => {
    setStatus('error')
    setRoute(null)
    setErrorMessage(message)
  }, [])

  // MODE A — current location → facility.  GPS is requested only here.
  const showRoute = useCallback(async (facility) => {
    if (!facility) return
    setStartFacility(null)
    setDestinationFacility(null)
    if (!validPosition(facility)) {
      routeError(COORD_ERR)
      return
    }
    dropRoute()
    setMode(ROUTE_MODES.USER_TO_FACILITY)
    setStatus('loading')
    setErrorMessage(null)
    const origin = await getDevicePosition()
    if (!origin) {
      routeError('Your location is required to calculate the route.')
      return
    }
    try {
      const calculated = await routingService.getRoute({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: pointFor(facility.position),
      })
      applyRoute(calculated,
        { lat: origin.lat, lng: origin.lng, name: 'Your location' },
        { lat: facility.position[1], lng: facility.position[0], name: facility.name, id: facility.id },
        ROUTE_MODES.USER_TO_FACILITY)
    } catch {
      routeError('Unable to calculate a road route for this location.')
    }
  }, [applyRoute, routeError, dropRoute])

  // MODE B — pick a start facility (no routing, no GPS).
  const setRouteStart = useCallback((facility) => {
    if (!facility) return
    const picked = toFacility(facility)
    if (destinationFacility && String(destinationFacility.id) === String(picked.id)) setDestinationFacility(null)
    setStartFacility(picked)
    setMode(ROUTE_MODES.FACILITY_TO_FACILITY)
    dropRoute()
  }, [destinationFacility, dropRoute])

  // MODE B — pick a destination facility (no routing, no GPS).
  const setRouteDestination = useCallback((facility) => {
    if (!facility) return
    const picked = toFacility(facility)
    if (startFacility && String(startFacility.id) === String(picked.id)) return
    setDestinationFacility(picked)
    setMode(ROUTE_MODES.FACILITY_TO_FACILITY)
    dropRoute()
  }, [startFacility, dropRoute])

  // MODE B — calculate Facility A → Facility B. Never touches geolocation.
  const showFacilityRoute = useCallback(async () => {
    const originFacility = startFacility
    const destination = destinationFacility
    if (!originFacility || !destination) {
      routeError('Select a start facility and a destination facility to calculate a route.')
      return
    }
    if (!validPosition(originFacility) || !validPosition(destination)) {
      routeError(COORD_ERR)
      return
    }
    setMode(ROUTE_MODES.FACILITY_TO_FACILITY)
    dropRoute()
    setStatus('loading')
    setErrorMessage(null)
    try {
      const calculated = await routingService.getRoute({
        origin: pointFor(originFacility.position),
        destination: pointFor(destination.position),
      })
      applyRoute(calculated,
        { lat: originFacility.position[1], lng: originFacility.position[0], name: originFacility.name, id: originFacility.id },
        { lat: destination.position[1], lng: destination.position[0], name: destination.name, id: destination.id },
        ROUTE_MODES.FACILITY_TO_FACILITY)
    } catch (error) {
      if (error?.message === 'no-route') routeError('No road route could be found between these facilities.')
      else routeError('Unable to calculate a road route between these facilities.')
    }
  }, [startFacility, destinationFacility, applyRoute, routeError, dropRoute])

  const swapFacilities = useCallback(() => {
    if (!startFacility || !destinationFacility) return
    setStartFacility(destinationFacility)
    setDestinationFacility(startFacility)
    setMode(ROUTE_MODES.FACILITY_TO_FACILITY)
    dropRoute()
  }, [startFacility, destinationFacility, dropRoute])

  const clearRoute = useCallback(() => {
    setMode(null)
    setStartFacility(null)
    setDestinationFacility(null)
    dropRoute()
  }, [dropRoute])

  const routeStartId = startFacility?.id != null ? String(startFacility.id) : null
  const routeDestinationId = destinationFacility?.id != null ? String(destinationFacility.id) : null
  const routeActiveId = route?.destination?.id != null ? String(route.destination.id) : null

  return {
    status, mode, route, errorMessage,
    startFacility, destinationFacility,
    routeStartId, routeDestinationId, routeActiveId,
    showRoute, setRouteStart, setRouteDestination, showFacilityRoute, swapFacilities, clearRoute,
  }
}