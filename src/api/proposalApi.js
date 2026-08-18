import { apiRequest } from './apiClient'
import { mapProposal, mapProposalList } from './mappers/proposalMapper'
import { mapNegotiationList, mapReleaseList, NEGOTIATION_MAPPER_BUILD } from './mappers/negotiationMapper'
import { invalidateData, DATA_SCOPES } from '../app/store/dataVersionStore'

// App filter vocabulary -> backend ProposalStatus.TextChoices values.
// Presentation-only: values sent to the backend always use the backend's own
// uppercase choices; the backend status remains authoritative.
const STATUS_TO_BACKEND = {
  draft: 'DRAFT_DPR',
  pending_review: 'PENDING_REVIEW',
  approved: 'APPROVED',
  sanctioned: 'SANCTIONED',
  in_execution: 'IN_EXECUTION',
  completed: 'COMPLETED',
  rejected: 'REJECTED',
}

const toBackendFilters = (params = {}) => {
  const filters = {}
  Object.entries(params).forEach(([key, item]) => {
    if (item === undefined || item === null || item === '') return
    if (key === 'status') {
      filters.status = STATUS_TO_BACKEND[String(item).toLowerCase()] || String(item).toUpperCase()
    } else if (key === 'departmentId' || key === 'department_id') {
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

export const backendProposalApi = {
  async list(params = {}) { return mapProposalList(await apiRequest(`/proposals/${toQuery(toBackendFilters(params))}`)) },
  async get(id) { return mapProposal(await apiRequest(`/proposals/${id}/`)) },
  async create(payload) { const proposal = mapProposal(await apiRequest('/proposals/', { method: 'POST', body: payload })); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.PLANNING])(); return proposal },
  async update(id, payload) { const proposal = mapProposal(await apiRequest(`/proposals/${id}/`, { method: 'PATCH', body: payload })); touched([DATA_SCOPES.PROPOSALS])(); return proposal },
  async remove(id) { await apiRequest(`/proposals/${id}/`, { method: 'DELETE' }); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.PLANNING])() },
  // Step 2 — Survey & site inspection
  async saveSurveyInspection(id, payload) { const response = await apiRequest(`/proposals/${id}/step2-survey-inspection/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  // Step 3 — Technical DPR
  async saveTechnicalDpr(id, payload) { const response = await apiRequest(`/proposals/${id}/step3-technical-dpr/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  // Step 4 — Financial estimation (grand total is computed by the backend)
  async saveFinancialEstimation(id, payload) { const response = await apiRequest(`/proposals/${id}/step4-financial-estimation/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  // Step 5 — Clearances
  async saveClearances(id, payload) { const response = await apiRequest(`/proposals/${id}/step5-clearances/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  // Step 6 — Attachments (multipart; the http client manages the boundary)
  async uploadAttachments(id, formData) { const response = await apiRequest(`/proposals/${id}/step6-attachments/`, { method: 'POST', body: formData }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  // Step 7 — Submit (DRAFT_DPR -> PENDING_REVIEW, decided by the backend)
  async submit(id) { const response = await apiRequest(`/proposals/${id}/submit/`, { method: 'POST' }); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.PLANNING])(); return response },
  async approve(id) { const response = await apiRequest(`/proposals/${id}/approve/`, { method: 'POST' }); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.PLANNING])(); return response },
  async reject(id, payload = {}) { const response = await apiRequest(`/proposals/${id}/reject/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.PLANNING])(); return response },
  async sanction(id, payload) { const response = await apiRequest(`/proposals/${id}/sanction/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.PLANNING, DATA_SCOPES.PROJECTS, DATA_SCOPES.DASHBOARD])(); return response },
  // Negotiation — the backend resolves the state machine and writes the
  // agreed_amount / agreed_timeline_days / agreed_scope / approval_mode;
  // estimated_cost is never overwritten on this side.
  async negotiate(id, payload) { const response = await apiRequest(`/proposals/${id}/negotiation/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  async respondNegotiation(id, payload) { const response = await apiRequest(`/proposals/${id}/negotiation-response/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS])(); return response },
  // TEMPORARY RUNTIME DEBUGGING — keep until the browser test for proposal 13
  // passes, then gate/remove. Logs the exact body apiRequest resolved (the
  // backend returns the round as a bare object) and the normalized list.
  // TEMPORARY BROWSER DIAGNOSIS — UNCONDITIONAL LOGS + BUILD MARKER. Remove
  // once proposal 13 shows the decision panel. The marker proves which mapper
  // module the browser executed; the logs capture raw -> normalized -> direct
  // test in one synchronous chain (before the component's SET STATE log).
  async negotiations(id, params = {}) {
    console.log('[NEGOTIATION MODULE BUILD]', NEGOTIATION_MAPPER_BUILD)
    const raw = await apiRequest(`/proposals/${id}/negotiations/${toQuery(params)}`)
    console.log('[NEGOTIATION RAW RESPONSE]', JSON.stringify(raw, null, 2))
    console.log('[NEGOTIATION RAW TYPE]', typeof raw, Array.isArray(raw), raw && typeof raw === 'object' ? Object.keys(raw) : null)
    const normalized = mapNegotiationList(raw)
    console.log('[NEGOTIATION NORMALIZED]', JSON.stringify(normalized, null, 2))
    console.log('[NEGOTIATION NORMALIZED LENGTH]', Array.isArray(normalized) ? normalized.length : 'NOT_ARRAY')
    console.log('[EXECUTED NEGOTIATION MAPPER]', mapNegotiationList.toString())
    const directTest = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : [])
    console.log('[NEGOTIATION DIRECT TEST]', directTest, { length: Array.isArray(directTest) ? directTest.length : null })
    if (Array.isArray(normalized) && normalized.length === 0 && Array.isArray(directTest) && directTest.length > 0) console.log('[NEGOTIATION STALE MAPPER] direct test wraps the raw body but mapNegotiationList returned [] — the executed mapper module predates the bare-record fix')
    return normalized
  },
  async proposalNegotiations(params = {}) { return mapNegotiationList(await apiRequest(`/proposal-negotiations/${toQuery(toBackendFilters(params))}`)) },
  // Budget release — FULL | INSTALLMENT modes; balances stay backend-authoritative.
  async release(id, payload) { const response = await apiRequest(`/proposals/${id}/release/`, { method: 'POST', body: payload }); touched([DATA_SCOPES.PROPOSALS, DATA_SCOPES.DASHBOARD, DATA_SCOPES.PROJECTS])(); return response },
  async releases(id, params = {}) { return mapReleaseList(await apiRequest(`/proposals/${id}/releases/${toQuery(params)}`)) },
  async proposalReleases(params = {}) { return mapReleaseList(await apiRequest(`/proposal-releases/${toQuery(toBackendFilters(params))}`)) },
}
