import { apiRequest } from './apiClient'
import { mapComplaintList, registerComplaintReference } from './mappers/complaintMapper'
import { mapDashboard } from './mappers/citizenDashboardMapper'

const mapDashboardEnvelope = (dto = {}) => {
  const mapped = mapDashboard(dto)
  const myComplaints = mapComplaintList(dto.my_complaints || dto.myComplaints || [])
  const complaints = mapComplaintList(dto.complaints || dto.results || [])
  registerComplaintReference([...myComplaints, ...complaints])
  return { ...mapped, myComplaints, complaints }
}

export const backendDashboardApi = {
  citizen: () => apiRequest('/dashboards/citizen/').then(mapDashboardEnvelope),
  // Role-aware generic dashboard — the backend resolves the profile's role.
  myDashboard: () => apiRequest('/dashboards/my-dashboard/').then(mapDashboardEnvelope),
  department: (params = {}) => apiRequest(`/dashboards/department/${toQuery(params)}`).then(mapDashboardEnvelope),
  officer: () => apiRequest('/dashboards/officer/').then(mapDashboardEnvelope),
  fieldInspector: () => apiRequest('/dashboards/field-inspector/').then(mapDashboardEnvelope),
  district: (params = {}) => apiRequest(`/dashboards/district/${toQuery(params)}`).then(mapDashboardEnvelope),
  districtCollector: (params = {}) => apiRequest(`/dashboards/district-collector/${toQuery(params)}`).then(mapDashboardEnvelope),
  dm: (params = {}) => apiRequest(`/dashboards/dm/${toQuery(params)}`).then(mapDashboardEnvelope),
  adm: (params = {}) => apiRequest(`/dashboards/adm/${toQuery(params)}`).then(mapDashboardEnvelope),
  state: (params = {}) => apiRequest(`/dashboards/state/${toQuery(params)}`).then(mapDashboardEnvelope),
}

function toQuery(params) {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}