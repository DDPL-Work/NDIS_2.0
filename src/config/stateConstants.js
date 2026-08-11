// State Administration Panel — configuration constants.
// Financial authority values and approval thresholds in this file are
// CONFIGURABLE PLACEHOLDERS for UI/testing only. They are NOT actual
// government rules; no delegation of financial powers from any real
// government document is implied. Production values must be configured
// by the State Administration through Workflow & Authority screens.
import { ROLES } from './constants'

export const STATE_PORTAL_ROLES = [
  ROLES.STATE_SUPER_ADMIN,
  ROLES.STATE_ADMIN,
  ROLES.STATE_FINANCE_ADMIN,
  ROLES.STATE_DEPT_ADMIN,
  ROLES.STATE_MONITORING_OFFICER,
  ROLES.STATE_GIS_ADMIN,
  ROLES.SYSTEM_ADMIN,
]

// ── Financial lifecycle stages (fixed vocabulary across the panel) ────────
export const FINANCIAL_STAGES = [
  { key: 'provision', label: 'Budget Provision' },
  { key: 'authorized', label: 'Authorized Amount' },
  { key: 'allocated', label: 'Allocated' },
  { key: 'sanctioned', label: 'Sanctioned' },
  { key: 'released', label: 'Released' },
  { key: 'committed', label: 'Committed' },
  { key: 'utilized', label: 'Utilized' },
]

export const DERIVED_BALANCES = [
  { key: 'unreleased', label: 'Unreleased (Sanctioned − Released)' },
  { key: 'availableAfterRelease', label: 'Available (Released − Committed)' },
  { key: 'uncommitted', label: 'Uncommitted (Released − Committed)' },
  { key: 'unutilized', label: 'Unutilized (Committed − Utilized)' },
  { key: 'unallocated', label: 'Unallocated (Authorized − District Allocation)' },
]

// ── Transaction types (financial ledger) ───────────────────────────────────
export const LEDGER_TRANSACTION_TYPES = [
  'BUDGET_CREATED',
  'BUDGET_REVISED',
  'DEPARTMENT_ALLOCATION',
  'DISTRICT_ALLOCATION',
  'SANCTION',
  'FUND_RELEASE',
  'COMMITMENT',
  'EXPENDITURE',
  'REAPPROPRIATION_IN',
  'REAPPROPRIATION_OUT',
  'REVERSAL',
  'ADJUSTMENT',
]

export const LEDGER_TYPE_LABELS = {
  BUDGET_CREATED: 'Budget Created',
  BUDGET_REVISED: 'Budget Revised',
  DEPARTMENT_ALLOCATION: 'Department Allocation',
  DISTRICT_ALLOCATION: 'District Allocation',
  SANCTION: 'Sanction',
  FUND_RELEASE: 'Fund Release',
  COMMITMENT: 'Commitment',
  EXPENDITURE: 'Expenditure',
  REAPPROPRIATION_IN: 'Re-appropriation (In)',
  REAPPROPRIATION_OUT: 'Re-appropriation (Out)',
  REVERSAL: 'Reversal',
  ADJUSTMENT: 'Adjustment',
}

// ── Source of funds ─────────────────────────────────────────────────────────
export const FUND_SOURCES = [
  { value: 'state_budget', label: 'State Budget' },
  { value: 'centrally_sponsored', label: 'Centrally Sponsored Scheme' },
  { value: 'central_sector', label: 'Central Sector Scheme' },
  { value: 'state_plan', label: 'State Plan' },
  { value: 'mla_lds', label: 'MLA Local Development Scheme' },
  { value: 'mp_lds', label: 'MP Local Development Scheme' },
  { value: 'district_plan', label: 'District Plan' },
  { value: 'external_aid', label: 'Externally Aided Project' },
]

