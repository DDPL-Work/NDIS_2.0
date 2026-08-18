// State Finance Store — budgets, allocations, sanctions, releases, commitments,
// expenditures, re-appropriation. BACKEND-INTEGRATED:
//   • Budget provision / department budgets / district allocations / ledger are
//     hydrated from the live backend (backend_next_guide §21–§22) and written
//     through the same APIs. No amount is ever fabricated on this side.
//   • Sanctions, fund releases, commitments, expenditures and re-appropriation
//     have NO documented backend endpoints — the collections stay empty and
//     every mutation throws BackendCapabilityError (BACKEND GAP), surfacing the
//     honest error in the screens instead of simulating a record.
// Local append-only pieces (audit trail, notifications, authority matrix
// config) remain local by design — they are frontend activity/configuration.
import { create } from 'zustand'
import { DEFAULT_FINANCIAL_YEAR, LEDGER_TYPE_LABELS } from '../../../config/stateConstants'
import {
  assertDistrictAllocationWithinDepartment,
  ensureUniqueIdempotency,
  sum,
} from '../services/financeService'
import { buildAuditEntry } from '../services/auditService'
import { DEFAULT_AUTHORITY_MATRIX } from '../../../config/stateConstants'
import { DEFAULT_WORKFLOWS } from '../services/approvalService'
import { backendBudgetApi } from '../../../api/budgetApi'
import { BackendCapabilityError } from '../../../api/apiClient'
import { cr } from './seed/stateSeedData'

const emptyInitial = () => ({
  fy: DEFAULT_FINANCIAL_YEAR,
  stateBudgets: [],
  departmentBudgets: [],
  districtAllocations: [],
  sanctions: [],
  fundReleases: [],
  commitments: [],
  expenditures: [],
  reappropriations: [],
  ledger: [],
  auditLogs: [],
})

// ── DTO → store shape (amounts arrive in crore; store works in rupees) ──────
const mapStateBudget = (dto) => ({
  id: dto.id,
  fy: dto.financialYear || DEFAULT_FINANCIAL_YEAR,
  provisionOriginal: cr(dto.approvedCr || dto.authorizedCr),
  provisionCurrent: cr(dto.approvedCr || dto.authorizedCr),
  documentId: dto.raw?.document_id || dto.raw?.document || null,
  remarks: dto.remarks || '',
  status: dto.status || 'active',
  revisions: [],
  createdBy: dto.raw?.created_by_name || 'Backend',
  createdAt: dto.createdAt || dto.date || null,
})

const mapDepartmentBudget = (dto) => ({
  id: dto.id,
  fy: dto.financialYear || DEFAULT_FINANCIAL_YEAR,
  departmentId: dto.departmentId,
  departmentName: dto.departmentName || '',
  budgetHeadId: dto.head || 'bh-continuing',
  schemeId: dto.schemeId || null,
  provision: cr(dto.authorizedCr || dto.approvedCr),
  authorized: cr(dto.approvedCr || dto.authorizedCr),
  fundSource: dto.raw?.fund_source || 'state_budget',
  goNumber: dto.raw?.go_number || '',
  goDate: dto.date || null,
  status: dto.status || 'active',
  revisions: [],
  createdBy: dto.raw?.created_by_name || 'Backend',
  createdAt: dto.createdAt || dto.date || null,
})

const mapAllocation = (dto) => ({
  id: dto.id,
  fy: dto.financialYear || DEFAULT_FINANCIAL_YEAR,
  departmentId: dto.departmentId,
  departmentName: dto.departmentName || '',
  districtId: dto.districtId,
  districtName: dto.districtName || '',
  budgetHeadId: dto.head || 'bh-continuing',
  schemeId: dto.schemeId || null,
  amount: cr(dto.allocatedCr || dto.amountCr),
  goNumber: dto.raw?.go_number || '',
  status: dto.status || 'active',
  createdAt: dto.createdAt || dto.date || null,
})

const mapLedgerEntry = (dto) => {
  const type = String(dto.raw?.type || dto.raw?.tx_type || 'LEDGER_ENTRY').toUpperCase()
  return {
    id: dto.id,
    txId: dto.raw?.tx_id || `TX-${String(dto.id)}`,
    type,
    typeLabel: LEDGER_TYPE_LABELS[type] || dto.raw?.type_label || type,
    fy: dto.financialYear || DEFAULT_FINANCIAL_YEAR,
    departmentId: dto.departmentId,
    districtId: dto.districtId,
    schemeId: dto.schemeId,
    budgetHeadId: dto.head || dto.raw?.budget_head,
    amount: cr(dto.amountCr || dto.releasedCr || dto.utilizedCr),
    sign: -1,
    balanceAfter: cr(dto.balanceCr),
    referenceType: dto.raw?.reference_type || 'financial_ledger',
    referenceNo: dto.raw?.reference_no || String(dto.id),
    createdBy: dto.raw?.created_by_name || 'Backend',
    timestamp: dto.date || dto.createdAt || dto.raw?.timestamp || null,
    remarks: dto.remarks || '',
  }
}

