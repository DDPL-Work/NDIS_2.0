// The single department navigation builder.  It intentionally derives menus from
// authorization, never from a department URL or a parallel portal definition.
export function getDepartmentNavigation(can = () => false) {
  const items = [
    { to: '/linedept', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
    { to: '/linedept/complaints', label: 'Issue records', icon: 'Inbox', permission: 'complaints.view' },
    { to: '/linedept/gis', label: 'Department GIS', icon: 'Map', permission: 'gis.view' },
    { to: '/linedept/decision-support', label: 'Decision Support', icon: 'Crosshair', permission: 'assets.view' },
    { to: '/linedept/assets', label: 'Assets', icon: 'Building2', permission: 'assets.view' },
    { to: '/linedept/workflow', label: 'Delivery workflow', icon: 'FileCheck', permission: 'projects.view' },
    { to: '/linedept/planning', label: 'Plans & proposals', icon: 'ClipboardList', permission: 'projects.view' },
    { to: '/linedept/data-upload', label: 'CSV Upload', icon: 'UploadCloud', permission: 'projects.create' },
    { to: '/linedept/projects', label: 'Project delivery', icon: 'FolderGit2', permission: 'projects.view' },
    { to: '/linedept/inventory', label: 'Resources', icon: 'Boxes', permission: 'inventory.view' },
    { to: '/linedept/reports', label: 'Reports', icon: 'FileDown', permission: 'reports.view' },
    { to: '/linedept/settings', label: 'Department Settings', icon: 'Settings2', permission: 'settings.view' },
  ]
  return items.filter((item) => !item.permission || can(item.permission))
}
