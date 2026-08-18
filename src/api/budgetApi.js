import { apiRequest } from './apiClient'
import { mapBudgetList, mapBudgetRecord, mapSchemeList, mapStateBudgetSummary } from './mappers/budgetMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// State budget & finance APIs (backend_next_guide §21–§22).  RBAC is enforced
// by the backend: only STATE_FINANCE_ADMIN / STATE_SUPER_ADMIN / STATE_ADMIN /
// SYSTEM_ADMINISTRATOR may read or mutate; other roles receive 403 which the
// screens surface verbatim.  Filters: financial_year, department, district,
// scheme.
const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params)
    .filter(([, item]) => item !== undefined && item !== null && item !== '')
    .map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

const touched = () => invalidateData(DATA_SCOPES.BUDGET)

const crud = (resource) => ({
  async list(params = {}) { return mapBudgetList(await apiRequest(`/${resource}/${query(params)}`)) },
  async get(id) { return mapBudgetRecord(await apiRequest(`/${resource}/${id}/`)) },
  async create(payload) { const record = mapBudgetRecord(await apiRequest(`/${resource}/`, { method: 'POST', body: payload })); touched(); return record },
  async update(id, payload) { const record = mapBudgetRecord(await apiRequest(`/${resource}/${id}/`, { method: 'PATCH', body: payload })); touched(); return record },
  async remove(id) { await apiRequest(`/${resource}/${id}/`, { method: 'DELETE' }); touched() },
})

export const backendBudgetApi = {
  stateBudgetSummary: (params = {}) => apiRequest(`/state-budget/summary/${query(params)}`).then(mapStateBudgetSummary),
  stateBudgets: crud('state-budgets'),
  departmentBudgets: crud('department-budgets'),
  districtAllocations: crud('district-allocations'),
  schemes: {
    async list(params = {}) { return mapSchemeList(await apiRequest(`/schemes/${query(params)}`)) },
    async get(id) { return mapBudgetRecord(await apiRequest(`/schemes/${id}/`)) },
    async create(payload) { const record = mapBudgetRecord(await apiRequest('/schemes/', { method: 'POST', body: payload })); touched(); return record },
    async update(id, payload) { const record = mapBudgetRecord(await apiRequest(`/schemes/${id}/`, { method: 'PATCH', body: payload })); touched(); return record },
    async remove(id) { await apiRequest(`/schemes/${id}/`, { method: 'DELETE' }); touched() },
  },
  financialLedger: crud('financial-ledger'),
}