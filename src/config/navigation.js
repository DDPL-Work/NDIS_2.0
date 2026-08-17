import { ROLES } from './constants'

// Navigation strictly tailored to RBAC permissions per persona (Part 2 Requirements)

export const CITIZEN_NAV = [
  { to: '/citizen', label: 'Dashboard', icon: 'LayoutDashboard', end: true, tour: 'citizen-dashboard' },
  { to: '/citizen/map', label: 'Explore Map', icon: 'Map', tour: 'citizen-explore-map' },
  { to: '/citizen/register', label: 'Register Complaint', icon: 'PlusCircle', tour: 'citizen-register-complaint' },
  { to: '/citizen/complaints', label: 'My Complaints', icon: 'FileText', tour: 'citizen-my-complaints' },
  { to: '/citizen/track', label: 'Track Complaint', icon: 'Search', tour: 'citizen-track-complaint' },
  { to: '/citizen/schemes', label: 'Schemes', icon: 'Sparkles', tour: 'citizen-schemes' },
  { to: '/citizen/facilities', label: 'Facilities', icon: 'Building2', tour: 'citizen-facilities' },
  { to: '/citizen/notifications', label: 'Notifications', icon: 'Bell', tour: 'citizen-notifications' },
  { to: '/citizen/profile', label: 'Profile', icon: 'User', tour: 'citizen-profile' },
]

export const ADMIN_NAV = [
  { to: '/admin/collector-dashboard', label: 'District Command Center', icon: 'LayoutDashboard', end: true },
  { to: '/admin/situation-matrix', label: 'District GIS', icon: 'Map' },
  { to: '/admin/complaints-oversight', label: 'Complaints', icon: 'AlertTriangle' },
  { to: '/admin/departments-overview', label: 'Departments', icon: 'Building2' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'BarChart2' },
  { to: '/admin/reports', label: 'Reports', icon: 'FileDown' },
  { to: '/admin/recommendations', label: 'AI Recommendations', icon: 'Sparkles' },
  { to: '/admin/approvals', label: 'Approvals', icon: 'ClipboardCheck' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'Bell' },
  { to: '/admin/state-rollup', label: 'Cross-District KPIs', icon: 'Globe2', roles: [ROLES.STATE_ADMIN] },
]

export const LINEDEPT_NAV = [
  { to: '/linedept', label: 'Department Dashboard', icon: 'LayoutDashboard', end: true },
  { to: '/linedept/complaints-queue', label: 'Assigned Complaints', icon: 'Inbox' },
  { to: '/linedept/gis', label: 'Department GIS', icon: 'Map' },
  { to: '/linedept/schema-config', label: 'Assets', icon: 'Settings2' },
  { to: '/linedept/proposals', label: 'Workflow', icon: 'FilePlus2' },
  { to: '/linedept/data-upload', label: 'CSV Upload', icon: 'UploadCloud' },
  { to: '/linedept/reports', label: 'Reports', icon: 'FileDown' },
]

export const ENGINEER_NAV = [
  { to: '/engineer', label: 'My Jobs', icon: 'Wrench', end: true },
  { to: '/engineer/today-tasks', label: "Today's Tasks", icon: 'CheckSquare' },
  { to: '/engineer/navigation', label: 'Navigation', icon: 'Navigation' },
  { to: '/engineer/inspection', label: 'Inspection Form', icon: 'ClipboardList' },
  { to: '/engineer/evidence', label: 'Upload Evidence', icon: 'Camera' },
  { to: '/engineer/offline-sync', label: 'Offline Sync', icon: 'RefreshCw' },
]
