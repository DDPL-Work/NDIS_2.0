import { apiRequest, withQuery } from './apiClient'

// Backend-driven gap and priority API — fully aligned to live backend contracts.
//
// Live backend endpoints (verified against https://nalanda.drdesigntech.com/api):
//
//   GET /api/gap-priority/              — PRIMARY: overview + results (ranked facilities)
//   GET /api/gap-priority/overview/     — Overview-only: gap_assessment, weights, model_version
//   GET /api/gap-priority/map/          — GeoJSON FeatureCollection with real coordinates
//   GET /api/gap-priority/{facility_id}/ — Individual facility gap detail
//   GET /api/gap-analysis/              — Gap analysis records (facility-level)
//
// NOTE: /api/gap-priority/rankings/ returns empty rankings always — DO NOT USE.
//       Rankings come from GET /api/gap-priority/ → results array.
//
// All scoring logic, weights, model versioning and component breakdowns are
// authoritative on the backend. The frontend ONLY renders what the backend returns.
// Nothing is fabricated — no fallback scores, no invented weights, no synthetic rankings.

// ---------------------------------------------------------------------------
// Field mapping: backend snake_case → frontend camelCase
// ---------------------------------------------------------------------------

function mapFacilityResult(item) {
  return {
    id: item.facility_id,
    name: item.facility_name,
    departmentCode: item.department_code,
    gapScore: item.gap_score,
    priority: item.priority,
    components: item.components || {},
    reasonCodes: item.reason_codes || [],
    modelVersion: item.model_version,
    weightsUsed: item.weights_used || {},
  }
}

function mapOverview(raw) {
  const ga = raw?.gap_assessment || {}
  const mv = raw?.model_version || {}
  return {
    status: raw?.status,
    totalLocations: ga.total_locations_assessed ?? 0,
    criticalCount: ga.critical_count ?? 0,
    highCount: ga.high_count ?? 0,
    mediumCount: ga.medium_count ?? 0,
    lowCount: ga.low_count ?? 0,
    averageGapScore: ga.average_gap_score ?? null,
    weights: raw?.weights || raw?.dimension_weights || {},
    modelVersion: mv.version || raw?.model_version || null,
    modelDescription: mv.description || null,
    modelUpdatedAt: mv.updated_at || null,
  }
}

// ---------------------------------------------------------------------------
// API methods — each returns backend-authoritative data
// ---------------------------------------------------------------------------

export const backendGapApi = {
  // PRIMARY DATA SOURCE — returns overview + ranked results in one call
  // GET /api/gap-priority/?department={code}&district={id}
  async list(params = {}) {
    const raw = await apiRequest(withQuery('/gap-priority/', params))
    return {
      overview: mapOverview(raw),
      results: Array.isArray(raw?.results) ? raw.results.map(mapFacilityResult) : [],
      count: raw?.count ?? 0,
      raw,
    }
  },

  // Overview-only — GET /api/gap-priority/overview/?district={id}
  async overview(districtId, params = {}) {
    const raw = await apiRequest(withQuery('/gap-priority/overview/', { district: districtId, ...params }))
    return mapOverview(raw)
  },

  // Map data — GET /api/gap-priority/map/?district={id}
  // Returns GeoJSON FeatureCollection with real coordinates
  async mapData(districtId, params = {}) {
    return apiRequest(withQuery('/gap-priority/map/', { district: districtId, ...params }))
  },

  // Individual facility detail — GET /api/gap-priority/{facilityId}/
  async facilityDetail(facilityId) {
    const raw = await apiRequest(`/gap-priority/${facilityId}/`)
    return raw
  },

  // Legacy compat: districtSummary (calls overview)
  async districtSummary(districtId, params = {}) {
    return this.overview(districtId, params)
  },

  // Legacy compat: rankings (falls back to main list since /rankings/ is empty)
  async rankings(districtId, { limit = 50, priority = null, department = null } = {}) {
    const params = { limit }
    if (districtId) params.district = districtId
    if (priority) params.priority = priority
    if (department) params.department = department
    const raw = await apiRequest(withQuery('/gap-priority/', params))
    const results = Array.isArray(raw?.results) ? raw.results.map(mapFacilityResult) : []
    return { rankings: results, count: raw?.count ?? 0 }
  },

  // Model metadata — derive from overview
  async modelMetadata(districtId) {
    try {
      const raw = await apiRequest(withQuery('/gap-priority/overview/', districtId ? { district: districtId } : {}))
      const mv = raw?.model_version || {}
      return {
        modelVersion: mv.version || null,
        calculatedAt: mv.updated_at || null,
        weightVersion: mv.version || null,
        description: mv.description || null,
      }
    } catch {
      return null
    }
  },

  // Drilldown — GET /api/gap-priority/?drilldown=true
  async drilldown(districtId) {
    return apiRequest(withQuery('/gap-priority/', { district: districtId, drilldown: true }))
  },

  // Gap analysis list — GET /api/gap-analysis/
  async gapAnalysisList(params = {}) {
    return apiRequest(withQuery('/gap-analysis/', params))
  },

  // Gap analysis detail — GET /api/gap-analysis/{id}/
  async gapAnalysisDetail(id) {
    return apiRequest(`/gap-analysis/${id}/`)
  },
}

export default backendGapApi
