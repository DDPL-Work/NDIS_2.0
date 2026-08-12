import { apiRequest } from './apiClient'
import { mapBill, mapBillList } from './mappers/billMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// /api/bills/ (backend_guide2.1 §7.4). Financial access is restricted to the
// DM and Department Heads on the backend.  This layer deliberately does not
// catch 401/403 — an authorization failure stays an ApiError and is never
// collapsed into an empty "no bills" collection.
const toQuery = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

export const backendBillApi = {
  async list(params = {}) { return mapBillList(await apiRequest(`/bills/${toQuery(params)}`)) },
  async get(id) { return mapBill(await apiRequest(`/bills/${id}/`)) },
  async create(payload) { const record = mapBill(await apiRequest('/bills/', { method: 'POST', body: payload })); invalidateData(DATA_SCOPES.BILLS); invalidateData(DATA_SCOPES.PROJECTS); return record },
  async update(id, payload) { const record = mapBill(await apiRequest(`/bills/${id}/`, { method: 'PATCH', body: payload })); invalidateData(DATA_SCOPES.BILLS); invalidateData(DATA_SCOPES.PROJECTS); return record },
  async remove(id) { await apiRequest(`/bills/${id}/`, { method: 'DELETE' }); invalidateData(DATA_SCOPES.BILLS); invalidateData(DATA_SCOPES.PROJECTS) },
}
