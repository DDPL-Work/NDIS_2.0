// The single department navigation builder.  It intentionally derives menus from
// authorization, never from a department URL or a parallel portal definition.
export function getDepartmentNavigation(can = () => false) {
  const items = [
    { to: '/linedept', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
    { to: '/linedept/complaints', label: 'Assigned Complaints', icon: 'Inbox', permission: 'complaints.view' },
    { to: '/linedept/gis', label: 'Department GIS', icon: 'Map', permission: 'gis.view' },
    { to: '/linedept/assets', label: 'Assets', icon: 'Building2', permission: 'assets.view' },
    { to: '/linedept/workflow', label: 'Workflow', icon: 'FileCheck', permission: 'projects.view' },
    { to: '/linedept/planning', label: 'Planning & Proposals', icon: 'ClipboardList', permission: 'projects.view' },
    { to: '/linedept/data-upload', label: 'CSV Upload', icon: 'UploadCloud', permission: 'projects.create' },
    { to: '/linedept/projects', label: 'Projects & Execution', icon: 'FolderGit2', permission: 'projects.view' },
    { to: '/linedept/inventory', label: 'Resources & Finance', icon: 'Boxes', permission: 'inventory.view' },
    { to: '/linedept/reports', label: 'Reports', icon: 'FileDown', permission: 'reports.view' },
    { to: '/linedept/employees', label: 'Employees', icon: 'Users', permission: 'workforce.view' },
    { to: '/linedept/organization', label: 'Organization', icon: 'Network', permission: 'organization.view' },
    { to: '/linedept/roles', label: 'Roles', icon: 'UserCog', permission: 'workforce.roles' },
    { to: '/linedept/permissions', label: 'Permissions', icon: 'ShieldCheck', permission: 'workforce.roles' },
    { to: '/linedept/attendance', label: 'Attendance', icon: 'Clock3', permission: 'workforce.attendance' },
    { to: '/linedept/leave', label: 'Leave', icon: 'FileClock', permission: 'workforce.leave' },
    { to: '/linedept/performance', label: 'Performance', icon: 'Activity', permission: 'workforce.view' },
    { to: '/linedept/audit', label: 'Audit Trail', icon: 'FileClock', permission: 'workforce.audit' },
    { to: '/linedept/settings', label: 'Department Settings', icon: 'Settings2', permission: 'settings.view' },
  ]
  return items.filter((item) => !item.permission || can(item.permission))
}
