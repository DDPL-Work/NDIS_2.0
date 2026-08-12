import { apiRequest } from './apiClient'
import { mapGeneratedReport, mapReportList } from './mappers/reportMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// /api/reports/ (backend_guide2.1 §8). Reads are normalized by the report
// mapper; the download action returns the raw HTTP response so callers can
// consume the served PDF/CSV blob without altering httpClient's JSON default.
const toQuery = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== null && item !== '').map(([key, item]) => [key, String(item)]))
  return value.toString() ? `?${value}` : ''
}

const rows = (response) => (Array.isArray(response) ? response : response?.results || response?.data || [])

const filenameFrom = (response) => {
  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^";]+)"?/)
  return match ? match[1] : ''
}

export const backendReportApi = {
  async list(params = {}) { return mapReportList(rows(await apiRequest(`/reports/${toQuery(params)}`))) },
  async generate(payload) { const result = mapGeneratedReport(await apiRequest('/reports/generate/', { method: 'POST', body: payload })); invalidateData(DATA_SCOPES.REPORTS); return result },
  async download(id) {
    const response = await apiRequest(`/reports/${id}/download/`, { raw: true })
    return { blob: await response.blob(), filename: filenameFrom(response), contentType: response.headers.get('Content-Type') || '' }
  },
}
