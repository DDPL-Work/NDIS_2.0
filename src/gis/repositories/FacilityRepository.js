import { backendGisApi } from '../../api/gisApi'
import { facilityIdFromSlug } from '../../utils/createFacilitySlug'
export const FacilityRepository = {
  find: backendGisApi.facilities,
  findById: backendGisApi.facility,
  // Slug is routing-only: the backend never fetches by slug.  Resolve the
  // trailing id and load via GET /facilities/{id}/; for id-less slugs let
  // the API layer resolve the slug from the facility collection instead.
  findBySlug(slug) {
    const id = facilityIdFromSlug(slug)
    return id ? backendGisApi.facility(id) : backendGisApi.facility(slug)
  },
}
