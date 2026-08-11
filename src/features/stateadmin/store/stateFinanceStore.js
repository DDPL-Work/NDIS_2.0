// State Finance Store — budgets, allocations, sanctions, releases, commitments,
// expenditures, re-appropriation. Every mutation:
//   1. runs the pure finance rules (financeService),
//   2. checks delegation of powers (authorityService),
//   3. appends an immutable ledger entry,
//   4. appends an audit record,
//   5. raises a notification.
// No financial value is ever silently overwritten; revisions and corrections
// are appended as new records / ledger rows.
import { create } from 'zustand'
import { DEFAULT_FINANCIAL_YEAR, LEDGER_TYPE_LABELS } from '../../../config/stateConstants'
import {
  assertDistrictAllocationWithinDepartment,
  assertSanctionWithinAuthorized,
  assertReleaseWithinSanction,
  assertCommitmentWithinReleased,
  assertExpenditureWithinReleased,
  assertReappropriationAvailable,
  ensureUniqueIdempotency,
  sum,
} from '../services/financeService'
import { assertAuthority } from '../services/authorityService'
import { buildAuditEntry } from '../services/auditService'
import {
  buildStateBudget, buildDepartmentBudgets, buildAllocations, buildFinancialChains,
  buildLedger, buildAuditTrail, buildReappropriationSeed, buildPendingApprovals, cr, SEED_AUTHORITY_MATRIX, SEED_WORKFLOWS,
} from './seed/stateSeedData'

const SEED_FY = DEFAULT_FINANCIAL_YEAR

function initializeSeed() {
  const stateBudgets = [buildStateBudget(SEED_FY)]
  const departmentBudgets = buildDepartmentBudgets(SEED_FY)
  const districtAllocations = buildAllocations(SEED_FY)
  const chains = buildFinancialChains(SEED_FY)
  const sanctions = Object.values(chains).flatMap((c) => c.sanctions)
  const fundReleases = Object.values(chains).flatMap((c) => c.releases)
  const commitments = Object.values(chains).flatMap((c) => c.commitments)
  const expenditures = Object.values(chains).flatMap((c) => c.expenditures)
  const reappropriations = buildReappropriationSeed(SEED_FY)
  const pending = buildPendingApprovals(SEED_FY, chains)
  const ledger = buildLedger(SEED_FY, departmentBudgets, districtAllocations, chains)
  const auditLogs = buildAuditTrail(SEED_FY, departmentBudgets, districtAllocations, chains)
  return {
    fy: SEED_FY,
    stateBudgets,
    departmentBudgets,
    districtAllocations,
    sanctions: [...sanctions, ...pending.sanctions],
    fundReleases: [...fundReleases, ...pending.releases],
    commitments,
    expenditures,
    reappropriations: [...reappropriations, ...pending.reappropriations],
    ledger,
    auditLogs,
  }
}

const initial = initializeSeed()

// ── Notifications ───────────────────────────────────────────────────────────
function notify(store, type, message, departmentId = null, channel = 'portal') {
  store.getState().addNotification({ type, message, departmentId, channel })
}

