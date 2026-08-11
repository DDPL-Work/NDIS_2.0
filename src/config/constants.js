// Central reference data mirroring LLD Vol 1 §7 (Personas), Vol 2 Ch 14 (RBAC),
// Vol 1 §1.4 (pilot districts) and Vol 3 Ch 15/16 (Workflow & Department Modules).

export const PORTALS = {
  CITIZEN: 'citizen',
  ADMIN: 'admin',
  LINEDEPT: 'linedept',
  ENGINEER: 'engineer',
  STATEADMIN: 'state-admin',
}

// LLD Vol 2 §14.1 Expanded Roles (10 Roles)
export const ROLES = {
  CITIZEN: 'citizen',
  DISTRICT_COLLECTOR: 'district_collector',
  DM: 'dm',
  ADM: 'adm',
  DEPT_HEAD: 'dept_head',
  DEPT_OFFICER: 'dept_officer',
  ENGINEER: 'engineer',
  FIELD_INSPECTOR: 'field_inspector',
  SUPERVISOR: 'supervisor',
  STATE_ADMIN: 'state_admin',
  STATE_SUPER_ADMIN: 'state_super_admin',
  STATE_FINANCE_ADMIN: 'state_finance_admin',
  STATE_DEPT_ADMIN: 'state_dept_admin',
  STATE_MONITORING_OFFICER: 'state_monitoring_officer',
  STATE_GIS_ADMIN: 'state_gis_admin',
  SYSTEM_ADMIN: 'system_admin',
}

export const ROLE_LABELS = {
  [ROLES.CITIZEN]: 'Citizen',
  [ROLES.DISTRICT_COLLECTOR]: 'District Collector (Executive)',
  [ROLES.DM]: 'District Magistrate (DM)',
  [ROLES.ADM]: 'Additional District Magistrate (ADM)',
  [ROLES.DEPT_HEAD]: 'Department Head',
  [ROLES.DEPT_OFFICER]: 'Department Officer',
  [ROLES.ENGINEER]: 'Executive / Assistant Engineer',
  [ROLES.FIELD_INSPECTOR]: 'Field Inspector / Junior Engineer',
  [ROLES.SUPERVISOR]: 'Field Supervisor',
  [ROLES.STATE_ADMIN]: 'State Admin',
  [ROLES.STATE_SUPER_ADMIN]: 'State Super Admin',
  [ROLES.STATE_FINANCE_ADMIN]: 'State Finance Admin',
  [ROLES.STATE_DEPT_ADMIN]: 'State Department Admin',
  [ROLES.STATE_MONITORING_OFFICER]: 'State Monitoring Officer',
  [ROLES.STATE_GIS_ADMIN]: 'State GIS Admin',
  [ROLES.SYSTEM_ADMIN]: 'System Administrator',
}

// Which portal a role lands in after login
export const ROLE_PORTAL = {
  [ROLES.CITIZEN]: PORTALS.CITIZEN,
  [ROLES.DISTRICT_COLLECTOR]: PORTALS.ADMIN,
  [ROLES.DM]: PORTALS.ADMIN,
  [ROLES.ADM]: PORTALS.ADMIN,
  [ROLES.DEPT_HEAD]: PORTALS.LINEDEPT,
  [ROLES.DEPT_OFFICER]: PORTALS.LINEDEPT,
  [ROLES.ENGINEER]: PORTALS.ENGINEER,
  [ROLES.FIELD_INSPECTOR]: PORTALS.ENGINEER,
  [ROLES.SUPERVISOR]: PORTALS.LINEDEPT,
  [ROLES.STATE_ADMIN]: PORTALS.STATEADMIN,
  [ROLES.STATE_SUPER_ADMIN]: PORTALS.STATEADMIN,
  [ROLES.STATE_FINANCE_ADMIN]: PORTALS.STATEADMIN,
  [ROLES.STATE_DEPT_ADMIN]: PORTALS.STATEADMIN,
  [ROLES.STATE_MONITORING_OFFICER]: PORTALS.STATEADMIN,
  [ROLES.STATE_GIS_ADMIN]: PORTALS.STATEADMIN,
  [ROLES.SYSTEM_ADMIN]: PORTALS.ADMIN,
}

