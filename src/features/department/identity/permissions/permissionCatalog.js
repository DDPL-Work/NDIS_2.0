export const PERMISSION_CATALOG = {
  complaints: ['view', 'create', 'assign', 'accept', 'transfer', 'escalate', 'resolve', 'close', 'delete', 'export', 'print'],
  projects: ['view', 'create', 'approve', 'reject', 'budget', 'tender', 'inspection', 'close'],
  inventory: ['view', 'receive', 'issue', 'transfer', 'audit', 'delete'],
  budget: ['view', 'edit', 'approve', 'release', 'reject'],
  gis: ['view', 'edit', 'measure', 'layers', 'export'],
  assets: ['view', 'maintenance', 'inspection', 'replace', 'dispose'],
  reports: ['view', 'generate', 'download', 'export', 'share'],
  ai: ['view', 'execute', 'approve', 'ignore', 'retrain'],
  workforce: ['view', 'create', 'invite', 'manage', 'roles', 'attendance', 'leave', 'audit'],
  organization: ['view', 'manage'],
  notifications: ['view', 'send'],
  settings: ['view', 'edit'],
}

export const ALL_PERMISSIONS = Object.entries(PERMISSION_CATALOG).flatMap(([module, actions]) => actions.map((action) => `${module}.${action}`))

export const DEFAULT_ROLE_PERMISSIONS = {
  dept_head: ALL_PERMISSIONS,
  dept_officer: ALL_PERMISSIONS.filter((permission) => !['budget.approve', 'projects.approve', 'workforce.roles', 'workforce.audit'].includes(permission)),
  engineer: ['projects.view', 'projects.inspection', 'inventory.view', 'assets.view', 'assets.maintenance', 'assets.inspection', 'gis.view', 'reports.view'],
  field_inspector: ['projects.view', 'projects.inspection', 'assets.view', 'assets.inspection', 'gis.view'],
  viewer: ['complaints.view', 'projects.view', 'inventory.view', 'budget.view', 'gis.view', 'assets.view', 'reports.view'],
}
