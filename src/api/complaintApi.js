import { apiRequest } from '../services/httpClient'
import { mapComplaint, mapComplaintList, registerComplaintReference, toComplaintDto } from './mappers/complaintMapper'
const query = (params = {}) => { const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)])); return value.toString() ? `?${value}` : '' }
export const backendComplaintApi = {
  async list(params) { const mapped = mapComplaintList(await apiRequest(`/complaints/${query(params)}`)); registerComplaintReference(mapped); return mapped },
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
