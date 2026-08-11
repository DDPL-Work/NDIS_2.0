// Pure financial business-rules boundary for the State Administration Panel.
// Every rule enforced HERE mirrors what the backend must re-enforce
// server-side for every financial operation (never frontend-only). Zero
// React dependencies — unit-testable in isolation.

export class FinanceRuleError extends Error {
  constructor(message, { code = 'FINANCE_RULE_VIOLATION', context = {} } = {}) {
    super(message)
    this.name = 'FinanceRuleError'
    this.code = code
    this.context = context
  }
}

export const sum = (rows, key) => rows.reduce((acc, row) => acc + (row[key] || 0), 0)

// ── Positions ──────────────────────────────────────────────────────────────
// departmentPosition: how much of a department's authorized budget is left
// to be sanctioned (the primary constraint the matrix enforces).
export function departmentSanctionedTotal(sanctions = [], { departmentId, fy, budgetHeadId } = {}) {
  return sum(sanctions.filter((s) =>
    s.departmentId === departmentId && ((fy && s.fy === fy) || !fy) && ((budgetHeadId && s.budgetHeadId === budgetHeadId) || !budgetHeadId)
  ), 'amount')
}

export function departmentReleasedTotal(releases = [], { departmentId, fy } = {}) {
  return sum(releases.filter((r) =>
    r.departmentId === departmentId && ((fy && r.fy === fy) || !fy)
  ), 'amount')
}

export function departmentCommittedTotal(commitments = [], { departmentId, fy } = {}) {
  return sum(commitments.filter((c) =>
    c.departmentId === departmentId && ((fy && c.fy === fy) || !fy)
  ), 'amount')
}

export function departmentUtilizedTotal(expenditures = [], { departmentId, fy } = {}) {
  return sum(expenditures.filter((e) =>
    e.departmentId === departmentId && ((fy && e.fy === fy) || !fy)
  ), 'amount')
}

export function districtAllocatedTotal(allocations = [], { departmentId, districtId, fy } = {}) {
  return sum(allocations.filter((a) =>
    ((!departmentId || a.departmentId === departmentId)) && ((!districtId || a.districtId === districtId)) && ((!fy || a.fy === fy))
  ), 'amount')
}

// Balance vocabulary — strictly derived, never stored as editable fields.
export function computePositions({ authorized = 0, sanctioned = 0, released = 0, committed = 0, utilized = 0, allocated = 0 }) {
  return {
    authorized,
    sanctioned,
    released,
    committed,
    utilized,
    allocated,
    remainToSanction: authorized - sanctioned,                 // available for new sanction
    unreleased: sanctioned - released,                         // sanctioned but not yet released
    availableAfterRelease: released - committed,               // released funds not yet committed
    uncommitted: released - committed,                         // synonym (kept per spec)
    unutilized: committed - utilized,                          // committed but not yet spent
    unallocated: authorized - allocated,                       // dept budget not yet assigned to districts
  }
}

export function assertNoNegative(value, message) {
  if (value < 0) throw new FinanceRuleError(message, { code: 'NEGATIVE_BALANCE' })
}

// ── Rule assertions (each mirrors a spec-level invariant) ──────────────────
export function assertDistrictAllocationWithinDepartment({ requested, departmentAuthorized, existingAllocated }) {
  const remaining = departmentAuthorized - existingAllocated
  assertNoNegative(remaining, 'Department allocation is already oversubscribed.')
  if (requested > remaining) {
    throw new FinanceRuleError(
      `Allocation exceeds available authorized budget. Available = ${formatCr(remaining)}, requested = ${formatCr(requested)}.`,
      { code: 'OVER_ALLOCATION', context: { requested, remaining } }
    )
  }
}

export function assertSanctionWithinAuthorized({ requested, departmentAuthorized, existingSanctioned }) {
  const remaining = departmentAuthorized - existingSanctioned
  assertNoNegative(remaining, 'Department authorized budget is oversubscribed.')
  if (requested > remaining) {
    throw new FinanceRuleError(
      `Sanction exceeds remaining authorized budget. Available = ${formatCr(remaining)}, requested = ${formatCr(requested)}.`,
      { code: 'SANCTION_EXCEEDS_AUTHORIZED', context: { requested, remaining } }
    )
  }
}