const toCr = (rupees) => rupees / 10000000

// ── Notifications ───────────────────────────────────────────────────────────
function notify(store, type, message, departmentId = null, channel = 'portal') {
  store.getState().addNotification({ type, message, departmentId, channel })
}

export const useStateFinanceStore = create((set, get) => ({
  ...emptyInitial(),

  // Editable governance config (delegation of financial powers — config only).
  authorityMatrix: DEFAULT_AUTHORITY_MATRIX,
  workflows: DEFAULT_WORKFLOWS,
  notifications: [],
  notificationsUnread: 0,
  hydrationError: null,

  // ── Backend hydration ────────────────────────────────────────────────────
  hydrate(payload = {}) {
    set((s) => ({
      ...s,
      fy: payload.fy || s.fy,
      stateBudgets: Array.isArray(payload.stateBudgets) ? payload.stateBudgets : s.stateBudgets,
      departmentBudgets: Array.isArray(payload.departmentBudgets) ? payload.departmentBudgets : s.departmentBudgets,
      districtAllocations: Array.isArray(payload.districtAllocations) ? payload.districtAllocations : s.districtAllocations,
      sanctions: Array.isArray(payload.sanctions) ? payload.sanctions : s.sanctions,
      fundReleases: Array.isArray(payload.fundReleases) ? payload.fundReleases : s.fundReleases,
      commitments: Array.isArray(payload.commitments) ? payload.commitments : s.commitments,
      expenditures: Array.isArray(payload.expenditures) ? payload.expenditures : s.expenditures,
      reappropriations: Array.isArray(payload.reappropriations) ? payload.reappropriations : s.reappropriations,
      ledger: Array.isArray(payload.ledger) ? payload.ledger : s.ledger,
      auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : s.auditLogs,
    }))
  },

  async hydrateFromBackend() {
    try {
      const [stateBudgets, departmentBudgets, districtAllocations, ledger] = await Promise.all([
        backendBudgetApi.stateBudgets.list().catch(() => []),
        backendBudgetApi.departmentBudgets.list().catch(() => []),
        backendBudgetApi.districtAllocations.list().catch(() => []),
        backendBudgetApi.financialLedger.list().catch(() => []),
      ])
      get().hydrate({
        stateBudgets: stateBudgets.map(mapStateBudget),
        departmentBudgets: departmentBudgets.map(mapDepartmentBudget),
        districtAllocations: districtAllocations.map(mapAllocation),
        ledger: ledger.map(mapLedgerEntry),
      })
      set({ hydrationError: null })
    } catch (error) {
      set({ hydrationError: error })
    }
  },

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

  // Authority matrix + workflow administration (local config)
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

  // ── State budget (backend CRUD) ──────────────────────────────────────────
  async createStateBudget({ fy = get().fy, provision, documentId = null, remarks = '', actor = {} }) {
    if (get().stateBudgets.some((b) => b.fy === fy)) throw new Error('A state budget already exists for this financial year. Use a revision for changes.')
    const record = await backendBudgetApi.stateBudgets.create({
      financial_year: fy,
      authorized_budget_cr: toCr(provision),
      approved_budget_cr: toCr(provision),
      document_id: documentId || null,
      remarks,
    })
    get().writeAudit({ actor, action: 'STATE_BUDGET_CREATED', entity: 'state_budget', entityId: record.id, newValue: `provision ₹${provision}`, reason: remarks })
    await get().hydrateFromBackend()
    return record
  },

  async reviseStateBudget({ fy = get().fy, delta = 0, reason = '', goNumber = '', actor = {} }) {
    const budget = get().stateBudgets.find((b) => b.fy === fy)
    if (!budget) throw new Error('State budget not found for the selected financial year.')
    if (delta === 0) throw new Error('Revision delta cannot be zero.')
    const record = await backendBudgetApi.stateBudgets.update(budget.id, {
      financial_year: fy,
      authorized_budget_cr: toCr(budget.provisionCurrent + delta),
      approved_budget_cr: toCr(budget.provisionCurrent + delta),
      go_number: goNumber || null,
      remarks: reason,
    })
    get().writeAudit({ actor, action: 'STATE_BUDGET_REVISED', entity: 'state_budget', entityId: budget.id, newValue: { delta, goNumber }, reason })
    notify(get, 'budget_approved', `State budget revised for FY ${fy} ${delta >= 0 ? '+' : ''}${(delta / 10000000).toFixed(2)} Cr (${goNumber || 'no order'}).`)
    await get().hydrateFromBackend()
    return record
  },

  // ── Department budget (authorized amount — backend CRUD) ─────────────────
  async createDepartmentBudget({ fy = get().fy, departmentId, budgetHeadId, schemeId = null, provision, authorized, fundSource = 'state_budget', goNumber, goDate, effectiveDate, documentId = null, remarks = '', actor = {} }) {
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
    const record = await backendBudgetApi.departmentBudgets.create({
      financial_year: fy,
      department: departmentId,
      budget_head: budgetHeadId,
      scheme: schemeId || null,
      authorized_budget_cr: toCr(authorized),
      approved_budget_cr: toCr(authorized),
      provision_budget_cr: toCr(provision),
      fund_source: fundSource,
      go_number: goNumber || null,
      go_date: goDate || null,
      effective_date: effectiveDate || null,
      document_id: documentId || null,
      remarks,
    })
    get().writeAudit({ actor, action: 'DEPARTMENT_AUTHORIZATION', entity: 'department_budget', entityId: record.id, newValue: { authorized, provision, goNumber }, reason: remarks })
    notify(get, 'budget_allocated', `Department budget authorized for ${String(departmentId).toUpperCase()} — ₹${(authorized / 10000000).toFixed(2)} Cr (FY ${fy}).`, departmentId)
    await get().hydrateFromBackend()
    return record
  },

  async reviseDepartmentBudget({ id, delta = 0, reason = '', goNumber = '', actor = {} }) {
    const record = get().departmentBudgets.find((d) => d.id === id)
    if (!record) throw new Error('Department budget not found.')
    if (delta === 0) throw new Error('Revision delta cannot be zero.')
    const newAuthorized = record.authorized + delta
    if (newAuthorized < sum(get().sanctions.filter((s) => s.fy === record.fy && s.departmentId === record.departmentId), 'amount')) {
      throw new Error('Revision cannot reduce the authorized amount below the already sanctioned amount.')
    }
    const updated = await backendBudgetApi.departmentBudgets.update(id, {
      authorized_budget_cr: toCr(newAuthorized),
      approved_budget_cr: toCr(newAuthorized),
      go_number: goNumber || null,
      remarks: reason,
    })
    get().writeAudit({ actor, action: 'DEPARTMENT_BUDGET_REVISED', entity: 'department_budget', entityId: id, newValue: { authorized: newAuthorized, delta, goNumber }, reason })
    notify(get, 'budget_approved', `Department budget revised for ${String(record.departmentId).toUpperCase()} (${delta >= 0 ? '+' : ''}${(delta / 10000000).toFixed(2)} Cr).`, record.departmentId)
    await get().hydrateFromBackend()
    return updated
  },

  // ── District allocation (backend CRUD) ───────────────────────────────────
  async allocateDistrict({ fy = get().fy, departmentId, districtId, budgetHeadId, schemeId = null, amount, goNumber = '', idempotencyKey, actor = {} }) {
    if (!departmentId || !districtId || !amount || amount <= 0) throw new Error('Department, district and a positive amount are required.')
    const dbRecord = get().departmentBudgets.find((d) => d.fy === fy && d.departmentId === departmentId)
    if (!dbRecord) throw new Error('No department budget (authorized amount) exists for this FY. Create it first.')
    ensureUniqueIdempotency(get().districtAllocations, { idempotencyKey, errorLabel: 'District allocation' })
    const existing = sum(get().districtAllocations.filter((a) => a.fy === fy && a.departmentId === departmentId), 'amount')
    assertDistrictAllocationWithinDepartment({ requested: amount, departmentAuthorized: dbRecord.authorized, existingAllocated: existing })
    const allocation = await backendBudgetApi.districtAllocations.create({
      financial_year: fy,
      department: departmentId,
      district: districtId,
      budget_head: budgetHeadId,
      scheme: schemeId || null,
      allocated_amount_cr: toCr(amount),
      go_number: goNumber || null,
    })
    get().writeAudit({ actor, action: 'DISTRICT_ALLOCATION', entity: 'district_allocation', entityId: allocation.id, newValue: { districtId, amount }, reason: goNumber })
    notify(get, 'budget_allocated', `District allocation — ${String(districtId).toUpperCase()} ₹${(amount / 10000000).toFixed(2)} Cr under ${String(departmentId).toUpperCase()}.`, departmentId)
    await get().hydrateFromBackend()
    return allocation
  },

  // ── Sanctions / releases / commitments / expenditures / re-appropriation ─
  // BACKEND GAP — no documented endpoint exists for these financial stages.
  async createSanction() { throw new BackendCapabilityError('state finance sanctions') },
  async approveSanction() { throw new BackendCapabilityError('state finance sanctions') },
  async escalateSanction() { throw new BackendCapabilityError('state finance sanctions') },
  async createFundRelease() { throw new BackendCapabilityError('state finance fund releases') },
  async approveRelease() { throw new BackendCapabilityError('state finance fund releases') },
  async createCommitment() { throw new BackendCapabilityError('state finance commitments') },
  async createExpenditure() { throw new BackendCapabilityError('state finance expenditures') },
  async createReappropriation() { throw new BackendCapabilityError('state finance re-appropriations') },
  async approveReappropriation() { throw new BackendCapabilityError('state finance re-appropriations') },

  // ── Ledger + audit plumbing ──────────────────────────────────────────────
  // The ledger is hydrated from GET /api/financial-ledger/.  This mirror keeps
  // the local journal current for screens until the next hydration.
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
  resetFinance() { set({ ...emptyInitial(), notifications: [], notificationsUnread: 0 }) },
}))

// Re-export convenience (used by selectors and workspaces).
export const financeCr = cr
