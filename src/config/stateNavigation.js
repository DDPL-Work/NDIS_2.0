// State Administration Panel — grouped sidebar navigation.
// Sections render as collapsible groups in the dedicated StateAdminSidebar.
// Items flagged `planned` map to workspaces implemented in later phases;
// every `to` path has a registered route in App.jsx (no dead links).
export const STATE_NAV = {
  sections: [
    {
      label: 'Overview',
      icon: 'LayoutDashboard',
      items: [
        { to: '/state-admin', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
      ],
    },
    {
      label: 'Budget & Finance',
      icon: 'Landmark',
      items: [
        { to: '/state-admin/budget/state', label: 'State Budget', icon: 'Landmark' },
        { to: '/state-admin/budget/departments', label: 'Department Budgets', icon: 'Building2' },
        { to: '/state-admin/budget/districts', label: 'District Allocations', icon: 'MapPin' },
        { to: '/state-admin/budget/history', label: 'Budget History', icon: 'History' },
        { to: '/state-admin/budget/scheme-mapping', label: 'Scheme Budget Mapping', icon: 'Link2' },
        { to: '/state-admin/finance/releases', label: 'Fund Releases', icon: 'HandCoins' },
        { to: '/state-admin/finance/reappropriation', label: 'Re-appropriation', icon: 'ArrowLeftRight' },
        { to: '/state-admin/finance/ledger', label: 'Financial Ledger', icon: 'BookOpenText' },
      ],
    },
    {
      label: 'Departments',
      icon: 'Building2',
      items: [
        { to: '/state-admin/master/departments', label: 'Department Directory & Master', icon: 'Building2' },
        { to: '/state-admin/master/department-hierarchy', label: 'Department Hierarchy', icon: 'Network' },
        { to: '/state-admin/master/department-users', label: 'Department Users', icon: 'Users' },
        { to: '/state-admin/master/department-heads', label: 'Department Heads', icon: 'UserCog' },
      ],
    },
    {
      label: 'Districts',
      icon: 'MapPin',
      items: [
        { to: '/state-admin/master/districts', label: 'District Directory & Master', icon: 'MapPin' },
        { to: '/state-admin/master/district-officers', label: 'District Officers', icon: 'UserRound' },
        { to: '/state-admin/budget/districts', label: 'District Budget & Allocation', icon: 'PiggyBank' },
      ],
    },
    {
      label: 'Schemes & Programs',
      icon: 'Sparkles',
      items: [
        { to: '/state-admin/master/schemes', label: 'Scheme Master', icon: 'Sparkles' },
        { to: '/state-admin/master/scheme-categories', label: 'Scheme Categories', icon: 'Tags' },
        { to: '/state-admin/master/scheme-guidelines', label: 'Scheme Guidelines', icon: 'FileText' },
        { to: '/state-admin/budget/scheme-mapping', label: 'Scheme Budget Mapping', icon: 'Link2' },
      ],
    },
    {
      label: 'Projects',
      icon: 'FolderKanban',
      items: [
        { to: '/state-admin/projects/registry', label: 'Project Registry', icon: 'FolderKanban' },
        { to: '/state-admin/projects/templates', label: 'Project Templates', icon: 'LayoutTemplate' },
        { to: '/state-admin/projects/monitoring', label: 'Project Monitoring', icon: 'Activity' },
        { to: '/state-admin/projects/categories', label: 'Project Categories', icon: 'Tags' },
      ],
    },
    {
      label: 'Approvals',
      icon: 'Inbox',
      items: [
        { to: '/state-admin/approvals/pending', label: 'Pending Approvals', icon: 'Inbox' },
        { to: '/state-admin/finance/sanctions', label: 'Sanctions', icon: 'FileCheck2' },
        { to: '/state-admin/approvals/escalated', label: 'Escalated Approvals', icon: 'AlertOctagon' },
        { to: '/state-admin/approvals/history', label: 'Approval History', icon: 'History' },
      ],
    },
    {
      label: 'Government Orders',
      icon: 'FileSignature',
      items: [
        { to: '/state-admin/orders/all', label: 'Government Orders', icon: 'ScrollText' },
        { to: '/state-admin/orders/circulars', label: 'Circulars', icon: 'MailWarning' },
        { to: '/state-admin/orders/notifications', label: 'Notifications', icon: 'Megaphone' },
        { to: '/state-admin/orders/financial', label: 'Financial Orders', icon: 'Banknote' },
        { to: '/state-admin/orders/administrative', label: 'Administrative Orders', icon: 'Briefcase' },
        { to: '/state-admin/orders/documents', label: 'Document Repository', icon: 'FileText' },
      ],
    },
    {
      label: 'GIS & Assets',
      icon: 'Map',
      items: [
        { to: '/state-admin/gis/layers', label: 'GIS Layers', icon: 'Map' },
        { to: '/state-admin/gis/assets', label: 'Asset Registry', icon: 'Boxes' },
        { to: '/state-admin/gis/district-assets', label: 'District Assets', icon: 'MapPinned' },
        { to: '/state-admin/gis/department-assets', label: 'Department Assets', icon: 'Warehouse' },
      ],
    },
    {
      label: 'Monitoring',
      icon: 'BarChart2',
      items: [
        { to: '/state-admin/analytics', label: 'Analytics', icon: 'BarChart2' },
        { to: '/state-admin/reports', label: 'Reports & Exports', icon: 'FileDown' },
      ],
    },
    {
      label: 'Notifications',
      icon: 'Bell',
      items: [
        { to: '/state-admin/notifications', label: 'Notifications', icon: 'Bell' },
      ],
    },
    {
      label: 'Administration',
      icon: 'Scale',
      items: [
        { to: '/state-admin/users', label: 'Users & Roles', icon: 'UserCog' },
        { to: '/state-admin/authority', label: 'Workflow & Authority', icon: 'Scale' },
        { to: '/state-admin/audit', label: 'Audit & Compliance', icon: 'BookMarked' },
      ],
    },
  ],
}

export const STATE_BRAND = {
  label: 'State Administration',
  subtitle: 'State Governance · Budget & Finance · Monitoring',
  portalIcon: 'Scale',
  accentClassName: 'bg-ink-900',
}