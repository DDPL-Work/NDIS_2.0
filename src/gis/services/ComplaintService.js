import { ComplaintRepository } from '../repositories/ComplaintRepository'

// Complaint service layer: translates the app-level workflow state vocabulary
// onto the backend action endpoints (backend_guide.md §10.5) and owns action
// payloads.  The service holds NO fetch logic itself — every call delegates to
// the single shared ComplaintRepository so the HTTP boundary stays in one place.
const ACTION_ENDPOINTS = {
  assigned: 'assign',
  accepted: 'accept',
  inspection_scheduled: 'startInspection',
  inspection_started: 'startInspection',
  work_started: 'startInspection',
  inspection_completed: 'resolve',
  work_completed: 'resolve',
  resolved: 'resolve',
  verification_pending: 'resolve',
  closed: 'close',
  reopened: 'reopen',
  escalated: 'escalate',
  rejected: 'reject',
  transferred: 'transfer',
}

function actionBody(endpoint, remarks = '', reason = '') {
  if (endpoint === 'reopen' || endpoint === 'escalate' || endpoint === 'reject') return { reason: reason || remarks || 'Requested via portal.' }
  if (endpoint === 'assign') return { remarks: remarks || 'Assigned via department portal.' }
  if (endpoint === 'resolve') return { resolution_summary: remarks || 'Resolved via department portal.' }
  // accept / startInspection carry optional remarks; the target_user_id for
  // startInspection and target_department_id for transfer arrive via payload.
  if (endpoint === 'startInspection' || endpoint === 'accept') return { remarks: remarks || '' }
  return {}
}

export const ComplaintService = {
  async performAction(complaintId, nextState, { remarks = '', reason = '', payload = {} } = {}) {
    const endpoint = ACTION_ENDPOINTS[nextState]
    if (!endpoint) throw new Error(`Unsupported workflow action: ${nextState}`)
    const body = { ...actionBody(endpoint, remarks, reason), ...payload }
    return ComplaintRepository[endpoint](complaintId, body)
  },

  create: (payload) => ComplaintRepository.create(payload),

  async submitCitizenFeedback(complaintId, { rating, comment = '' }) {
    return ComplaintRepository.feedback(complaintId, { rating: rating ?? null, feedback_comment: comment })
  },

  reopen: (complaintId, reason) => ComplaintRepository.reopen(complaintId, { reason: reason || 'Citizen requested rework.' }),

  escalate: (complaintId, reason) => ComplaintRepository.escalate(complaintId, { reason: reason || 'SLA breach escalation.' }),

  close: (complaintId) => ComplaintRepository.close(complaintId),
}