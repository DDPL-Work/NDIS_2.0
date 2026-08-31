import { apiRequest, withQuery } from './apiClient'
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

const touched = (scopes) => () => scopes.forEach((scope) => invalidateData(scope))

export const backendProjectApi = {
  async list(params = {}) { return mapProjectList(await apiRequest(withQuery('/projects/', toBackendFilters(params)))) },
  async get(id) { return mapProject(await apiRequest(`/projects/${id}/`)) },
  async create(payload) { const project = mapProject(await apiRequest('/projects/', { method: 'POST', body: payload })); touched([DATA_SCOPES.PROJECTS])(); return project },
  async update(id, payload) { const project = mapProject(await apiRequest(`/projects/${id}/`, { method: 'PATCH', body: payload })); touched([DATA_SCOPES.PROJECTS])(); return project },
  async remove(id) { await apiRequest(`/projects/${id}/`, { method: 'DELETE' }); touched([DATA_SCOPES.PROJECTS])() },
  // Aggregate KPI summary — the backend is the source of truth (§7.1)
  async summary() { return mapProjectSummary(await apiRequest('/projects/summary/')) },
  // Daily physical progress, labour, materials, weather, risk signal.
  // Reaching 100% transitions the project to COMPLETED on the backend.
  async dailyProgress(id, payload) { const response = await apiRequest(`/projects/${id}/daily-progress/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.SITE_DIARIES, DATA_SCOPES.REPORTS, DATA_SCOPES.DASHBOARD])(); return response },
  // Budget sanction — issues sanction order number and sets IN_EXECUTION.
  async sanction(id, payload) { const response = await apiRequest(`/projects/${id}/sanction/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.PROPOSALS, DATA_SCOPES.DASHBOARD])(); return response },
  // Assign contractor to a sanctioned project.  The backend enforces that only
  // SANCTIONED projects accept assignment and that the caller has write permission.
  async assignWork(id, payload) { const response = await apiRequest(`/projects/${id}/assign-work/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.DASHBOARD])(); return response },
  // Assign a department officer to supervise the project.
  async assignOfficer(id, payload) { const response = await apiRequest(`/projects/${id}/assign-officer/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.DASHBOARD])(); return response },
  // Assign a field engineer to the project site.
  async assignEngineer(id, payload) { const response = await apiRequest(`/projects/${id}/assign-engineer/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.DASHBOARD])(); return response },
  // Officer review — approve, request revision, or reject the project stage.
  async officerReview(id, payload) { const response = await apiRequest(`/projects/${id}/officer-review/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.DASHBOARD])(); return response },
  // Verify completion — DM or authorized officer confirms physical completion.
  async verifyCompletion(id, payload) { const response = await apiRequest(`/projects/${id}/verify-completion/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.PROPOSALS, DATA_SCOPES.DASHBOARD])(); return response },
  // Record expenditure against a project.  Backend enforces released-amount limits
  // and duplicate reference checks.
  async expenditure(id, payload) { const response = await apiRequest(`/projects/${id}/expenditure/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROJECTS, DATA_SCOPES.BILLS, DATA_SCOPES.DASHBOARD])(); return response },
  // Get budget utilization breakdown for a project.
  async budgetUtilization(id) { return apiRequest(`/projects/${id}/budget-utilization/`) },
  // Site diaries sub-resource
  async listSiteDiaries(id, params = {}) { return apiRequest(withQuery(`/projects/${id}/site-diaries/`, params)) },
  // Measurement books sub-resource
  async listMeasurementBooks(id, params = {}) { return apiRequest(withQuery(`/projects/${id}/measurement-books/`, params)) },
  // Bills sub-resource
  async listBills(id, params = {}) { return apiRequest(withQuery(`/projects/${id}/bills/`, params)) },
  // Execution risks sub-resource
  async listRisks(id, params = {}) { return apiRequest(withQuery(`/projects/${id}/risks/`, params)) },
  // Project expenditures list
  async listExpenditures(id, params = {}) { return apiRequest(withQuery(`/projects/${id}/expenditures/`, params)) },
}
