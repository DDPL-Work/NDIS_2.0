import { apiRequest } from './apiClient'
import { mapComplaintList, registerComplaintReference } from './mappers/complaintMapper'

const mapDashboard = (dto = {}) => {
  // Dashboard payload fields differ by role, but any embedded complaint DTOs
  // cross the same mapper boundary as the list endpoint.  Rows also feed the
  // name -> pk reference catalog used by complaint creation.
  const myComplaints = mapComplaintList(dto.my_complaints || dto.myComplaints || [])
  const complaints = mapComplaintList(dto.complaints || dto.results || [])
  registerComplaintReference([...myComplaints, ...complaints])
  return {
    ...dto,
    myComplaints,
    complaints,
    raw: dto,
  }
}
export const backendDashboardApi = {
  citizen: () => apiRequest('/dashboards/citizen/').then(mapDashboard),
  department: (params = {}) => apiRequest(`/dashboards/department/${toQuery(params)}`).then(mapDashboard),
  officer: () => apiRequest('/dashboards/officer/').then(mapDashboard),
  district: (params = {}) => apiRequest(`/dashboards/district/${toQuery(params)}`).then(mapDashboard),
  state: (params = {}) => apiRequest(`/dashboards/state/${toQuery(params)}`).then(mapDashboard),
}

function toQuery(params) {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}
