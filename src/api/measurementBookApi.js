import { apiRequest } from './apiClient'
import { mapMeasurementBook, mapMeasurementBookList } from './mappers/measurementBookMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// /api/measurement-books/ (backend_guide2.1 §7.3). Write payloads use the
// backend field vocabulary; reads are normalized by the e-MB mapper.
const toQuery = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

export const backendMeasurementBookApi = {
  async list(params = {}) { return mapMeasurementBookList(await apiRequest(`/measurement-books/${toQuery(params)}`)) },
  async get(id) { return mapMeasurementBook(await apiRequest(`/measurement-books/${id}/`)) },
  async create(payload) { const record = mapMeasurementBook(await apiRequest('/measurement-books/', { method: 'POST', body: payload })); invalidateData(DATA_SCOPES.MEASUREMENT_BOOKS); return record },
  async update(id, payload) { const record = mapMeasurementBook(await apiRequest(`/measurement-books/${id}/`, { method: 'PATCH', body: payload })); invalidateData(DATA_SCOPES.MEASUREMENT_BOOKS); return record },
  async remove(id) { await apiRequest(`/measurement-books/${id}/`, { method: 'DELETE' }); invalidateData(DATA_SCOPES.MEASUREMENT_BOOKS) },
}
