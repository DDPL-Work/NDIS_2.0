// The single department navigation builder.  It intentionally derives menus from
// authorization, never from a department URL or a parallel portal definition.
// Items are grouped into collapsible sidebar sections; only items that belong
// to a logical cluster are grouped — the rest render as top-level entries.
const OPERATIONS_GROUP = 'Operations'
const WORKFORCE_GROUP = 'Workforce & HR'
const ADMIN_GROUP = 'Administration'

export function getDepartmentNavigation(can = () => false) {
  const items = [
    { to: '/linedept', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
    { to: '/linedept/complaints', label: 'Assigned Complaints', icon: 'Inbox', group: OPERATIONS_GROUP, permission: 'complaints.view' },
    { to: '/linedept/gis', label: 'Department GIS', icon: 'Map', group: OPERATIONS_GROUP, permission: 'gis.view' },
    { to: '/linedept/assets', label: 'Assets', icon: 'Building2', group: OPERATIONS_GROUP, permission: 'assets.view' },
    { to: '/linedept/workflow', label: 'Workflow', icon: 'FileCheck', group: OPERATIONS_GROUP, permission: 'projects.view' },
    { to: '/linedept/planning', label: 'Planning & Proposals', icon: 'ClipboardList', group: OPERATIONS_GROUP, permission: 'projects.view' },
    { to: '/linedept/data-upload', label: 'CSV Upload', icon: 'UploadCloud', group: OPERATIONS_GROUP, permission: 'projects.create' },
    { to: '/linedept/projects', label: 'Projects & Execution', icon: 'FolderGit2', group: OPERATIONS_GROUP, permission: 'projects.view' },
    { to: '/linedept/inventory', label: 'Resources & Finance', icon: 'Boxes', group: OPERATIONS_GROUP, permission: 'inventory.view' },
    { to: '/linedept/reports', label: 'Reports', icon: 'FileDown', group: OPERATIONS_GROUP, permission: 'reports.view' },
    { to: '/linedept/employees', label: 'Employees', icon: 'Users', group: WORKFORCE_GROUP, permission: 'workforce.view' },
    { to: '/linedept/organization', label: 'Organization', icon: 'Network', group: WORKFORCE_GROUP, permission: 'organization.view' },
    { to: '/linedept/roles', label: 'Roles', icon: 'UserCog', group: WORKFORCE_GROUP, permission: 'workforce.roles' },
    { to: '/linedept/permissions', label: 'Permissions', icon: 'ShieldCheck', group: WORKFORCE_GROUP, permission: 'workforce.roles' },
    { to: '/linedept/attendance', label: 'Attendance', icon: 'Clock3', group: WORKFORCE_GROUP, permission: 'workforce.attendance' },
    { to: '/linedept/leave', label: 'Leave', icon: 'FileClock', group: WORKFORCE_GROUP, permission: 'workforce.leave' },
    { to: '/linedept/performance', label: 'Performance', icon: 'Activity', group: WORKFORCE_GROUP, permission: 'workforce.view' },
    { to: '/linedept/audit', label: 'Audit Trail', icon: 'FileClock', group: ADMIN_GROUP, permission: 'workforce.audit' },
    { to: '/linedept/settings', label: 'Department Settings', icon: 'Settings2', group: ADMIN_GROUP, permission: 'settings.view' },
  ]
  return items.filter((item) => !item.permission || can(item.permission))
}
