// DM Schedule & Tasks — constants.
// Centralised type / status / priority labels used across the DM action workspace.

export const TASK_TYPES = {
  INTERVENTION: 'intervention',
  PROPOSAL: 'proposal',
  INSPECTION: 'inspection',
  ESCALATION: 'escalation',
  WORK_ORDER: 'work_order',
}

export const TASK_TYPE_LABELS = {
  [TASK_TYPES.INTERVENTION]: 'Intervention / DPR',
  [TASK_TYPES.PROPOSAL]: 'Proposal (DPR)',
  [TASK_TYPES.INSPECTION]: 'Field Inspection',
  [TASK_TYPES.ESCALATION]: 'District Escalation',
  [TASK_TYPES.WORK_ORDER]: 'Work Order',
}

export const TASK_TYPE_DESCRIPTIONS = {
  [TASK_TYPES.INTERVENTION]: 'Create a development action for this priority location.',
  [TASK_TYPES.PROPOSAL]: 'Prepare a DPR for this priority location.',
  [TASK_TYPES.INSPECTION]: 'Schedule an inspection at the facility/location.',
  [TASK_TYPES.ESCALATION]: 'Escalate this issue for district-level attention.',
  [TASK_TYPES.WORK_ORDER]: 'Execute assigned work order.',
}

export const TASK_TYPE_ICONS = {
  [TASK_TYPES.INTERVENTION]: 'ClipboardList',
  [TASK_TYPES.PROPOSAL]: 'FileText',
  [TASK_TYPES.INSPECTION]: 'Search',
  [TASK_TYPES.ESCALATION]: 'AlertTriangle',
  [TASK_TYPES.WORK_ORDER]: 'HardHat',
}

export const TASK_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  OVERDUE: 'overdue',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const TASK_STATUS_LABELS = {
  [TASK_STATUSES.PENDING]: 'Pending',
  [TASK_STATUSES.IN_PROGRESS]: 'In Progress',
  [TASK_STATUSES.OVERDUE]: 'Overdue',
  [TASK_STATUSES.COMPLETED]: 'Completed',
  [TASK_STATUSES.CANCELLED]: 'Cancelled',
}

export const TASK_STATUS_TONES = {
  [TASK_STATUSES.PENDING]: 'warning',
  [TASK_STATUSES.IN_PROGRESS]: 'info',
  [TASK_STATUSES.OVERDUE]: 'negative',
  [TASK_STATUSES.COMPLETED]: 'positive',
  [TASK_STATUSES.CANCELLED]: 'neutral',
}

export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.URGENT]: 'P1 Critical',
  [PRIORITY_LEVELS.HIGH]: 'P2 High',
  [PRIORITY_LEVELS.MEDIUM]: 'P3 Medium',
  [PRIORITY_LEVELS.LOW]: 'P4 Low',
}

export const PRIORITY_TONES = {
  [PRIORITY_LEVELS.URGENT]: 'negative',
  [PRIORITY_LEVELS.HIGH]: 'warning',
  [PRIORITY_LEVELS.MEDIUM]: 'info',
  [PRIORITY_LEVELS.LOW]: 'positive',
}

export const VIEW_MODES = {
  LIST: 'list',
  CALENDAR: 'calendar',
}

export const FILTER_PRESETS = {
  ALL: 'all',
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  OVERDUE: 'overdue',
  MY_TASKS: 'my_tasks',
}

export const FILTER_PRESET_LABELS = {
  [FILTER_PRESETS.ALL]: 'All tasks',
  [FILTER_PRESETS.TODAY]: 'Due today',
  [FILTER_PRESETS.THIS_WEEK]: 'Upcoming',
  [FILTER_PRESETS.OVERDUE]: 'Overdue',
  [FILTER_PRESETS.MY_TASKS]: 'My tasks',
}

export const DATE_RANGES = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  CUSTOM: 'custom',
}
