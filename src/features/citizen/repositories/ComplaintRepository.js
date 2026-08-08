// Single client-side repository boundary for the citizen complaint engine.
// Spatial duplicate lookups are delegated to the backend GIS endpoint
// (GET /api/complaints/nearby/?lat=&lng=&radius=) instead of local heuristics.
import { ComplaintRepository as SpatialRepository } from '../../../gis/repositories/ComplaintRepository'

export const ComplaintRepository = {
  findNearbyDuplicates: async (position, radius = 250) => {
    if (!Array.isArray(position) || position.length < 2) return []
    try {
      return await SpatialRepository.findNearby({ lat: position[1], lng: position[0], radius })
    } catch {
      return []
    }
  },
}
