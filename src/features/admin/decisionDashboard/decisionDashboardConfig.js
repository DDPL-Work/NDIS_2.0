// Role-aware dashboard configuration (requirement: DM/Collector get a
// district-wide decision dashboard; department staff get department-scoped
// dashboards; the registry is the single place that maps a role to the
// sections, data scope and title of its dashboard).
//
// Extension point for department-specific dashboards: a department role key
// added here (or in the department registry consumed by DepartmentLayout)
// declares its own section set.  Department flows already resolve their own
// dashboards via the department registry — this file documents the same
// contract at the admin layer so both stay consistent.

export const DASHBOARD_SCOPES = {
  district: {
    label: 'District-wide',
    description: 'All facilities, complaints, proposals and projects in the district.',
  },
  state: {
    label: 'State-wide',
    description: 'Aggregate view across districts where the backend exposes state endpoints.',
  },
  department: {
    label: 'Department-scoped',
    description: 'Single department only — resolved by the department registry.',
  },
}

export const SECTION_LABELS = {
  kpis: 'Critical signals',
  situationMap: 'District situation map',
  priorityAreas: 'Priority areas',
  health: 'Health snapshot',
  signals: 'Citizen signals',
  pipeline: 'Planning pipeline',
  budget: 'Budget',
  actions: 'Action queue',
}

export const DASHBOARD_CONFIG = {
  dm: {
    title: 'DM Decision Dashboard',
    scope: 'district',
    sections: ['kpis', 'situationMap', 'priorityAreas', 'health', 'signals', 'pipeline', 'budget', 'actions'],
  },
  district_collector: {
    title: 'Collector Decision Dashboard',
    scope: 'district',
    sections: ['kpis', 'situationMap', 'priorityAreas', 'health', 'signals', 'pipeline', 'budget', 'actions'],
  },
  adm: {
    title: 'ADM Decision Dashboard',
    scope: 'district',
    sections: ['kpis', 'situationMap', 'priorityAreas', 'health', 'signals', 'pipeline', 'actions'],
  },
  state_admin: {
    title: 'State Admin Overview',
    scope: 'state',
    sections: ['kpis', 'situationMap', 'priorityAreas', 'health', 'signals', 'pipeline', 'actions'],
  },
  system_administrator: {
    title: 'System Administration Overview',
    scope: 'state',
    sections: ['kpis', 'actions'],
  },
}

export const DEPARTMENT_ROLES = ['department_head', 'department_officer', 'supervisor', 'engineer', 'field_inspector']

export function dashboardConfigForRole(role = '') {
  const normalized = String(role || '').toLowerCase()
  return DASHBOARD_CONFIG[normalized] || DASHBOARD_CONFIG.dm
}

// The DM/Collector role set that is entitled to the full district decision view.
export const DISTRICT_DECISION_ROLES = ['dm', 'district_collector', 'adm']