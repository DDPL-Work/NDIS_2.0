import { distanceMeters } from '../../utils/geo'
export function estimateRoute(origin, destination) {
  const distanceM = origin && destination ? distanceMeters(origin, destination) : null
  return { distanceM, travelMinutes: distanceM == null ? null : Math.max(1, Math.round(distanceM / 500)), mode: 'road-estimate' }
}
