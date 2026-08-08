import { distanceMeters } from '../../utils/geo'
export function withinBuffer(points = [], center, radiusKm) {
  if (!center || !radiusKm) return points
  return points.filter((point) => point.position && distanceMeters(center, point.position) <= radiusKm * 1000)
}
