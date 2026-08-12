import { apiRequest } from './apiClient'
import { mapProject, mapProjectList, mapProjectSummary } from './mappers/projectMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

const toBackendFilters = (params = {}) => {
  const filters = {}
  Object.entries(params).forEach(([key, item]) => {
    if (item === undefined || item === null || item === '') return
    if (key === 'departmentId' || key === 'department_id') {
      filters.department = item
    } else if (key === 'districtId' || key === 'district_id') {
      filters.district = item
    } else {
      filters[key] = item
    }
  })
  return filters
}

const toQuery = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

const touched = (scopes) => () => scopes.forEach((scope) => invalidateData(scope))

export const backendProjectApi = {
  async list(params = {}) { return mapProjectList(await apiRequest(`/projects/${toQuery(toBackendFilters(params))}`)) },
  async get(id) { return mapProject(await apiRequest(`/projects/${id}/`)) },
  async create(payload) { const project = mapProject(await apiRequest('/projects/', { method: 'POST', body: payload })); touched([DATA_SCOPES.PROJECTS])(); return project },
  async update(id, payload) { const project = mapProject(await apiRequest(`/projects/${id}/`, { method: 'PATCH', body: payload })); touched([DATA_SCOPES.PROJECTS])(); return project },
  async remove(id) { await apiRequest(`/projects/${id}/`, { method: 'DELETE' }); touched([DATA_SCOPES.PROJECTS])() },
  // Aggregate KPI summary — the backend is the source of truth (§7.1)
  async summary() { return mapProjectSummary(await apiRequest('/projects/summary/')) },
  // Daily physical progress, labour, materials, weather, risk signal.
  // Reaching 100% transitions the project to COMPLETED on the backend.
  async dailyProgress(id, payload) { const response = await apiRequest(`/projects/${id}/daily-progress/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.SITE_DIARIES])(); return response },
  // Budget sanction — issues sanction order number and sets IN_EXECUTION.
  async sanction(id, payload) { const response = await apiRequest(`/projects/${id}/sanction/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS])(); return response },
}
