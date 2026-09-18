// Inspection Schedule API — wraps POST /api/inspections/schedule/ and its
// dedicated status-action endpoints.  Maps backend snake_case DTOs into the
// frontend model via a local mapper.  All writes bump the INSPECTIONS
// data-version scope so the DM schedule refreshes reactively.

import { apiRequest, withQuery, normalizeRows } from './apiClient'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// ---------------------------------------------------------------------------
// Mapper — backend DTO → frontend model
// ---------------------------------------------------------------------------

function mapInspection(dto = {}) {
  return {
    id: dto.id,
    title: dto.title || '',
    locationName: dto.location_name || '',
    facilityName: dto.facility_name || '',
    facilityType: dto.facility_type || '',
    departmentCode: dto.department_code || '',
    departmentName: dto.department_name || '',
    districtName: dto.district_name || '',
    district: dto.district ?? null,
    blockName: dto.block_name || '',
    block: dto.block ?? null,
    inspectionPurpose: dto.inspection_purpose || '',
    preferredDate: dto.preferred_date || null,
    scheduledDate: dto.scheduled_date || null,
    scheduledTime: dto.scheduled_time || null,
    inspectionTeam: dto.inspection_team || '',
    inspectorName: dto.inspector_name || '',
    inspectorDesignation: dto.inspector_designation || '',
    instructions: dto.instructions || '',
    remarks: dto.remarks || '',
    status: dto.status || '',
    priorityLevel: dto.priority_level || '',
    coverageGapScore: dto.coverage_gap_score ?? null,
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

// ---------------------------------------------------------------------------
// Helper — bump data-version after writes
// ---------------------------------------------------------------------------

const touched = () => {
  invalidateData(DATA_SCOPES.INSPECTIONS)
  invalidateData(DATA_SCOPES.PROJECTS)
  invalidateData(DATA_SCOPES.DASHBOARD)
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const backendInspectionApi = {
  /** GET /api/inspections/schedule/ */
  async list(params = {}) {
    const raw = await apiRequest(withQuery('/inspections/schedule/', params))
    const rows = normalizeRows(raw)
    return rows.map(mapInspection)
  },

  /** GET /api/inspections/schedule/{id}/ */
  async get(id) {
    return mapInspection(await apiRequest(`/inspections/schedule/${id}/`))
  },

  /** POST /api/inspections/schedule/ */
  async create(payload) {
    const inspection = mapInspection(
      await apiRequest('/inspections/schedule/', { method: 'POST', body: payload })
    )
    touched()
    return inspection
  },

  /** PATCH /api/inspections/schedule/{id}/ */
  async update(id, payload) {
    const inspection = mapInspection(
      await apiRequest(`/inspections/schedule/${id}/`, { method: 'PATCH', body: payload })
    )
    touched()
    return inspection
  },

  /** PUT /api/inspections/schedule/{id}/ */
  async replace(id, payload) {
    const inspection = mapInspection(
      await apiRequest(`/inspections/schedule/${id}/`, { method: 'PUT', body: payload })
    )
    touched()
    return inspection
  },

  // -----------------------------------------------------------------------
  // Dedicated status-action endpoints
  // -----------------------------------------------------------------------

  /** POST /api/inspections/schedule/{id}/postpone/ */
  async postpone(id, payload = {}) {
    const inspection = mapInspection(
      await apiRequest(`/inspections/schedule/${id}/postpone/`, { method: 'POST', body: payload })
    )
    touched()
    return inspection
  },

  /** POST /api/inspections/schedule/{id}/complete/ */
  async complete(id, payload = {}) {
    const inspection = mapInspection(
      await apiRequest(`/inspections/schedule/${id}/complete/`, { method: 'POST', body: payload })
    )
    touched()
    return inspection
  },

  /** POST /api/inspections/schedule/{id}/cancel/ */
  async cancel(id, payload = {}) {
    const inspection = mapInspection(
      await apiRequest(`/inspections/schedule/${id}/cancel/`, { method: 'POST', body: payload })
    )
    touched()
    return inspection
  },
}

export default backendInspectionApi