// ── Budget head categories ─────────────────────────────────────────────────
export const BUDGET_HEADS = [
  { id: 'bh-establishment', code: '4121-01-101', label: 'Establishment', category: 'Salaries' },
  { id: 'bh-infrastructure', code: '4216-01-800', label: 'Infrastructure & Capital Works', category: 'Capital' },
  { id: 'bh-equipment', code: '2216-02-108', label: 'Machinery & Equipment', category: 'Capital' },
  { id: 'bh-maintenance', code: '2216-02-200', label: 'Maintenance & Repair', category: 'Revenue' },
  { id: 'bh-materials', code: '2216-02-101', label: 'Materials & Supplies', category: 'Revenue' },
  { id: 'bh-new-schemes', code: '2216-80-800', label: 'New Schemes', category: 'Scheme' },
  { id: 'bh-continuing', code: '2250-80-800', label: 'Continuing Schemes', category: 'Scheme' },
  { id: 'bh-grants', code: '3604-00-800', label: 'Grants-in-Aid', category: 'Transfer' },
  { id: 'bh-training', code: '2230-00-800', label: 'Training & Capacity Building', category: 'Revenue' },
  { id: 'bh-solar', code: '2810-80-800', label: 'Renewable Energy Development', category: 'Scheme' },
]

// ── Government order / document types ───────────────────────────────────────
export const DOCUMENT_TYPES = [
  { value: 'state_budget', label: 'State Budget' },
  { value: 'government_order', label: 'Government Order' },
  { value: 'financial_sanction', label: 'Financial Sanction' },
  { value: 'administrative_approval', label: 'Administrative Approval' },
  { value: 'fund_release_order', label: 'Fund Release Order' },
  { value: 'reappropriation_order', label: 'Re-appropriation Order' },
  { value: 'circular', label: 'Circular' },
  { value: 'notification', label: 'Notification' },
  { value: 'scheme_guideline', label: 'Scheme Guideline' },
  { value: 'department_order', label: 'Department Order' },
  { value: 'policy', label: 'Policy Document' },
]

export const DOCUMENT_TYPE_LABELS = Object.fromEntries(DOCUMENT_TYPES.map((d) => [d.value, d.label]))

// ── Project lifecycle statuses ──────────────────────────────────────────────
export const PROJECT_STATUSES = [
  'draft',
  'proposed',
  'under_review',
  'approved',
  'sanctioned',
  'released',
  'in_progress',
  'completed',
  'closed',
  'rejected',
  'cancelled',
]

