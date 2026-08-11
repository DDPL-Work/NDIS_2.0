import { apiRequest } from '../services/httpClient'
import { mapComplaint, mapComplaintList, registerComplaintReference, toComplaintDto } from './mappers/complaintMapper'

// App state vocabulary (lowercase, used by badges/steppers/tabs) -> backend
// ComplaintStatus.TextChoices values.  The list endpoint filters on `status`
// (the `state` alias is ignored by the backend), so tabs must send the
// backend's exact uppercase choices or every filter returns the full list.
const STATUS_TO_BACKEND = {
  submitted: 'SUBMITTED', assigned: 'ASSIGNED', accepted: 'ACCEPTED',
  inspection_started: 'INSPECTION_STARTED', evidence_uploaded: 'EVIDENCE_UPLOADED',
  resolved: 'RESOLVED', verification_pending: 'CITIZEN_VERIFICATION',
  closed: 'CLOSED', reopened: 'REOPENED', transferred: 'TRANSFERRED',
  escalated: 'ESCALATED', rejected: 'REJECTED', cancelled: 'CANCELLED', draft: 'DRAFT',
}

// Translate the app's filter vocabulary onto the backend query contract:
//   state -> status (uppercase TextChoices value)
//   departmentId -> department (integer pk)
// NOTE: the backend supports a single exact `status` value only (repeated
// params resolve to the last one and `status__in` is ignored) — views that
// need a status group must merge client-side.
const toBackendFilters = (params = {}) => {
  const filters = {}
  Object.entries(params).forEach(([key, item]) => {
    if (item === undefined || item === null || item === '') return
    if (key === 'state') {
      filters.status = STATUS_TO_BACKEND[String(item).toLowerCase()] || String(item).toUpperCase()
    } else if (key === 'departmentId' || key === 'department_id') {
      filters.department = item
    } else {
      filters[key] = item
    }
  })
  return filters
}
const query = (params = {}) => { const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)])); return value.toString() ? `?${value}` : '' }
export const backendComplaintApi = {
  async list(params) { const mapped = mapComplaintList(await apiRequest(`/complaints/${query(toBackendFilters(params))}`)); registerComplaintReference(mapped); return mapped },
  async create(payload) { return mapComplaint(await apiRequest('/complaints/', { method: 'POST', body: toComplaintDto(payload) })) },
  async byId(id) { const mapped = mapComplaint(await apiRequest(`/complaints/${id}/`)); registerComplaintReference([mapped]); return mapped },
  async timeline(id) { return apiRequest(`/complaints/${id}/timeline/`) },
  async assign(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/assign/`, { method: 'POST', body: payload })) },
  async accept(id, payload = {}) { return mapComplaint(await apiRequest(`/complaints/${id}/accept/`, { method: 'POST', body: payload })) },
  async startInspection(id, payload = {}) { return mapComplaint(await apiRequest(`/complaints/${id}/start-inspection/`, { method: 'POST', body: payload })) },
  async resolve(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/resolve/`, { method: 'POST', body: payload })) },
  async citizenFeedback(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/citizen-feedback/`, { method: 'POST', body: payload })) },
  async close(id) { return mapComplaint(await apiRequest(`/complaints/${id}/close/`, { method: 'POST' })) },
  async reopen(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/reopen/`, { method: 'POST', body: payload })) },
  async transfer(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/transfer/`, { method: 'POST', body: payload })) },
  async escalate(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/escalate/`, { method: 'POST', body: payload })) },
  async reject(id, payload) { return mapComplaint(await apiRequest(`/complaints/${id}/reject/`, { method: 'POST', body: payload })) },
  async uploadEvidence(id, files) { const body = new FormData(); Array.from(files || []).forEach((file) => body.append('files', file)); return apiRequest(`/complaints/${id}/upload-evidence/`, { method: 'POST', body }) },
  geojson: (params = {}) => apiRequest(`/complaints/geojson/${query(params)}`, { authenticated: false }),
  heatmap: (params = {}) => apiRequest(`/complaints/heatmap/${query(params)}`, { authenticated: false }),
  nearby: (params = {}) => apiRequest(`/complaints/nearby/${query(params)}`, { authenticated: false }),
  nearestFacility: (params = {}) => apiRequest(`/complaints/nearest-facility/${query(params)}`, { authenticated: false }),
}
