// Unique build marker — printed by proposalApi so the browser console proves
// which mapper module version is actually executed.
export const NEGOTIATION_MAPPER_BUILD = 'NEGOTIATION-MAPPER-FIX-2026-08-18-01'

// Proposal negotiation & budget release DTO normalization
// (backend_next_guide §16–§17).  The backend exposes TWO verified serializers:
//   • embedded on proposals:   proposed_amount, proposed_timeline_days, proposed_scope,
//                              negotiation_round, proposed_by, proposed_by_name
//   • dedicated /negotiations/: amount, timeline_days, scope, round, proposed_by
// Every alias below normalizes both shapes into ONE frontend DTO. Backend
// choice values (COUNTER_OFFER, ACCEPT, REJECT, OPEN, NEGOTIATED, ...) are
// preserved verbatim; amounts are coerced defensively.  Nothing is invented.
// Every verified response envelope is unwrapped into a list of round records:
//   • a plain array                                    -> as-is
//   • paginated {results: [...]}                       -> results
//   • the LIVE envelope {proposal_id, ..., history: [...]} -> history
//   • list wrappers {negotiations|rounds|data: [...]}  -> that key
//   • single-record wrappers {negotiation: {...}} …    -> wrapped in an array
//   • the bare record object itself (e.g. {round: 1, proposed_by: "DM", ...})
//                                                        -> wrapped in an array
// Anything else (null, metadata-only objects) -> []. When a body falls
// through, the mapper logs it in dev so an unexpected runtime shape is
// visible in the console instead of silently becoming an empty list.
const rows = (value) => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') {
    if (Array.isArray(value.negotiations)) return value.negotiations
    // ACTUAL live envelope of GET /proposals/{id}/negotiations/:
    // {proposal_id, estimated_cost, approval_mode, agreed_*, history: [...]}
    if (Array.isArray(value.history)) return value.history
    if (Array.isArray(value.rounds)) return value.rounds
    if (Array.isArray(value.results)) return value.results
    if (Array.isArray(value.data)) return value.data
    if (value.negotiation && typeof value.negotiation === 'object') return [value.negotiation]
    if (value.negotiations && typeof value.negotiations === 'object') return [value.negotiations]
    if (value.history && typeof value.history === 'object') return [value.history]
    if (value.rounds && typeof value.rounds === 'object') return [value.rounds]
    if (value.results && typeof value.results === 'object') return [value.results]
    if (value.data && typeof value.data === 'object') return [value.data]
    // ACTUAL ENDPOINT SHAPE — bare negotiation record (the dedicated
    // serializer returns the round directly, e.g. {round:1, proposed_by:"DM", ...}).
    if ('round' in value || 'negotiation_round' in value || 'status' in value || 'action' in value || 'proposed_by' in value || 'proposed_by_name' in value || 'amount' in value || 'id' in value) return [value]
    if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && import.meta.env.DEV) console.log('[NEGOTIATION MAPPER] unrecognized object body -> [] | type:', typeof value, '| keys:', Object.keys(value), '| body:', value)
  }
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && import.meta.env.DEV) console.log('[NEGOTIATION MAPPER] non-object/array body -> [] | type:', typeof value, '| body:', value)
  return []
}

const amount = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function mapNegotiation(dto = {}) {
  const status = dto.status || ''
  return {
    id: dto.id,
    proposalId: dto.proposal ?? dto.proposal_id ?? dto.proposalId,
    proposalTitle: dto.proposal_title || '',
    negotiationRound: dto.negotiation_round ?? dto.round ?? 0,
    action: dto.action || status,
    status,
    statusDisplay: dto.status_display || '',
    proposedBy: dto.proposed_by ?? dto.initiator_id ?? dto.proposedBy ?? null,
    proposedByName: dto.proposed_by_name ?? dto.proposed_by_display ?? dto.initiator_name ?? dto.initiator ?? dto.proposed_by ?? dto.proposedByName ?? '',
    proposedAmount: amount(dto.proposed_amount ?? dto.amount),
    proposedTimelineDays: amount(dto.proposed_timeline_days ?? dto.timeline_days),
    proposedScope: dto.proposed_scope ?? dto.scope ?? '',
    remarks: dto.remarks ?? dto.response_remarks ?? '',
    initiatorRole: dto.initiator_role || '',
    initiatorName: dto.initiator_name || '',
    createdAt: dto.created_at ?? dto.createdAt ?? null,
    updatedAt: dto.updated_at ?? dto.updatedAt ?? null,
    respondedBy: dto.responded_by ?? null,
    respondedByName: dto.responded_by_name ?? null,
    respondedAt: dto.responded_at ?? null,
    responseRemarks: dto.response_remarks ?? null,
    agreedAmount: amount(dto.agreed_amount),
    agreedTimelineDays: amount(dto.agreed_timeline_days),
    agreedScope: dto.agreed_scope || '',
    approvalMode: dto.approval_mode || '',
    raw: dto,
  }
}

export function mapRelease(dto = {}) {
  return {
    id: dto.id,
    proposalId: dto.proposal ?? dto.proposal_id ?? dto.proposalId,
    proposalTitle: dto.proposal_title || '',
    releaseNumber: dto.release_number || dto.release_no || '',
    mode: dto.mode || dto.release_type || '',
    trancheNumber: amount(dto.tranche_number),
    amount: amount(dto.amount),
    releasedAt: dto.released_at || dto.release_date || null,
    status: dto.status || '',
    statusDisplay: dto.status_display || '',
    referenceNumber: dto.reference_number || '',
    releasedByName: dto.released_by_name || '',
    remainingAmount: amount(dto.remaining_amount),
    remarks: dto.remarks || '',
    raw: dto,
  }
}

export const mapNegotiationList = (response) => rows(response).map(mapNegotiation)
export const mapReleaseList = (response) => rows(response).map(mapRelease)