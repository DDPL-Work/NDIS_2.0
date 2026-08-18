// Final sanctioned-amount precedence — shared by every surface that sanctions
// a proposal (DM Approvals, state-admin store).
//
// The backend's PERSISTED agreement is the source of truth for a completed
// negotiation: approval_mode === "NEGOTIATED" with a valid positive
// agreed_amount. The original estimated_cost is never overwritten — both
// values are preserved for audit. An OPEN negotiation round is NOT an
// agreement and must never drive the sanction amount.
export function getFinalSanctionAmount(proposal = {}) {
  const agreedAmount = Number(proposal?.agreed_amount ?? proposal?.agreedAmount)
  if (proposal?.approval_mode === 'NEGOTIATED' || proposal?.approvalMode === 'NEGOTIATED') {
    if (Number.isFinite(agreedAmount) && agreedAmount > 0) return agreedAmount
  }
  const estimatedCost = Number(proposal?.estimated_cost ?? proposal?.estimatedCost)
  return Number.isFinite(estimatedCost) ? estimatedCost : 0
}

export const isNegotiatedAgreement = (proposal = {}) =>
  (proposal?.approval_mode === 'NEGOTIATED' || proposal?.approvalMode === 'NEGOTIATED') &&
  Number.isFinite(Number(proposal?.agreed_amount ?? proposal?.agreedAmount)) &&
  Number(proposal?.agreed_amount ?? proposal?.agreedAmount) > 0