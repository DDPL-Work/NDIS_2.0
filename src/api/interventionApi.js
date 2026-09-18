// Intervention Proposal API — wraps POST /api/interventions/propose/ and its
// dedicated status-action endpoints.  Maps backend snake_case DTOs into the
// frontend model via a local mapper.  All writes bump the INTERVENTIONS
// data-version scope so the DM schedule refreshes reactively.

import { apiRequest, withQuery, normalizeRows } from './apiClient'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// ---------------------------------------------------------------------------
// Mapper — backend DTO → frontend model
// ---------------------------------------------------------------------------

function mapIntervention(dto = {}) {
  return {
    id: dto.id,
    title: dto.title || '',
    facilityName: dto.facility_name || '',
    facilityType: dto.facility_type || '',
    locationName: dto.location_name || '',
    departmentCode: dto.department_code || '',
    departmentName: dto.department_name || '',
    districtName: dto.district_name || '',
    district: dto.district ?? null,
    blockName: dto.block_name || '',
    block: dto.block ?? null,
    interventionType: dto.intervention_type || '',
    description: dto.description || '',
    estimatedCost: normalizeCost(dto.estimated_cost),
    expectedTimeline: dto.expected_timeline || '',
    coverageGapScore: dto.coverage_gap_score ?? null,
    priorityLevel: dto.priority_level || '',
    status: dto.status || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

function normalizeCost(value) {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

// ---------------------------------------------------------------------------
// Helper — bump data-version after writes
// ---------------------------------------------------------------------------

const touched = () => {
  invalidateData(DATA_SCOPES.INTERVENTIONS)
  invalidateData(DATA_SCOPES.PLANNING)
  invalidateData(DATA_SCOPES.DASHBOARD)
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const backendInterventionApi = {
  /** GET /api/interventions/propose/ */
  async list(params = {}) {
    const raw = await apiRequest(withQuery('/interventions/propose/', params))
    const rows = normalizeRows(raw)
    return rows.map(mapIntervention)
  },

  /** GET /api/interventions/propose/{id}/ */
  async get(id) {
    return mapIntervention(await apiRequest(`/interventions/propose/${id}/`))
  },

  /** POST /api/interventions/propose/ */
  async create(payload) {
    const intervention = mapIntervention(
      await apiRequest('/interventions/propose/', { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },

  /** PATCH /api/interventions/propose/{id}/ */
  async update(id, payload) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/`, { method: 'PATCH', body: payload })
    )
    touched()
    return intervention
  },

  /** PUT /api/interventions/propose/{id}/ */
  async replace(id, payload) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/`, { method: 'PUT', body: payload })
    )
    touched()
    return intervention
  },

  /** DELETE /api/interventions/propose/{id}/ */
  async remove(id) {
    await apiRequest(`/interventions/propose/${id}/`, { method: 'DELETE' })
    touched()
  },

  // -----------------------------------------------------------------------
  // Dedicated status-action endpoints
  // -----------------------------------------------------------------------

  /** POST /api/interventions/propose/{id}/review/ */
  async review(id, payload = {}) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/review/`, { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },

  /** POST /api/interventions/propose/{id}/approve/ */
  async approve(id, payload = {}) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/approve/`, { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },

  /** POST /api/interventions/propose/{id}/reject/ */
  async reject(id, payload = {}) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/reject/`, { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },

  /** POST /api/interventions/propose/{id}/start/ */
  async start(id, payload = {}) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/start/`, { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },

  /** POST /api/interventions/propose/{id}/complete/ */
  async complete(id, payload = {}) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/complete/`, { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },

  /** POST /api/interventions/propose/{id}/cancel/ */
  async cancel(id, payload = {}) {
    const intervention = mapIntervention(
      await apiRequest(`/interventions/propose/${id}/cancel/`, { method: 'POST', body: payload })
    )
    touched()
    return intervention
  },
}

export default backendInterventionApi
