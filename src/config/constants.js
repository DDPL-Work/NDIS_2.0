// Central reference data mirroring LLD Vol 1 §7 (Personas), Vol 2 Ch 14 (RBAC),
// Vol 1 §1.4 (pilot districts) and Vol 3 Ch 16 (Department Modules).
// Kept as plain config (not code) so new roles/departments/districts don't
// require touching component logic — same "configuration not code" principle
// the workflow engine (Vol 3 §15.1) uses.

export const PORTALS = {
  CITIZEN: 'citizen',
  ADMIN: 'admin',
  LINEDEPT: 'linedept',
}

// LLD Vol 2 §14.1 Roles
export const ROLES = {
  CITIZEN: 'citizen',
  FIELD_ENGINEER: 'field_engineer',
  DEPT_OFFICER: 'dept_officer',
  ADM: 'adm',
  DM: 'dm',
  STATE_ADMIN: 'state_admin',
}

export const ROLE_LABELS = {
  [ROLES.CITIZEN]: 'Citizen',
  [ROLES.FIELD_ENGINEER]: 'Field Engineer / Data Entry Operator',
  [ROLES.DEPT_OFFICER]: 'Department Officer',
  [ROLES.ADM]: 'Additional District Magistrate (ADM)',
  [ROLES.DM]: 'District Collector / DM',
  [ROLES.STATE_ADMIN]: 'State Admin',
}

// Which portal a role lands in after login
export const ROLE_PORTAL = {
  [ROLES.CITIZEN]: PORTALS.CITIZEN,
  [ROLES.FIELD_ENGINEER]: PORTALS.LINEDEPT,
  [ROLES.DEPT_OFFICER]: PORTALS.LINEDEPT,
  [ROLES.ADM]: PORTALS.ADMIN,
  [ROLES.DM]: PORTALS.ADMIN,
  [ROLES.STATE_ADMIN]: PORTALS.ADMIN,
}

// LLD Vol 1 §1.4 (A5) — six pilot sectors
export const DEPARTMENTS = [
  { id: 'health', label: 'Health', color: '#c0392b', accent: 'alert', icon: 'HeartPulse' },
  { id: 'water', label: 'Water & Sanitation', color: '#1d7ab5', accent: 'sky', icon: 'Droplets' },
  { id: 'education', label: 'Education', color: '#1f7a54', accent: 'leaf', icon: 'GraduationCap' },
  { id: 'tourism', label: 'Tourism', color: '#8a4fc0', accent: 'violet', icon: 'Landmark' },
  { id: 'solar', label: 'Solar Energy', color: '#e07a2c', accent: 'saffron', icon: 'Sun' },
  { id: 'district_assets', label: 'District Assets', color: '#546882', accent: 'ink', icon: 'Building2' },
]

export const DEPARTMENT_MAP = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]))

// LLD Vol 1 §1.1 — pilot in Nalanda/Rajgir, Bihar; others locked (Phase 2/3 rollout)
export const DISTRICTS = [
  { id: 'nalanda', label: 'Nalanda', state: 'Bihar', center: [85.4434, 25.1372], zoom: 10.4, phase: 'Pilot', population: 2937552 },
  { id: 'rajgir', label: 'Rajgir (Subdivision)', state: 'Bihar', center: [85.4211, 25.0294], zoom: 12, phase: 'Pilot', population: 405000 },
  { id: 'patna', label: 'Patna', state: 'Bihar', center: [85.1376, 25.5941], zoom: 10, phase: 'Phase 2', population: 5838465 },
  { id: 'gaya', label: 'Gaya', state: 'Bihar', center: [84.9994, 24.7955], zoom: 10, phase: 'Phase 2', population: 4391418 },
]

// LLD Vol 3 §15.3 — Proposal → Approval → Budget → Tasking pipeline
export const PROPOSAL_STATES = [
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'budget_approved',
  'tasked', 'assigned_to_field', 'inspection_scheduled', 'inspection_complete',
  'completed', 'citizen_feedback_open', 'closed',
]

export const PROPOSAL_STATE_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under DM Review',
  approved: 'Approved',
  rejected: 'Rejected',
  budget_approved: 'Budget Approved',
  tasked: 'Tasked',
  assigned_to_field: 'Assigned to Field',
  inspection_scheduled: 'Inspection Scheduled',
  inspection_complete: 'Inspection Complete',
  completed: 'Completed',
  citizen_feedback_open: 'Citizen Feedback Open',
  closed: 'Closed',
}

// LLD Vol 3 §15.2 — Citizen Complaint Workflow
export const GRIEVANCE_STATES = ['submitted', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed']

export const GRIEVANCE_STATE_LABELS = {
  submitted: 'Submitted',
  assigned: 'Assigned to Department',
  in_progress: 'In Progress',
  escalated: 'Escalated to ADM/DM',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const STATUS_TONE = {
  draft: 'neutral', submitted: 'info', under_review: 'info', approved: 'positive',
  rejected: 'negative', budget_approved: 'positive', tasked: 'info', assigned_to_field: 'info',
  inspection_scheduled: 'info', inspection_complete: 'positive', completed: 'positive',
  citizen_feedback_open: 'warning', closed: 'neutral',
  assigned: 'info', in_progress: 'warning', escalated: 'negative', resolved: 'positive',
  active: 'positive', inactive: 'neutral', pending: 'warning',
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
]

export const NOTIFICATION_CHANNELS = ['portal', 'sms', 'email']

// LLD Vol 3 §16 — 3 km default deficit radius (configurable per category, §10.4)
export const DEFAULT_DEFICIT_RADIUS_KM = 3
