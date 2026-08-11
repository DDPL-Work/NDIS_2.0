// Delegation of Financial Powers — authority resolution engine.
// The authority MATRIX is data (configurable via Workflow & Authority screen),
// never hard-coded rules. This module resolves the best applicable authority
// for an actor and validates amounts against every limit dimension.

import { DEFAULT_AUTHORITY_MATRIX } from '../../../config/stateConstants'

export class AuthorityError extends Error {
  constructor(message, { code = 'AUTHORITY_VIOLATION', context = {} } = {}) {
    super(message)
    this.name = 'AuthorityError'
    this.code = code
    this.context = context
  }
}

// Authorities with departmental scope apply only when the actor belongs to
// that department (departmentId on authority == actor.departmentId).
export function findAuthority(authorityMatrix = DEFAULT_AUTHORITY_MATRIX, { role, departmentId, districtId, schemeId, fy }) {
  const candidates = authorityMatrix.filter((a) => {
    if (a.status !== 'active') return false
    if (a.role !== role) return false
    if (a.departmentId && a.departmentId !== departmentId) return false
    if (a.applicableDistrictIds?.length && !a.applicableDistrictIds.includes(districtId)) return false
    if (a.applicableSchemeIds?.length && !a.applicableSchemeIds.includes(schemeId)) return false
    if (a.effectiveFrom && fy && fy.replace('/', '-') < a.effectiveFrom.slice(0, 7)) return false
    if (a.effectiveTo && Date.now() > new Date(a.effectiveTo + 'T23:59:59').getTime()) return false
    return true
  })
  // Highest limit first — the actor acts under their strongest authority.
  candidates.sort((x, y) => (y.maxFinancialLimit || 0) - (x.maxFinancialLimit || 0))
  return candidates[0] || null
}

// Core check: can `actor` take `action` of `amount` under their authority?
// Returns { ok, authority, limit | exceededBy, message }.
export function checkAuthority(matrix, actor, action, amount, context = {}) {
  const authority = findAuthority(matrix, { role: actor.role, departmentId: actor.departmentId || context.departmentId, districtId: context.districtId, schemeId: context.schemeId, fy: context.fy })
  if (!authority) {
    return {
      ok: false,
      authority: null,
      exceededBy: amount,
      message: `No delegated financial authority found for role "${actor.role}". Approval requires manual referral to the competent authority.`,
    }
  }
  const LIMIT_KEYS = { sanction: 'sanctionLimit', release: 'releaseLimit', project: 'projectApprovalLimit', reappropriate: 'reappropriationLimit', financial: 'maxFinancialLimit' }
  const limit = authority[LIMIT_KEYS[action]] ?? authority.maxFinancialLimit
  if (amount > limit) {
    return {
      ok: false,
      authority,
      exceededBy: amount - limit,
      limit,
      message: `Approval limit exceeded. Escalation to competent authority required. Amount ${fmt(amount)} exceeds the ${fmt(limit)} authority under "${authority.title}".`,
    }
  }
  return { ok: true, authority, limit }
}

// Convenience for store actions: throws when not authorized.
export function assertAuthority(matrix, actor, action, amount, context = {}) {
  const result = checkAuthority(matrix, actor, action, amount, context)
  if (!result.ok) throw new AuthorityError(result.message, { code: 'AUTHORITY_VIOLATION', context: { action, amount, ...result } })
  return result
}

export function fmt(amount) {
  return `₹${((amount || 0) / 10000000).toFixed(2)} Cr`
}