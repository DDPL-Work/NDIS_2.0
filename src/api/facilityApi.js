import { apiRequest } from '../services/httpClient'
import { backendGisApi } from './gisApi'
import { mapFacility } from './mappers/facilityMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'
import { cachedFacilities } from './facilityCache'

// Backend Facility (physical asset registry) CRUD + asset categories + SCD
// Type 2 audit history. Reads go through backendGisApi so every consumer
// shares the single cachedFacilities collection; writes hit /api/facilities/
// directly, return the mapped record for local state updates, bump the
// FACILITIES/GIS invalidation scopes and evict the matching shared-cache
// entries so no view can present a stale facility as live data.
const rows = (response) => (Array.isArray(response) ? response : response?.results || response?.data || [])

const touched = (departmentId) => {
  invalidateData(DATA_SCOPES.FACILITIES)
  invalidateData(DATA_SCOPES.GIS)
  cachedFacilities.invalidate({ departmentId })
}

export const backendFacilityApi = {
  async list(params = {}) { return backendGisApi.facilities(params) },
  async get(id) { return backendGisApi.facility(id) },
  async create(payload) {
    const facility = mapFacility(await apiRequest('/facilities/', { method: 'POST', body: payload }))
    touched(payload?.department ?? facility.departmentId)
    return facility
  },
  async update(id, payload) {
    const facility = mapFacility(await apiRequest(`/facilities/${id}/`, { method: 'PATCH', body: payload }))
    touched(payload?.department ?? facility.departmentId)
    return facility
  },
  async history(id) { return rows(await apiRequest(`/facilities/${id}/history/`)) },
  // Asset categories carry the JSON field_schema; the endpoint is optional on
  // some deployments, so the call degrades to [] — the registry itself never
  // falls back to fabricated categories.
  async categories(departmentId) {
    try {
      return rows(await apiRequest(`/asset-categories/${departmentId ? `?department=${departmentId}` : ''}`)).map((dto) => ({
        id: String(dto.id),
        name: dto.name || 'Unnamed category',
        departmentId: String(dto.department ?? dto.department_id ?? ''),
        schema: dto.field_schema || {},
      }))
    } catch { return [] }
  },
}