export function assertReleaseWithinSanction({ requested, sanctionAmount, existingReleased }) {
  const remaining = sanctionAmount - existingReleased
  assertNoNegative(remaining, `Sanction ${'already fully released'}: released exceeds sanctioned amount.`)
  if (requested > remaining) {
    throw new FinanceRuleError(
      `Release exceeds sanctioned amount. Unreleased = ${formatCr(remaining)}, requested = ${formatCr(requested)}.`,
      { code: 'RELEASE_EXCEEDS_SANCTION', context: { requested, remaining } }
    )
  }
}

export function assertCommitmentWithinReleased({ requested, totalReleased, existingCommitted }) {
  if (requested + existingCommitted > totalReleased) {
    throw new FinanceRuleError(
      `Commitment exceeds released funds. Available (released − committed) = ${formatCr(totalReleased - existingCommitted)}, requested = ${formatCr(requested)}.`,
      { code: 'COMMITMENT_EXCEEDS_RELEASED', context: { requested, existingCommitted, totalReleased } }
    )
  }
}

export function assertExpenditureWithinReleased({ requested, totalReleased, totalCommitted, existingExpended }) {
  if (requested + existingExpended > totalReleased) {
    throw new FinanceRuleError(
      `Expenditure exceeds released funds. Utilized ${formatCr(existingExpended)} + requested ${formatCr(requested)} > released ${formatCr(totalReleased)}.`,
      { code: 'UTILIZATION_EXCEEDS_RELEASE', context: { requested, existingExpended, totalReleased } }
    )
  }
  if (requested + existingExpended > totalCommitted) {
    throw new FinanceRuleError(
      `Expenditure exceeds committed funds. Utilized ${formatCr(existingExpended)} + requested ${formatCr(requested)} > committed ${formatCr(totalCommitted)}.`,
      { code: 'UTILIZATION_EXCEEDS_COMMITMENT', context: { requested, existingExpended, totalCommitted } }
    )
  }
}

export function assertReappropriationAvailable({ requested, currentAuthorized, existingSanctioned, currentAllocated = 0 }) {
  const netAvailable = currentAuthorized - existingSanctioned - currentAllocated
  assertNoNegative(netAvailable, `Source budget head has no net available balance.`)
  if (requested > netAvailable) {
    throw new FinanceRuleError(
      `Re-appropriation exceeds net available balance of the source budget head. Available = ${formatCr(netAvailable)}, requested = ${formatCr(requested)}.`,
      { code: 'REAPPROPRIATION_EXCEEDS_AVAILABLE', context: { requested, netAvailable } }
    )
  }
}

export function formatCr(amount) {
  return `₹${((amount || 0) / 10000000).toFixed(2)} Cr`
}

// ── Idempotency keys ────────────────────────────────────────────────────────
// Guards against double submission (double allocation / duplicate release).
export function ensureUniqueIdempotency(records, { idempotencyKey, errorLabel }) {
  if (idempotencyKey && records.some((r) => r.idempotencyKey === idempotencyKey)) {
    throw new FinanceRuleError(`${errorLabel} already recorded (duplicate idempotency key).`, { code: 'DUPLICATE_TRANSACTION' })
  }
}

// ── Ledger ──────────────────────────────────────────────────────────────────
// Every financial write produces an immutable ledger entry. Ledger rows are
// APPEND-only; corrections require REVERSAL/ADJUSTMENT transactions.
export function buildLedgerEntry({ txType, fy, amount, sign = 1, balanceAfter, departmentId, districtId, schemeId, budgetHeadId, projectId, referenceType, referenceNo, actor, timestamp, remarks }) {
  return {
    id: `LEDGER-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    txId: `TX-${fy.replace('/', '')}-${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`,
    type: txType,
    fy,
    departmentId,
    districtId,
    schemeId,
    budgetHeadId,
    projectId,
    amount,
    sign,                       // +1 credit (authorization), −1 debit (sanction/release/expenditure)
    referenceType,
    referenceNo,
    prevBalance: balanceAfter,
    newBalance: balanceAfter,
    createdBy: actor,
    timestamp,
    remarks,
  }
}