// LLD Vol 1 §1.4 (A5) — six pilot sectors
export const DEPARTMENTS = [
  { id: 'water', label: 'Water & Sanitation (JJM)', color: '#1d7ab5', accent: 'sky', icon: 'Droplets' },
  { id: 'health', label: 'Health Department', color: '#c0392b', accent: 'alert', icon: 'HeartPulse' },
  { id: 'education', label: 'School Education', color: '#1f7a54', accent: 'leaf', icon: 'GraduationCap' },
  { id: 'pwd', label: 'Public Works Dept (PWD / Roads)', color: '#546882', accent: 'ink', icon: 'Building2' },
  { id: 'electricity', label: 'Electricity Board', color: '#e07a2c', accent: 'saffron', icon: 'Zap' },
  { id: 'urban', label: 'Urban Local Body / Sanitation', color: '#8a4fc0', accent: 'violet', icon: 'Landmark' },
  { id: 'solar', label: 'Solar & Renewable Energy', color: '#d35400', accent: 'saffron', icon: 'Sun' },
  { id: 'tourism', label: 'Tourism & Heritage Development', color: '#8e44ad', accent: 'violet', icon: 'Compass' },
]

export const DEPARTMENT_MAP = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, d]))

// Automatic Routing Rules Table (Category → Responsible Dept)
export const CATEGORY_ROUTING_RULES = [
  {
    categoryId: 'broken_handpump',
    categoryName: 'Broken Handpump / Borewell Defect',
    departmentId: 'water',
    defaultPriority: 'high',
    slaHours: 24,
    keywords: ['handpump', 'borewell', 'water', 'pump', 'jjm'],
  },
  {
    categoryId: 'water_leakage',
    categoryName: 'Piped Water Leakage / Contamination',
    departmentId: 'water',
    defaultPriority: 'urgent',
    slaHours: 12,
    keywords: ['leakage', 'contamination', 'dirty water', 'pipe'],
  },
  {
    categoryId: 'garbage_accumulation',
    categoryName: 'Garbage Accumulation / Sanitation',
    departmentId: 'urban',
    defaultPriority: 'medium',
    slaHours: 24,
    keywords: ['garbage', 'waste', 'trash', 'drain', 'sanitation', 'cleanliness'],
  },
  {
    categoryId: 'street_light_out',
    categoryName: 'Non-Functional Street Light',
    departmentId: 'electricity',
    defaultPriority: 'low',
    slaHours: 48,
    keywords: ['street light', 'light', 'dark', 'bulb', 'pole'],
  },
  {
    categoryId: 'power_outage',
    categoryName: 'Transformer Failure / Power Outage',
    departmentId: 'electricity',
    defaultPriority: 'urgent',
    slaHours: 6,
    keywords: ['transformer', 'power', 'electricity', 'blackout', 'voltage'],
  },
  {
    categoryId: 'hospital_facility_issue',
    categoryName: 'Hospital Staff / Oxygen / Facility Issue',
    departmentId: 'health',
    defaultPriority: 'high',
    slaHours: 12,
    keywords: ['hospital', 'doctor', 'medicine', 'oxygen', 'ambulance', 'phc'],
  },
  {
    categoryId: 'school_infrastructure',
    categoryName: 'School Infrastructure / Roof / Sanitation',
    departmentId: 'education',
    defaultPriority: 'medium',
    slaHours: 48,
    keywords: ['school', 'classroom', 'teacher', 'midday meal', 'bench'],
  },
  {
    categoryId: 'road_pothole',
    categoryName: 'Road Potholes / Damaged Bridge',
    departmentId: 'pwd',
    defaultPriority: 'medium',
    slaHours: 72,
    keywords: ['road', 'pothole', 'bridge', 'tar', 'highway', 'pmgsy'],
  },
]