export const PROJECT_STATUS_LABELS = {
  draft: 'Draft',
  proposed: 'Proposed',
  under_review: 'Under Review',
  approved: 'Approved',
  sanctioned: 'Sanctioned',
  released: 'Released',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export const PROJECT_STATUS_TONE = {
  draft: 'neutral',
  proposed: 'info',
  under_review: 'warning',
  approved: 'info',
  sanctioned: 'info',
  released: 'warning',
  in_progress: 'positive',
  completed: 'positive',
  closed: 'neutral',
  rejected: 'negative',
  cancelled: 'neutral',
}

// ── Scheme types ────────────────────────────────────────────────────────────
export const SCHEME_TYPES = [
  { value: 'centrally_sponsored', label: 'Centrally Sponsored Scheme' },
  { value: 'state_scheme', label: 'State Scheme' },
  { value: 'central_sector', label: 'Central Sector Scheme' },
  { value: 'flagship', label: 'State Flagship Programme' },
]

// ── Authority matrix (Delegation of Financial Powers) ───────────────────────
// CONFIGURABLE PLACEHOLDERS — illustrative values for UI/testing only.
// Not derived from any government document. Limits are editable at
// Workflow & Authority → Financial Authority and enforced by authorityService.
export const DEFAULT_AUTHORITY_MATRIX = [
  {
    authorityId: 'AUTH-DM',
    authorityType: 'administrative',
    role: ROLES.DM,
    title: 'District Magistrate (Delegated)',
    departmentId: null,
    maxFinancialLimit: 500000000,          // ₹5 Cr placeholder
    projectApprovalLimit: 200000000,       // ₹2 Cr placeholder
    sanctionLimit: 500000000,              // ₹5 Cr placeholder
    releaseLimit: 200000000,               // ₹2 Cr placeholder
    reappropriationLimit: 50000000,        // ₹50 L placeholder
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    applicableSchemeIds: [],
    applicableDistrictIds: [],
    escalationAuthority: 'State Department',
    status: 'active',
    supportingOrder: 'GO-AUTH-001',
    isPlaceholder: true,
    placeholderNote: 'Configurable placeholder — not an actual rule.',
  },
  {
    authorityId: 'AUTH-COMMISSIONER',
    authorityType: 'administrative',
    role: 'commissioner',
    title: 'Commissioner / Divisional Authority',
    departmentId: null,
    maxFinancialLimit: 1000000000,         // ₹10 Cr placeholder
    projectApprovalLimit: 500000000,
    sanctionLimit: 1000000000,
    releaseLimit: 500000000,
    reappropriationLimit: 100000000,
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    applicableSchemeIds: [],
    applicableDistrictIds: [],
    escalationAuthority: 'State Department',
    status: 'active',
    supportingOrder: 'GO-AUTH-001',
    isPlaceholder: true,
    placeholderNote: 'Configurable placeholder — not an actual rule.',
  },
  {
    authorityId: 'AUTH-STATE-DEPT',
    authorityType: 'department',
    role: ROLES.STATE_DEPT_ADMIN,
    title: 'State Department (Secretary / HoD)',
    departmentId: null,
    maxFinancialLimit: 2500000000,         // ₹25 Cr placeholder
    projectApprovalLimit: 1000000000,
    sanctionLimit: 2500000000,
    releaseLimit: 1000000000,
    reappropriationLimit: 250000000,
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    applicableSchemeIds: [],
    applicableDistrictIds: [],
    escalationAuthority: 'Finance Authority',
    status: 'active',
    supportingOrder: 'GO-AUTH-002',
    isPlaceholder: true,
    placeholderNote: 'Configurable placeholder — not an actual rule.',
  },
  {
    authorityId: 'AUTH-FINANCE',
    authorityType: 'finance',
    role: ROLES.STATE_FINANCE_ADMIN,
    title: 'State Finance Authority',
    departmentId: null,
    maxFinancialLimit: 10000000000,        // ₹100 Cr placeholder
    projectApprovalLimit: 5000000000,
    sanctionLimit: 10000000000,
    releaseLimit: 5000000000,
    reappropriationLimit: 2000000000,
    effectiveFrom: '2026-04-01',
    effectiveTo: null,
    applicableSchemeIds: [],
    applicableDistrictIds: [],
    escalationAuthority: 'State Cabinet',
    status: 'active',
    supportingOrder: 'GO-AUTH-003',
    isPlaceholder: true,
    placeholderNote: 'Configurable placeholder — not an actual rule.',
  },
]

// ── Permission vocabulary (module.action) ───────────────────────────────────
// Mirrors the department framework convention; scoped to state administration.
export const STATE_PERMISSIONS = {
  'dashboard.view': 'View State Dashboard',
  'budget.view': 'View State Budgets (any FY)',
  'budget.create': 'Create State Budget',
  'budget.revise': 'Revise / Supplementary Budget',
  'budget.approve': 'Approve Budget & Department Authorization',
  'deptbudget.allocate': 'Allocate Department Budget (Authorized Amount)',
  'district.allocate': 'Allocate District Budget',
  'sanction.view': 'View Sanctions',
  'sanction.create': 'Create Sanction',
  'sanction.approve': 'Approve Sanction',
  'release.view': 'View Fund Releases',
  'release.create': 'Issue Fund Release',
  'release.approve': 'Approve Fund Release',
  'reappropriate': 'Re-appropriate Budget Heads',
  'ledger.view': 'View Financial Ledger',
  'master.view': 'View Master Data',
  'master.manage': 'Create / Edit Master Data (Departments, Districts, Schemes)',
  'scheme.manage': 'Manage Schemes & Guidelines',
  'project.view': 'View Project Registry',
  'project.manage': 'Manage Project Registry & Monitoring',
  'proposal.review': 'Review Project Proposals',
  'approval.handle': 'Handle Pending Approvals (within authority)',
  'order.view': 'View Government Orders',
  'order.manage': 'Register / Publish Government Orders',
  'authority.view': 'View Authority Matrix & Workflows',
  'authority.manage': 'Configure Authority Matrix & Workflows',
  'user.manage': 'Manage Users, Roles & Permissions',
  'audit.view': 'View Audit Trail',
  'analytics.view': 'View State Analytics',
  'report.view': 'View Reports',
  'report.export': 'Export Reports',
  'gis.view': 'View GIS Layers & Assets',
  'gis.manage': 'Manage GIS Layers & Asset Registry',
  'notification.view': 'View Notifications',
  'notification.send': 'Send Notifications',
}

export const STATE_ROLE_PERMISSIONS = {
  [ROLES.STATE_SUPER_ADMIN]: Object.keys(STATE_PERMISSIONS),
  [ROLES.STATE_ADMIN]: Object.keys(STATE_PERMISSIONS),
  [ROLES.SYSTEM_ADMIN]: Object.keys(STATE_PERMISSIONS),
  [ROLES.STATE_FINANCE_ADMIN]: [
    'dashboard.view', 'budget.view', 'budget.create', 'budget.revise', 'budget.approve',
    'deptbudget.allocate', 'district.allocate', 'sanction.view', 'sanction.create', 'sanction.approve',
    'release.view', 'release.create', 'release.approve', 'reappropriate', 'ledger.view',
    'proposal.review', 'approval.handle', 'order.view', 'order.manage', 'authority.view',
    'audit.view', 'analytics.view', 'report.view', 'report.export', 'notification.view', 'notification.send',
    'project.view', 'master.view',
  ],
  [ROLES.STATE_DEPT_ADMIN]: [
    'dashboard.view', 'budget.view', 'deptbudget.allocate', 'district.allocate', 'sanction.view',
    'sanction.create', 'release.view', 'release.create', 'ledger.view', 'master.view', 'scheme.manage',
    'project.view', 'project.manage', 'proposal.review', 'approval.handle', 'order.view', 'order.manage',
    'authority.view', 'analytics.view', 'report.view', 'report.export', 'gis.view', 'notification.view',
  ],
  [ROLES.STATE_MONITORING_OFFICER]: [
    'dashboard.view', 'budget.view', 'sanction.view', 'release.view', 'ledger.view', 'master.view',
    'project.view', 'approval.handle', 'order.view', 'analytics.view', 'report.view', 'report.export',
    'audit.view', 'gis.view', 'notification.view',
  ],
  [ROLES.STATE_GIS_ADMIN]: [
    'dashboard.view', 'gis.view', 'gis.manage', 'master.view', 'project.view', 'order.view',
    'analytics.view', 'report.view', 'report.export', 'notification.view',
  ],
}

// ── Approval workflow actions ───────────────────────────────────────────────
export const APPROVAL_ACTIONS = ['approve', 'reject', 'return', 'clarify', 'escalate', 'delegate', 'forward']

export const APPROVAL_ACTION_LABELS = {
  approve: 'Approve',
  reject: 'Reject',
  return: 'Return',
  clarify: 'Request Clarification',
  escalate: 'Escalate',
  delegate: 'Delegate',
  forward: 'Forward',
}

// ── Notification types ──────────────────────────────────────────────────────
export const STATE_NOTIFICATION_TYPES = [
  { value: 'budget_allocated', label: 'Budget allocated' },
  { value: 'budget_approved', label: 'Budget approved' },
  { value: 'proposal_submitted', label: 'Proposal submitted' },
  { value: 'proposal_returned', label: 'Proposal returned' },
  { value: 'sanction_issued', label: 'Sanction issued' },
  { value: 'fund_released', label: 'Fund released' },
  { value: 'approval_pending', label: 'Approval pending' },
  { value: 'approval_escalated', label: 'Approval escalated' },
  { value: 'budget_exhaustion', label: 'Budget nearing exhaustion' },
  { value: 'low_utilization', label: 'Low utilization' },
  { value: 'project_delayed', label: 'Project delayed' },
  { value: 'order_published', label: 'Government order published' },
]

export const STATE_NOTIFICATION_TYPE_LABELS = Object.fromEntries(STATE_NOTIFICATION_TYPES.map((n) => [n.value, n.label]))

// ── Financial year defaults ─────────────────────────────────────────────────
export const DEFAULT_FINANCIAL_YEAR = '2026-27'

export const FINANCIAL_YEARS = [
  { id: 'fy-2024-25', code: '2024-25', label: 'Financial Year 2024-25', startDate: '2024-04-01', endDate: '2025-03-31', status: 'closed' },
  { id: 'fy-2025-26', code: '2025-26', label: 'Financial Year 2025-26', startDate: '2025-04-01', endDate: '2026-03-31', status: 'active' },
  { id: 'fy-2026-27', code: '2026-27', label: 'Financial Year 2026-27', startDate: '2026-04-01', endDate: '2027-03-31', status: 'active' },
]