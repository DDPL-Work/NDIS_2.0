import { ROLES } from './constants'

// Sidebar nav per portal. `roles: null` = visible to every role allowed in that portal.
export const CITIZEN_NAV = [
  { to: '/citizen', label: 'Explore Map', icon: 'Map', end: true },
  { to: '/citizen/schemes', label: 'Government Schemes', icon: 'FileText' },
  { to: '/citizen/grievance/track', label: 'Track a Grievance', icon: 'Search' },
  { to: '/citizen/reports', label: 'Public Reports', icon: 'FileDown' },
]

export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/admin/situation-matrix', label: 'Situation Matrix', icon: 'Map' },
  { to: '/admin/approvals', label: 'Approvals', icon: 'ClipboardCheck' },
  { to: '/admin/tasking', label: 'Tasking', icon: 'Send' },
  { to: '/admin/recommendations', label: 'GIS Decision Support', icon: 'Sparkles' },
  { to: '/admin/grievances', label: 'Grievance Oversight', icon: 'AlertTriangle' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'BarChart2' },
  { to: '/admin/system-health', label: 'System Health', icon: 'Activity' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'ShieldCheck' },
  { to: '/admin/reports', label: 'Reports & Exports', icon: 'FileDown' },
  {
    to: '/admin/state-rollup',
    label: 'Cross-District KPIs',
    icon: 'Globe2',
    roles: [ROLES.STATE_ADMIN],
  },
]

export const LINEDEPT_NAV = [
  { to: '/linedept', label: 'Department Overview', icon: 'LayoutDashboard', end: true },
  { to: '/linedept/data-upload', label: 'Data Upload (CSV)', icon: 'UploadCloud' },
  { to: '/linedept/directives', label: 'Directives Inbox', icon: 'Inbox' },
  { to: '/linedept/proposals', label: 'Proposals', icon: 'FilePlus2' },
  { to: '/linedept/field-ops', label: 'Complaints & Inspections', icon: 'Wrench' },
  { to: '/linedept/schema-config', label: 'Schema Config', icon: 'Settings2' },
]
