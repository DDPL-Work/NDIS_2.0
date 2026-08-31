import { apiRequest, withQuery } from './apiClient'
import { mapSiteDiary, mapSiteDiaryList } from './mappers/siteDiaryMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// /api/site-diaries/ (backend_guide2.1 §7.2). Write payloads use the backend
// field vocabulary; reads are normalized by the site diary mapper.

export const backendSiteDiaryApi = {
  async list(params = {}) { return mapSiteDiaryList(await apiRequest(withQuery('/site-diaries/', params))) },
  async get(id) { return mapSiteDiary(await apiRequest(`/site-diaries/${id}/`)) },
  async create(payload) { const record = mapSiteDiary(await apiRequest('/site-diaries/', { method: 'POST', body: payload })); invalidateData(DATA_SCOPES.SITE_DIARIES); return record },
  async update(id, payload) { const record = mapSiteDiary(await apiRequest(`/site-diaries/${id}/`, { method: 'PATCH', body: payload })); invalidateData(DATA_SCOPES.SITE_DIARIES); return record },
  async remove(id) { await apiRequest(`/site-diaries/${id}/`, { method: 'DELETE' }); invalidateData(DATA_SCOPES.SITE_DIARIES) },
}
