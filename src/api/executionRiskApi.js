import { apiRequest } from './apiClient'
import { mapExecutionRisk, mapExecutionRiskList } from './mappers/executionRiskMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// /api/execution-risks/ (backend_guide2.1 §7.5). Supports `project` and
// `severity` filters. Risk records are backend-driven; no risk is derived
// from project progress on this side. Reads are normalized by the risk mapper.
const toQuery = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

export const backendExecutionRiskApi = {
  async list(params = {}) { return mapExecutionRiskList(await apiRequest(`/execution-risks/${toQuery(params)}`)) },
  async get(id) { return mapExecutionRisk(await apiRequest(`/execution-risks/${id}/`)) },
  async create(payload) { const record = mapExecutionRisk(await apiRequest('/execution-risks/', { method: 'POST', body: payload })); invalidateData(DATA_SCOPES.RISKS); invalidateData(DATA_SCOPES.PROJECTS); return record },
  async update(id, payload) { const record = mapExecutionRisk(await apiRequest(`/execution-risks/${id}/`, { method: 'PATCH', body: payload })); invalidateData(DATA_SCOPES.RISKS); invalidateData(DATA_SCOPES.PROJECTS); return record },
  async remove(id) { await apiRequest(`/execution-risks/${id}/`, { method: 'DELETE' }); invalidateData(DATA_SCOPES.RISKS); invalidateData(DATA_SCOPES.PROJECTS) },
}