// Administrative Hierarchy Structure
export const ADMINISTRATIVE_STRUCTURE = {
  state: 'Bihar',
  districts: [
    {
      id: 'nalanda',
      label: 'Nalanda',
      center: [85.4434, 25.1372],
      zoom: 10.4,
      blocks: [
        {
          id: 'silao',
          label: 'Silao',
          villages: ['Rajgir', 'Silao Bazar', 'Surajpur', 'Mahadeopur'],
          wards: ['Ward 01', 'Ward 02', 'Ward 03', 'Ward 04'],
        },
        {
          id: 'biharsharif',
          label: 'Bihar Sharif',
          villages: ['Sohsarai', 'Badi Dargah', 'Ramchandrapur', 'Kagzi Mohalla'],
          wards: ['Ward 05', 'Ward 06', 'Ward 07', 'Ward 08'],
        },
        {
          id: 'harnaut',
          label: 'Harnaut',
          villages: ['Cheran', 'Sabait', 'Lohra', 'Poari'],
          wards: ['Ward 01', 'Ward 02', 'Ward 03'],
        },
      ],
    },
    {
      id: 'rajgir',
      label: 'Rajgir (Subdivision)',
      center: [85.4211, 25.0294],
      zoom: 12,
      blocks: [
        {
          id: 'rajgir_block',
          label: 'Rajgir Block',
          villages: ['Kund Area', 'Venu Vana', 'Giriak Road', 'Banganga'],
          wards: ['Ward 01', 'Ward 02', 'Ward 03', 'Ward 04'],
        },
      ],
    },
  ],
}

export const DISTRICTS = ADMINISTRATIVE_STRUCTURE.districts

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

export const GRIEVANCE_STATES = ['submitted', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed']

export const GRIEVANCE_STATE_LABELS = {
  submitted: 'Submitted',
  assigned: 'Assigned to Department',
  in_progress: 'In Progress',
  escalated: 'Escalated to ADM/DM',
  resolved: 'Resolved',
  closed: 'Closed',
}

// Program 2 — 11-Stage Workflow Engine State Machine (LLD Vol 3 §15.2)
export const COMPLAINT_WORKFLOW_STATES = [
  'draft',
  'submitted',
  'assigned',
  'accepted',
  'inspection_scheduled',
  'inspection_completed',
  'work_started',
  'work_completed',
  'verification_pending',
  'citizen_verified',
  'resolved',
  'citizen_confirmation',
  'closed',
  // Re-entrant / Side states:
  'rejected',
  'cancelled',
  'escalated',
  'reopened',
]

export const COMPLAINT_STATE_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  assigned: 'Assigned to Officer',
  accepted: 'Accepted by Dept',
  inspection_started: 'Inspection Started',
  evidence_uploaded: 'Evidence Uploaded',
  inspection_scheduled: 'Inspection Scheduled',
  inspection_completed: 'Inspection Completed',
  work_started: 'Work Started',
  work_completed: 'Work Completed',
  verification_pending: 'Resolved Awaiting Citizen',
  resolved: 'Resolved Awaiting Citizen',
  citizen_verified: 'Citizen Verified',
  citizen_confirmation: 'Citizen Verification',
  closed: 'Resolved by Citizen',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  transferred: 'Transferred',
  escalated: 'Escalated to Collector',
  reopened: 'Reopened by Citizen',
}

export const STATUS_TONE = {
  submitted: 'info',
  assigned: 'info',
  accepted: 'info',
  inspection_started: 'warning',
  evidence_uploaded: 'info',
  inspection_scheduled: 'warning',
  inspection_completed: 'info',
  work_started: 'warning',
  work_completed: 'positive',
  verification_pending: 'warning',
  citizen_verified: 'positive',
  resolved: 'positive',
  citizen_confirmation: 'warning',
  // Citizen closed the complaint after verifying the fix — the final,
  // citizen-confirmed resolution (so it renders as resolved, not neutral).
  closed: 'positive',
  rejected: 'negative',
  cancelled: 'neutral',
  transferred: 'info',
  escalated: 'negative',
  reopened: 'negative',
  draft: 'neutral',
  active: 'positive',
  inactive: 'neutral',
  pending: 'warning',
}

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: '#c0392b', tone: 'negative', defaultSlaHours: 6 },
  high: { label: 'High', color: '#e07a2c', tone: 'warning', defaultSlaHours: 12 },
  medium: { label: 'Medium', color: '#1d7ab5', tone: 'info', defaultSlaHours: 24 },
  low: { label: 'Low', color: '#1f7a54', tone: 'positive', defaultSlaHours: 48 },
}

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
]

export const NOTIFICATION_CHANNELS = ['portal', 'sms', 'email']
export const DEFAULT_DEFICIT_RADIUS_KM = 3