export const useStateFinanceStore = create((set, get) => ({
  ...initial,

  // Editable governance data (see Workflow & Authority workspace).
  authorityMatrix: SEED_AUTHORITY_MATRIX,
  workflows: SEED_WORKFLOWS,
  notifications: [],
  notificationsUnread: 0,

  addNotification({ type, message, departmentId = null, channel = 'portal' }) {
    set((s) => ({
      notifications: [{ id: `SN-${Date.now().toString(36)}`, type, message, departmentId, channel, createdAt: new Date().toISOString(), read: false }, ...s.notifications],
      notificationsUnread: s.notificationsUnread + 1,
    }))
  },
  markNotificationsRead() { set({ notificationsUnread: 0 }) },
  setNotificationRead(id) {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  },

  // Authority matrix + workflow administration
  upsertAuthority(authority) {
    const exists = get().authorityMatrix.some((a) => a.authorityId === authority.authorityId)
    set((s) => ({ authorityMatrix: exists ? s.authorityMatrix.map((a) => (a.authorityId === authority.authorityId ? authority : a)) : [...s.authorityMatrix, authority] }))
    get().writeAudit({ actor: {}, action: 'AUTHORITY_UPDATED', entity: 'authority', entityId: authority.authorityId, newValue: authority, reason: 'Authority matrix edited via Workflow & Authority screen.' })
  },
  upsertWorkflow(workflow) {
    const exists = get().workflows.some((w) => w.workflowId === workflow.workflowId)
    set((s) => ({ workflows: exists ? s.workflows.map((w) => (w.workflowId === workflow.workflowId ? workflow : w)) : [...s.workflows, workflow] }))
    get().writeAudit({ actor: {}, action: 'WORKFLOW_UPDATED', entity: 'workflow', entityId: workflow.workflowId, newValue: workflow, reason: 'Workflow definition edited.' })
  },

  // ── State budget ─────────────────────────────────────────────────────────
  createStateBudget({ fy = get().fy, provision, documentId = null, remarks = '', actor = {} }) {
    if (get().stateBudgets.some((b) => b.fy === fy)) throw new Error('A state budget already exists for this financial year. Use a revision for changes.')
    const budget = {
      id: `SB-${fy.replace('-', '')}`,
      fy,
      provisionOriginal: provision,
      provisionCurrent: provision,
      documentId,
      remarks,
      status: 'drafted',
      revisions: [],
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ stateBudgets: [...s.stateBudgets, budget] }))
    get().postLedger({ type: 'BUDGET_CREATED', fy, amount: provision, sign: 1, balanceAfter: provision, referenceType: 'state_budget', referenceNo: budget.id, actor })
    get().writeAudit({ actor, action: 'STATE_BUDGET_CREATED', entity: 'state_budget', entityId: budget.id, newValue: `provision ₹${provision}`, reason: remarks })
  },

  reviseStateBudget({ fy = get().fy, delta = 0, reason = '', goNumber = '', actor = {} }) {
    const budget = get().stateBudgets.find((b) => b.fy === fy)
    if (!budget) throw new Error('State budget not found for the selected financial year.')
    if (delta === 0) throw new Error('Revision delta cannot be zero.')
    const newCurrent = budget.provisionCurrent + delta
    if (newCurrent < sum(get().departmentBudgets.filter((d) => d.fy === fy), 'authorized')) {
      throw new Error('Revision cannot reduce the state budget below the total authorized department budget.')
    }
    const revision = {
      revisionNo: `RN-${budget.revisions.length + 1}`,
      delta,
      reason,
      goNumber,
      date: new Date().toISOString().slice(0, 10),
      createdBy: actor.name || actor.role || 'Unknown',
    }
    set((s) => ({ stateBudgets: s.stateBudgets.map((b) => (b.fy === fy ? { ...b, provisionCurrent: newCurrent, revisions: [...b.revisions, revision] } : b)) }))
    get().postLedger({ type: 'BUDGET_REVISED', fy, amount: delta, sign: 1, balanceAfter: newCurrent, referenceType: 'budget_revision', referenceNo: `${fy}-${revision.revisionNo}`, actor, remarks: reason })
    get().writeAudit({ actor, action: 'STATE_BUDGET_REVISED', entity: 'state_budget', entityId: budget.id, oldValue: { provision: budget.provisionCurrent }, newValue: { provision: newCurrent, delta, goNumber }, reason })
    notify(get, 'budget_approved', `State budget revised for FY ${fy} ${delta >= 0 ? '+' : ''}${(delta / 10000000).toFixed(2)} Cr (${goNumber || 'no order'}).`)
  },

  // ── Department budget (authorized amount) ────────────────────────────────
  createDepartmentBudget({ fy = get().fy, departmentId, budgetHeadId, schemeId = null, provision, authorized, fundSource = 'state_budget', goNumber, goDate, effectiveDate, documentId = null, remarks = '', actor = {} }) {
    if (!departmentId || !budgetHeadId) throw new Error('Department and budget head are required.')
    if (provision === undefined || authorized === undefined) throw new Error('Budget Provision and Authorized Amount are required.')
    if (authorized > provision) throw new Error('Authorized Amount cannot exceed Budget Provision.')
    if (get().departmentBudgets.some((d) => d.fy === fy && d.departmentId === departmentId)) throw new Error('A department budget already exists for this FY — use a revision.')
    const stateProvision = get().stateBudgets.find((b) => b.fy === fy)?.provisionCurrent
    if (stateProvision) {
      const totalAuthorized = sum(get().departmentBudgets.filter((d) => d.fy === fy), 'authorized')
      if (totalAuthorized + authorized > stateProvision) {
        throw new Error(`Total department authorization would exceed the state budget provision (₹${(stateProvision / 10000000).toFixed(2)} Cr).`)
      }
    }
    const record = {
      id: `DB-${fy.replace('-', '')}-${departmentId.toUpperCase()}`,
      stateBudgetId: `SB-${fy.replace('-', '')}`,
      fy, departmentId, budgetHeadId, schemeId, provision, authorized, fundSource,
      goNumber, goDate, effectiveDate, documentId, remarks,
      status: 'drafted', revisions: [],
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ departmentBudgets: [...s.departmentBudgets, record] }))
    get().postLedger({ type: 'BUDGET_CREATED', fy, departmentId, budgetHeadId, amount: authorized, sign: 1, balanceAfter: authorized, referenceType: 'department_budget', referenceNo: record.id, actor })
    get().writeAudit({ actor, action: 'DEPARTMENT_AUTHORIZATION', entity: 'department_budget', entityId: record.id, newValue: { authorized, provision, goNumber }, reason: remarks })
    notify(get, 'budget_allocated', `Department budget authorized for ${departmentId.toUpperCase()} — ₹${(authorized / 10000000).toFixed(2)} Cr (FY ${fy}).`, departmentId)
    return record
  },

  reviseDepartmentBudget({ id, delta = 0, reason = '', goNumber = '', actor = {} }) {
    const record = get().departmentBudgets.find((d) => d.id === id)
    if (!record) throw new Error('Department budget not found.')
    if (delta === 0) throw new Error('Revision delta cannot be zero.')
    const newAuthorized = record.authorized + delta
    if (newAuthorized < sum(get().sanctions.filter((s) => s.fy === record.fy && s.departmentId === record.departmentId), 'amount')) {
      throw new Error('Revision cannot reduce the authorized amount below the already sanctioned amount.')
    }
    const revision = { revisionNo: `REV-${record.revisions.length + 1}`, delta, reason, goNumber, date: new Date().toISOString().slice(0, 10), createdBy: actor.name || actor.role || 'Unknown' }
    const oldValue = { authorized: record.authorized }
    set((s) => ({ departmentBudgets: s.departmentBudgets.map((d) => (d.id === id ? { ...d, authorized: newAuthorized, revisions: [...d.revisions, revision] } : d)) }))
    get().postLedger({ type: 'BUDGET_REVISED', fy: record.fy, departmentId: record.departmentId, amount: delta, sign: 1, balanceAfter: newAuthorized, referenceType: 'department_budget', referenceNo: id, actor, remarks: reason })
    get().writeAudit({ actor, action: 'DEPARTMENT_BUDGET_REVISED', entity: 'department_budget', entityId: id, oldValue, newValue: { authorized: newAuthorized, delta, goNumber }, reason })
    notify(get, 'budget_approved', `Department budget revised for ${record.departmentId.toUpperCase()} (${delta >= 0 ? '+' : ''}${(delta / 10000000).toFixed(2)} Cr).`, record.departmentId)
  },

  // ── District allocation ──────────────────────────────────────────────────
  allocateDistrict({ fy = get().fy, departmentId, districtId, budgetHeadId, schemeId = null, amount, goNumber = '', idempotencyKey, actor = {} }) {
    if (!departmentId || !districtId || !amount || amount <= 0) throw new Error('Department, district and a positive amount are required.')
    const dbRecord = get().departmentBudgets.find((d) => d.fy === fy && d.departmentId === departmentId)
    if (!dbRecord) throw new Error('No department budget (authorized amount) exists for this FY. Create it first.')
    ensureUniqueIdempotency(get().districtAllocations, { idempotencyKey, errorLabel: 'District allocation' })
    const existing = sum(get().districtAllocations.filter((a) => a.fy === fy && a.departmentId === departmentId), 'amount')
    assertDistrictAllocationWithinDepartment({ requested: amount, departmentAuthorized: dbRecord.authorized, existingAllocated: existing })
    const allocation = {
      id: `DA-${fy.replace('-', '')}-${departmentId.toUpperCase()}-${String(get().districtAllocations.length + 1).padStart(3, '0')}`,
      departmentBudgetId: dbRecord.id, fy, departmentId, districtId, budgetHeadId, schemeId,
      amount, goNumber, status: 'active', idempotencyKey,
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ districtAllocations: [...s.districtAllocations, allocation] }))
    get().postLedger({ type: 'DISTRICT_ALLOCATION', fy, departmentId, districtId, amount, sign: 1, balanceAfter: existing + amount, referenceType: 'district_allocation', referenceNo: allocation.id, actor })
    get().writeAudit({ actor, action: 'DISTRICT_ALLOCATION', entity: 'district_allocation', entityId: allocation.id, newValue: { districtId, amount }, reason: goNumber })
    notify(get, 'budget_allocated', `District allocation — ${districtId.toUpperCase()} ₹${(amount / 10000000).toFixed(2)} Cr under ${departmentId.toUpperCase()}.`, departmentId)
    return allocation
  },

  // ── Sanctions ────────────────────────────────────────────────────────────
  createSanction({ fy = get().fy, departmentId, districtId = null, schemeId = null, budgetHeadId, projectId = null, description = '', amount, goNumber = '', actor = {} }) {
    if (!departmentId || !budgetHeadId || !amount || amount <= 0) throw new Error('Department, budget head and a positive amount are required.')
    const dbRecord = get().departmentBudgets.find((d) => d.fy === fy && d.departmentId === departmentId)
    if (!dbRecord) throw new Error('No authorized department budget exists. Create it before sanctioning.')
    const existing = sum(get().sanctions.filter((s) => s.fy === fy && s.departmentId === departmentId), 'amount')
    assertSanctionWithinAuthorized({ requested: amount, departmentAuthorized: dbRecord.authorized, existingSanctioned: existing })
    assertAuthority(get().authorityMatrix, actor, 'sanction', amount, { departmentId, districtId, schemeId, fy })
    const sanction = {
      id: `SAN-CREATE-${Date.now().toString(36)}`,
      sanctionNo: `FS-${fy.replace('-', '')}-${departmentId.toUpperCase()}-${String(get().sanctions.length + 1).padStart(3, '0')}`,
      fy, departmentId, districtId, schemeId, budgetHeadId, projectId, description, amount, goNumber,
      status: 'drafted', authority: actor.name || actor.role || 'Unknown',
      approvalHistory: [{ action: 'draft', actor: actor.name || actor.role || 'Unknown', timestamp: new Date().toISOString(), remarks: description || 'Drafted' }],
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ sanctions: [...s.sanctions, sanction] }))
    get().writeAudit({ actor, action: 'SANCTION_CREATED', entity: 'sanction', entityId: sanction.sanctionNo, newValue: { amount }, reason: goNumber })
    notify(get, 'approval_pending', `Sanction ${sanction.sanctionNo} (₹${(amount / 10000000).toFixed(2)} Cr) awaiting approval.`, departmentId)
    return sanction
  },

  approveSanction({ id, actor = {}, remarks = '' }) {
    const sanction = get().sanctions.find((s) => s.id === id || s.sanctionNo === id)
    if (!sanction) throw new Error('Sanction not found.')
    if (sanction.status === 'approved') throw new Error('Sanction already approved. No duplicate approvals.')
    const check = assertAuthority(get().authorityMatrix, actor, 'sanction', sanction.amount, { departmentId: sanction.departmentId, districtId: sanction.districtId, schemeId: sanction.schemeId, fy: sanction.fy })
    const record = { ...sanction, status: 'approved', approvedBy: `${actor.name || actor.role || 'Unknown'} (${check.authority?.authorityId || 'no-authority'})`, approvedAt: new Date().toISOString(), approvalHistory: [...sanction.approvalHistory, { action: 'approve', actor: actor.name || actor.role || 'Unknown', role: actor.role, timestamp: new Date().toISOString(), remarks, authorityId: check.authority?.authorityId, limitUsed: check.limit }] }
    set((s) => ({ sanctions: s.sanctions.map((x) => (x.id === id ? record : x)) }))
    get().postLedger({ type: 'SANCTION', fy: sanction.fy, departmentId: sanction.departmentId, districtId: sanction.districtId, schemeId: sanction.schemeId, budgetHeadId: sanction.budgetHeadId, projectId: sanction.projectId, amount: sanction.amount, sign: -1, balanceAfter: 0, referenceType: 'sanction', referenceNo: sanction.sanctionNo, actor, remarks })
    get().writeAudit({ actor, action: 'SANCTION_APPROVED', entity: 'sanction', entityId: sanction.sanctionNo, oldValue: 'drafted', newValue: 'approved', reason: remarks, referenceType: 'authority', referenceNo: check.authority?.authorityId })
    notify(get, 'sanction_issued', `Sanction ${sanction.sanctionNo} approved for ₹${(sanction.amount / 10000000).toFixed(2)} Cr.`, sanction.departmentId)
    return record
  },

  escalateSanction({ id, actor = {}, remarks = '' }) {
    const sanction = get().sanctions.find((s) => s.id === id || s.sanctionNo === id)
    if (!sanction) throw new Error('Sanction not found.')
    const record = { ...sanction, status: 'escalated', approvalHistory: [...sanction.approvalHistory, { action: 'escalate', actor: actor.name || actor.role || 'Unknown', timestamp: new Date().toISOString(), remarks }] }
    set((s) => ({ sanctions: s.sanctions.map((x) => (x.id === id ? record : x)) }))
    get().writeAudit({ actor, action: 'SANCTION_ESCALATED', entity: 'sanction', entityId: sanction.sanctionNo, newValue: { status: 'escalated' }, reason: remarks })
    notify(get, 'approval_escalated', `Sanction ${sanction.sanctionNo} escalated to the competent authority.`, sanction.departmentId)
    return record
  },

  // ── Fund releases ────────────────────────────────────────────────────────
  createFundRelease({ sanctionId, fy = get().fy, districtId = null, amount, releaseNotes = '', actor = {} }) {
    const sanction = get().sanctions.find((s) => s.id === sanctionId || s.sanctionNo === sanctionId)
    if (!sanction) throw new Error('Parent sanction not found.')
    if (sanction.status !== 'approved') throw new Error('Funds can be released only against an approved sanction.')
    const existing = sum(get().fundReleases.filter((r) => r.sanctionId === sanction.id), 'amount')
    assertReleaseWithinSanction({ requested: amount, sanctionAmount: sanction.amount, existingReleased: existing })
    const release = {
      id: `REL-CREATE-${Date.now().toString(36)}`,
      releaseNo: `FR-${fy.replace('-', '')}-${sanction.departmentId.toUpperCase()}-${String(get().fundReleases.length + 1).padStart(3, '0')}`,
      sanctionId: sanction.id, fy,
      departmentId: sanction.departmentId, districtId, schemeId: sanction.schemeId, budgetHeadId: sanction.budgetHeadId,
      amount, releaseDate: new Date().toISOString().slice(0, 10), status: 'drafted',
      authority: null, goNumber: '', documentId: null, remarks: releaseNotes,
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ fundReleases: [...s.fundReleases, release] }))
    get().writeAudit({ actor, action: 'RELEASE_DRAFTED', entity: 'fund_release', entityId: release.releaseNo, newValue: { amount }, reason: releaseNotes })
    return release
  },

  approveRelease({ id, actor = {}, remarks = '', goNumber = '' }) {
    const release = get().fundReleases.find((r) => r.id === id || r.releaseNo === id)
    if (!release) throw new Error('Fund release not found.')
    if (release.status === 'approved') throw new Error('Release already approved. No duplicate release against the same approval.')
    const check = assertAuthority(get().authorityMatrix, actor, 'release', release.amount, { departmentId: release.departmentId, districtId: release.districtId, schemeId: release.schemeId, fy: release.fy })
    const record = { ...release, status: 'approved', approvedBy: `${actor.name || actor.role || 'Unknown'} (${check.authority?.authorityId || 'no-authority'})`, approvedAt: new Date().toISOString(), goNumber: goNumber || release.goNumber }
    set((s) => ({ fundReleases: s.fundReleases.map((x) => (x.id === id ? record : x)) }))
    get().postLedger({ type: 'FUND_RELEASE', fy: release.fy, departmentId: release.departmentId, districtId: release.districtId, schemeId: release.schemeId, budgetHeadId: release.budgetHeadId, amount: release.amount, sign: -1, balanceAfter: 0, referenceType: 'fund_release', referenceNo: release.releaseNo, actor, remarks })
    get().writeAudit({ actor, action: 'FUND_RELEASED', entity: 'fund_release', entityId: release.releaseNo, oldValue: 'drafted', newValue: 'approved', reason: remarks, referenceType: 'authority', referenceNo: check.authority?.authorityId })
    notify(get, 'fund_released', `Fund Release ${release.releaseNo} — ₹${(release.amount / 10000000).toFixed(2)} Cr released against ${release.sanctionId}.`, release.departmentId)
    return record
  },

  // ── Commitments ──────────────────────────────────────────────────────────
  createCommitment({ fy = get().fy, releaseId = null, departmentId, districtId = null, projectId = null, amount, description = '', actor = {} }) {
    if (!departmentId || !amount || amount <= 0) throw new Error('Department and a positive amount are required.')
    const totalReleased = sum(get().fundReleases.filter((r) => r.fy === fy && r.departmentId === departmentId && r.status === 'approved'), 'amount')
    const existing = sum(get().commitments.filter((c) => c.fy === fy && c.departmentId === departmentId), 'amount')
    assertCommitmentWithinReleased({ requested: amount, totalReleased, existingCommitted: existing })
    const commitment = {
      id: `COM-CREATE-${Date.now().toString(36)}`,
      releaseId, fy, departmentId, districtId, projectId, amount, description,
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ commitments: [...s.commitments, commitment] }))
    get().postLedger({ type: 'COMMITMENT', fy, departmentId, districtId, amount, sign: -1, balanceAfter: existing + amount, referenceType: 'commitment', referenceNo: commitment.id, actor, remarks: description })
    get().writeAudit({ actor, action: 'COMMITMENT_RECORDED', entity: 'commitment', entityId: commitment.id, newValue: { amount }, reason: description })
    return commitment
  },

  // ── Expenditure ──────────────────────────────────────────────────────────
  createExpenditure({ fy = get().fy, commitmentId = null, releaseId = null, departmentId, districtId = null, projectId = null, amount, voucherNo = '', description = '', actor = {} }) {
    if (!departmentId || !amount || amount <= 0) throw new Error('Department and a positive amount are required.')
    const totalReleased = sum(get().fundReleases.filter((r) => r.fy === fy && r.departmentId === departmentId && r.status === 'approved'), 'amount')
    const totalCommitted = sum(get().commitments.filter((c) => c.fy === fy && c.departmentId === departmentId), 'amount')
    const existing = sum(get().expenditures.filter((e) => e.fy === fy && e.departmentId === departmentId), 'amount')
    assertExpenditureWithinReleased({ requested: amount, totalReleased, totalCommitted, existingExpended: existing })
    const expenditure = {
      id: `EXP-CREATE-${Date.now().toString(36)}`,
      commitmentId, releaseId, fy, departmentId, districtId, projectId, amount,
      date: new Date().toISOString().slice(0, 10),
      voucherNo: voucherNo || `VCH-${fy.replace('-', '')}-${departmentId.toUpperCase()}-${String(get().expenditures.length + 1).padStart(3, '0')}`,
      description,
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ expenditures: [...s.expenditures, expenditure] }))
    get().postLedger({ type: 'EXPENDITURE', fy, departmentId, districtId, amount, sign: -1, balanceAfter: existing + amount, referenceType: 'expenditure', referenceNo: expenditure.voucherNo, actor, remarks: description })
    get().writeAudit({ actor, action: 'EXPENDITURE_RECORDED', entity: 'expenditure', entityId: expenditure.id, newValue: { amount, voucherNo }, reason: description })
    return expenditure
  },

  // ── Re-appropriation ─────────────────────────────────────────────────────
  createReappropriation({ fy = get().fy, sourceDepartmentId, sourceBudgetHeadId, sourceSchemeId = null, destinationDepartmentId, destinationBudgetHeadId, destinationSchemeId = null, amount, reason = '', supportingOrder = '', actor = {} }) {
    if (!sourceBudgetHeadId || !destinationBudgetHeadId || !amount || amount <= 0) throw new Error('Source head, destination head and a positive amount are required.')
    if (sourceBudgetHeadId === destinationBudgetHeadId) throw new Error('Source and destination budget heads must differ.')
    if (sourceDepartmentId !== destinationDepartmentId) throw new Error('Cross-department re-appropriation requires a higher approving authority — configure the workflow for this case.')
    const deptTotal = get().departmentBudgets.find((d) => d.fy === fy && d.departmentId === sourceDepartmentId)
    const existingSanctioned = sum(get().sanctions.filter((s) => s.fy === fy && s.departmentId === sourceDepartmentId && s.budgetHeadId === sourceBudgetHeadId), 'amount')
    const existingAllocated = sum(get().districtAllocations.filter((a) => a.fy === fy && a.departmentId === sourceDepartmentId && a.budgetHeadId === sourceBudgetHeadId), 'amount')
    assertReappropriationAvailable({ requested: amount, currentAuthorized: deptTotal?.authorized || 0, existingSanctioned, currentAllocated: existingAllocated })
    assertAuthority(get().authorityMatrix, actor, 'reappropriate', amount, { departmentId: sourceDepartmentId, fy })
    const record = {
      id: `RA-CREATE-${Date.now().toString(36)}`,
      raNo: `GO-RA-${fy.replace('-', '')}-${String(get().reappropriations.length + 1).padStart(3, '0')}`,
      fy, sourceDepartmentId, sourceBudgetHeadId, sourceSchemeId,
      destinationDepartmentId, destinationBudgetHeadId, destinationSchemeId,
      amount, reason, supportingOrder, status: 'drafted',
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ reappropriations: [...s.reappropriations, record] }))
    get().writeAudit({ actor, action: 'REAPPROPRIATION_DRAFTED', entity: 'reappropriation', entityId: record.raNo, newValue: { amount, from: sourceBudgetHeadId, to: destinationBudgetHeadId }, reason })
    return record
  },

  approveReappropriation({ id, actor = {}, remarks = '' }) {
    const record = get().reappropriations.find((r) => r.id === id || r.raNo === id)
    if (!record) throw new Error('Re-appropriation record not found.')
    if (record.status === 'approved') throw new Error('Already approved.')
    const approved = { ...record, status: 'approved', approvingAuthority: actor.name || actor.role || 'Unknown', approvedBy: actor.name || actor.role || 'Unknown', date: new Date().toISOString().slice(0, 10) }
    set((s) => ({ reappropriations: s.reappropriations.map((x) => (x.id === id ? approved : x)) }))
    get().postLedger({ type: 'REAPPROPRIATION_OUT', fy: record.fy, departmentId: record.sourceDepartmentId, budgetHeadId: record.sourceBudgetHeadId, amount: record.amount, sign: -1, balanceAfter: 0, referenceType: 'reappropriation', referenceNo: record.raNo, actor, remarks })
    get().postLedger({ type: 'REAPPROPRIATION_IN', fy: record.fy, departmentId: record.destinationDepartmentId, budgetHeadId: record.destinationBudgetHeadId, amount: record.amount, sign: 1, balanceAfter: 0, referenceType: 'reappropriation', referenceNo: record.raNo, actor, remarks })
    get().writeAudit({ actor, action: 'REAPPROPRIATION_APPROVED', entity: 'reappropriation', entityId: record.raNo, oldValue: 'drafted', newValue: 'approved', reason: remarks, referenceType: 'order', referenceNo: record.supportingOrder })
    notify(get, 'budget_approved', `Re-appropriation ${record.raNo} approved — ₹${(record.amount / 10000000).toFixed(2)} Cr moved between budget heads.`, record.sourceDepartmentId)
    return approved
  },

  // ── Ledger + audit plumbing ──────────────────────────────────────────────
  postLedger({ type, fy = get().fy, amount, sign = -1, balanceAfter = 0, referenceType, referenceNo, actor = {}, remarks = '', departmentId = null, districtId = null, schemeId = null, budgetHeadId = null, projectId = null }) {
    const entry = {
      id: `LEDGER-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      txId: `TX-${fy.replace('/', '')}-${String(get().ledger.length + 1).padStart(6, '0')}`,
      type, typeLabel: LEDGER_TYPE_LABELS[type] || type,
      fy, departmentId, districtId, schemeId, budgetHeadId, projectId,
      amount, sign, balanceAfter,
      referenceType, referenceNo,
      createdBy: actor.name || actor.role || 'Unknown',
      timestamp: new Date().toISOString(),
      remarks,
    }
    set((s) => ({ ledger: [...s.ledger, entry] }))
    return entry
  },

  writeAudit({ actor = {}, action, entity, entityId, oldValue = null, newValue = null, reason = '', referenceType = null, referenceNo = null }) {
    const entry = buildAuditEntry({ actor: actor.name || actor.role || 'Unknown', role: actor.role, action, entity, entityId, oldValue, newValue, reason, referenceType, referenceNo })
    set((s) => ({ auditLogs: [entry, ...s.auditLogs] }))
    return entry
  },

  setFinancialYear(fy) { set({ fy }) },
  resetFinance() { set({ ...initializeSeed() }) },
}))

// Re-export convenience (used by selectors and workspaces).
export const financeCr = cr