import { useAsync } from './useAsync'
import { GISRepository } from '../gis/repositories/GISRepository'

// Facilities from GET /api/facilities/ (geom_geojson coordinates are mapped
// to [longitude, latitude] position by the facility mapper).
export function useFacilities(districtId) {
  return useAsync(
    // The deployed citizen API accepts the Nalanda slug: ?district=nalanda.
    () => GISRepository.facilities(districtId ? { districtId } : {}),
    [districtId]
  )
}
