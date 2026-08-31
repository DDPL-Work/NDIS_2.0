import { apiRequest, withQuery } from './apiClient'
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
  department: (params = {}) => apiRequest(withQuery('/dashboards/department/', params)).then(mapDashboardEnvelope),
  officer: () => apiRequest('/dashboards/officer/').then(mapDashboardEnvelope),
  fieldInspector: () => apiRequest('/dashboards/field-inspector/').then(mapDashboardEnvelope),
  district: (params = {}) => apiRequest(withQuery('/dashboards/district/', params)).then(mapDashboardEnvelope),
  districtCollector: (params = {}) => apiRequest(withQuery('/dashboards/district-collector/', params)).then(mapDashboardEnvelope),
  dm: (params = {}) => apiRequest(withQuery('/dashboards/dm/', params)).then(mapDashboardEnvelope),
  adm: (params = {}) => apiRequest(withQuery('/dashboards/adm/', params)).then(mapDashboardEnvelope),
  state: (params = {}) => apiRequest(withQuery('/dashboards/state/', params)).then(mapDashboardEnvelope),
}