import { apiRequest } from './apiClient'

// Backend-driven gap and priority API. All scoring logic, weights, model
// versioning and component breakdowns are authoritative on the backend.
// The frontend ONLY renders what the backend returns — never invents scores,
// weights or fallbacks. When data is missing the UI shows "Data unavailable".

export const backendGapApi = {
  // Overall district gap summary with component breakdown
  // GET /api/gap/district/{districtId}/
  async districtSummary(districtId, params = {}) {
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/gap/district/${districtId}/${qs ? `?${qs}` : ''}`)
  },

  // Facility-level gap detail with full component breakdown, weights, model version
  // GET /api/gap/facility/{facilityId}/
  async facilityDetail(facilityId) {
    return apiRequest(`/gap/facility/${facilityId}/`)
  },

  // Village-level gap aggregate
  // GET /api/gap/village/{villageId}/
  async villageDetail(villageId) {
    return apiRequest(`/gap/village/${villageId}/`)
  },

  // Block-level gap aggregate
  // GET /api/gap/block/{blockId}/
  async blockDetail(blockId) {
    return apiRequest(`/gap/block/${blockId}/`)
  },

  // Priority rankings — top facilities/villages/blocks by priority
  // GET /api/gap/rankings/?district={districtId}&type=facility|village|block&limit=50
  async rankings(districtId, { type = 'facility', limit = 50, priority = null } = {}) {
    const params = { district: districtId, type, limit }
    if (priority) params.priority = priority
    const qs = new URLSearchParams(params).toString()
    return apiRequest(`/gap/rankings/${qs ? `?${qs}` : ''}`)
  },

  // Model metadata — version, calculation date, weight version
  // GET /api/gap/model-metadata/
  async modelMetadata(districtId) {
    return apiRequest(`/gap/model-metadata/${districtId ? `?district=${districtId}` : ''}`)
  },

  // Drilldown hierarchy — District → Block → Village → Facility with scores
  // GET /api/gap/drilldown/?district={districtId}
  async drilldown(districtId) {
    return apiRequest(`/gap/drilldown/?district=${districtId}`)
  },

  // Map data for P1-P4 visualization
  // GET /api/gap/map/?district={districtId}
  async mapData(districtId, params = {}) {
    const qs = new URLSearchParams({ district: districtId, ...params }).toString()
    return apiRequest(`/gap/map/${qs ? `?${qs}` : ''}`)
  },
}

export default backendGapApi