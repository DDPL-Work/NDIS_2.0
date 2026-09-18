// DM Schedule & Tasks — mapper layer.
// Normalizes proposals, inspections, escalations, and work orders into a
// unified task model. Enriches with human-readable labels and due-date intelligence.

import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS, TASK_TYPE_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS } from './constants.js'

const PROPOSAL_STATUS_TO_TASK_STATUS = {
  DRAFT_DPR: TASK_STATUSES.PENDING,
  PENDING_REVIEW: TASK_STATUSES.PENDING,
  UNDER_NEGOTIATION: TASK_STATUSES.IN_PROGRESS,
  APPROVED: TASK_STATUSES.IN_PROGRESS,
  SANCTIONED: TASK_STATUSES.IN_PROGRESS,
  IN_EXECUTION: TASK_STATUSES.IN_PROGRESS,
  COMPLETED: TASK_STATUSES.COMPLETED,
  REJECTED: TASK_STATUSES.CANCELLED,
}

const PROPOSAL_PRIORITY_MAP = {
  urgent: PRIORITY_LEVELS.URGENT,
  high: PRIORITY_LEVELS.HIGH,
  medium: PRIORITY_LEVELS.MEDIUM,
  low: PRIORITY_LEVELS.LOW,
  P1: PRIORITY_LEVELS.URGENT,
  P2: PRIORITY_LEVELS.HIGH,
  P3: PRIORITY_LEVELS.MEDIUM,
  P4: PRIORITY_LEVELS.LOW,
}

const INSPECTION_STATUS_TO_TASK_STATUS = {
  scheduled: TASK_STATUSES.PENDING,
  postponed: TASK_STATUSES.PENDING,
  in_progress: TASK_STATUSES.IN_PROGRESS,
  completed: TASK_STATUSES.COMPLETED,
  cancelled: TASK_STATUSES.CANCELLED,
}

const INTERVENTION_STATUS_TO_TASK_STATUS = {
  draft: TASK_STATUSES.PENDING,
  pending_review: TASK_STATUSES.PENDING,
  under_review: TASK_STATUSES.PENDING,
  approved: TASK_STATUSES.IN_PROGRESS,
  in_progress: TASK_STATUSES.IN_PROGRESS,
  completed: TASK_STATUSES.COMPLETED,
  rejected: TASK_STATUSES.CANCELLED,
  cancelled: TASK_STATUSES.CANCELLED,
}

function normalizePriority(value) {
  if (!value) return PRIORITY_LEVELS.MEDIUM
  const lower = String(value).toLowerCase()
  return PROPOSAL_PRIORITY_MAP[lower] || PROPOSAL_PRIORITY_MAP[value] || PRIORITY_LEVELS.MEDIUM
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === TASK_STATUSES.COMPLETED || status === TASK_STATUSES.CANCELLED) return false
  return new Date(dueDate) < new Date()
}

/**
 * Compute a human-readable due-date label.
 * Returns objects like "Today", "Tomorrow", "Overdue by 2 days", "5 Sep 2026".
 */
export function computeDueDateLabel(dueDate) {
  if (!dueDate) return { label: '', urgency: 'none' }
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return { label: dueDate, urgency: 'none' }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffMs = targetStart.getTime() - todayStart.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  if (diffDays < 0) {
    const abs = Math.abs(diffDays)
    return {
      label: `Overdue by ${abs} day${abs > 1 ? 's' : ''}`,
      urgency: 'overdue',
    }
  }
  if (diffDays === 0) {
    return { label: `Today · ${timeStr}`, urgency: 'today' }
  }
  if (diffDays === 1) {
    return { label: `Tomorrow · ${timeStr}`, urgency: 'tomorrow' }
  }
  if (diffDays <= 7) {
    return { label: `In ${diffDays} days · ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, urgency: 'soon' }
  }
  return {
    label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    urgency: 'future',
  }
}

/**
 * Enrich a raw task with computed labels.
 */
function enrichTask(task) {
  const dueDateInfo = computeDueDateLabel(task.dueDate)
  return {
    ...task,
    typeLabel: TASK_TYPE_LABELS[task.type] || task.type,
    statusLabel: TASK_STATUS_LABELS[task.status] || task.status,
    priorityLabel: PRIORITY_LABELS[task.priority] || task.priority,
    dueDateLabel: dueDateInfo.label,
    dueDateUrgency: dueDateInfo.urgency,
  }
}

/**
 * Map a backend proposal to a unified task.
 */
export function mapProposalToTask(proposal) {
  const rawStatus = proposal.status || ''
  let taskStatus = PROPOSAL_STATUS_TO_TASK_STATUS[rawStatus] || TASK_STATUSES.PENDING
  const priority = normalizePriority(proposal.priority)

  return {
    id: `task-proposal-${proposal.id}`,
    type: TASK_TYPES.PROPOSAL,
    title: proposal.title || `Proposal ${proposal.proposalId || proposal.id}`,
    description: proposal.problemStatement || proposal.recommendedAction || '',
    status: taskStatus,
    statusLabel: proposal.statusDisplay || TASK_STATUS_LABELS[taskStatus] || rawStatus,
    priority,
    facilityId: proposal.facilityId || null,
    facilityName: proposal.facilityName || '',
    departmentId: proposal.departmentId || null,
    departmentName: proposal.departmentName || '',
    districtId: proposal.districtId || null,
    districtName: proposal.districtName || '',
    dueDate: proposal.sanctionDate || proposal.targetDate || null,
    createdAt: proposal.createdAt || null,
    assignee: proposal.createdByName || '',
    sourceId: String(proposal.id),
    sourceUrl: `/admin/approvals`,
    tags: [proposal.category, proposal.stage].filter(Boolean),
    estimatedCost: proposal.estimatedCost || proposal.grandTotal || null,
    village: proposal.village || '',
    block: proposal.block || '',
    reason: proposal.problemStatement || '',
    gapScore: proposal.gapScore || proposal.score || null,
  }
}

/**
 * Map a backend intervention proposal to a unified task.
 * Uses the /api/interventions/propose/ backend shape.
 */
export function mapInterventionToTask(intervention) {
  const rawStatus = intervention.status || ''
  let taskStatus = INTERVENTION_STATUS_TO_TASK_STATUS[rawStatus] || TASK_STATUSES.PENDING

  return {
    id: `task-intervention-${intervention.id}`,
    type: TASK_TYPES.INTERVENTION,
    title: `${intervention.interventionType || 'Intervention'} — ${intervention.facilityName || intervention.facility_name || ''}`,
    description: intervention.description || '',
    status: taskStatus,
    statusLabel: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/_/g, ' '),
    priority: normalizePriority(intervention.priorityLevel || intervention.priority_level),
    facilityId: intervention.facilityId || null,
    facilityName: intervention.facilityName || intervention.facility_name || '',
    departmentId: intervention.departmentId || null,
    departmentName: intervention.departmentName || '',
    districtId: intervention.districtId || null,
    districtName: intervention.districtName || '',
    dueDate: intervention.expectedTimeline || intervention.expected_timeline || null,
    createdAt: intervention.createdAt || intervention.created_at || null,
    assignee: '',
    sourceId: String(intervention.id),
    sourceUrl: `/admin/schedule-tasks`,
    tags: [intervention.interventionType, intervention.facilityType].filter(Boolean),
    estimatedCost: intervention.estimatedCost || intervention.estimated_cost || null,
    village: '',
    block: '',
    reason: intervention.description || '',
    gapScore: intervention.coverageGapScore || intervention.coverage_gap_score || null,
  }
}

/**
 * Map a backend inspection to a unified task.
 * Uses the /api/inspections/schedule/ backend shape.
 */
export function mapInspectionToTask(inspection) {
  const rawStatus = inspection.status || 'scheduled'
  let taskStatus = INSPECTION_STATUS_TO_TASK_STATUS[rawStatus] || TASK_STATUSES.PENDING

  return {
    id: `task-inspection-${inspection.id}`,
    type: TASK_TYPES.INSPECTION,
    title: inspection.title || inspection.inspectionPurpose || `Inspection ${inspection.id}`,
    description: inspection.instructions || inspection.remarks || inspection.inspectionPurpose || '',
    status: taskStatus,
    statusLabel: TASK_STATUS_LABELS[taskStatus] || rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/_/g, ' '),
    priority: normalizePriority(inspection.priority),
    facilityId: inspection.facilityId || null,
    facilityName: inspection.locationName || inspection.location_name || inspection.facilityName || '',
    departmentId: inspection.departmentCode || inspection.department_code || inspection.department || null,
    departmentName: inspection.departmentName || '',
    districtId: inspection.districtId || null,
    districtName: inspection.districtName || '',
    dueDate: inspection.preferredDate || inspection.preferred_date || inspection.scheduledDate || inspection.scheduled_date || null,
    createdAt: inspection.createdAt || inspection.created_at || null,
    assignee: inspection.inspectorName || inspection.inspector_name || inspection.inspectionTeam || inspection.inspection_team || '',
    sourceId: String(inspection.id),
    sourceUrl: null,
    tags: ['inspection', rawStatus].filter(Boolean),
    estimatedCost: null,
    village: '',
    block: '',
    reason: inspection.inspectionPurpose || inspection.inspection_purpose || '',
    gapScore: null,
  }
}

/**
 * Map an escalated complaint to a unified task.
 */
export function mapEscalationToTask(complaint) {
  const rawStatus = complaint.status
  const taskStatus = rawStatus === 'resolved' || rawStatus === 'closed'
    ? TASK_STATUSES.COMPLETED
    : rawStatus === 'escalated'
      ? TASK_STATUSES.IN_PROGRESS
      : TASK_STATUSES.PENDING

  return {
    id: `task-escalation-${complaint.id}`,
    type: TASK_TYPES.ESCALATION,
    title: complaint.title || complaint.subject || `Escalation ${complaint.complaintId || complaint.id}`,
    description: complaint.description || complaint.narrative || '',
    status: taskStatus,
    statusLabel: complaint.statusDisplay || TASK_STATUS_LABELS[taskStatus] || 'Escalated',
    priority: normalizePriority(complaint.priority),
    facilityId: complaint.facilityId || null,
    facilityName: complaint.facilityName || '',
    departmentId: complaint.departmentId || null,
    departmentName: complaint.departmentName || '',
    districtId: complaint.districtId || null,
    districtName: complaint.districtName || '',
    dueDate: complaint.slaDeadline || complaint.dueDate || null,
    createdAt: complaint.createdAt || complaint.submittedAt || null,
    assignee: complaint.assignedToName || complaint.assignedDepartment || '',
    sourceId: String(complaint.id),
    sourceUrl: `/admin/complaints-oversight`,
    tags: [complaint.categoryName, complaint.status].filter(Boolean),
    estimatedCost: null,
    village: complaint.village || '',
    block: complaint.block || '',
    reason: complaint.categoryName || complaint.narrative || '',
    gapScore: null,
  }
}

/**
 * Map a work order to a unified task.
 */
export function mapWorkOrderToTask(workOrder) {
  const rawStatus = workOrder.state || workOrder.status || 'assigned'
  const statusMap = {
    assigned: TASK_STATUSES.PENDING,
    in_progress: TASK_STATUSES.IN_PROGRESS,
    completed: TASK_STATUSES.COMPLETED,
    suspended: TASK_STATUSES.CANCELLED,
  }
  const taskStatus = statusMap[rawStatus] || TASK_STATUSES.PENDING

  return {
    id: `task-workorder-${workOrder.id}`,
    type: TASK_TYPES.WORK_ORDER,
    title: workOrder.title || workOrder.description || `Work Order ${workOrder.id}`,
    description: workOrder.remarks || '',
    status: taskStatus,
    statusLabel: TASK_STATUS_LABELS[taskStatus] || rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace('_', ' '),
    priority: normalizePriority(workOrder.priority),
    facilityId: workOrder.assetId || null,
    facilityName: workOrder.assetName || '',
    departmentId: workOrder.departmentId || null,
    departmentName: workOrder.departmentName || '',
    districtId: workOrder.districtId || null,
    districtName: workOrder.districtName || '',
    dueDate: workOrder.deadline || workOrder.scheduleWork || null,
    createdAt: workOrder.createdAt || null,
    assignee: workOrder.assignedTo || workOrder.contractorId || '',
    sourceId: String(workOrder.id),
    sourceUrl: null,
    tags: ['work_order', rawStatus].filter(Boolean),
    estimatedCost: workOrder.estimatedCost || null,
    village: workOrder.village || '',
    block: workOrder.block || '',
    reason: workOrder.description || '',
    gapScore: null,
  }
}

/**
 * Build unified tasks from all data sources.
 * Accepts real backend API responses.
 */
export function buildUnifiedTasks({ interventions = [], inspections = [], proposals = [], escalations = [] }) {
  const tasks = [
    ...interventions.map(mapInterventionToTask),
    ...inspections.map(mapInspectionToTask),
    ...proposals.map(mapProposalToTask),
    ...escalations.map(mapEscalationToTask),
  ]

  return tasks
    .map((task) => ({
      ...task,
      status: isOverdue(task.dueDate, task.status) ? TASK_STATUSES.OVERDUE : task.status,
    }))
    .map(enrichTask)
}

/**
 * Compute KPI summary from unified tasks.
 */
export function computeTaskKpis(tasks) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const total = tasks.length
  const pending = tasks.filter((t) => t.status === TASK_STATUSES.PENDING).length
  const inProgress = tasks.filter((t) => t.status === TASK_STATUSES.IN_PROGRESS).length
  const overdue = tasks.filter((t) => t.status === TASK_STATUSES.OVERDUE).length
  const completed = tasks.filter((t) => t.status === TASK_STATUSES.COMPLETED).length
  const today = tasks.filter((t) => t.dueDate && t.dueDate.split('T')[0] === todayStr && t.status !== TASK_STATUSES.COMPLETED).length
  const upcoming = tasks.filter((t) => t.dueDate && t.dueDate.split('T')[0] > todayStr && t.dueDate.split('T')[0] <= weekEnd && t.status !== TASK_STATUSES.COMPLETED).length

  const byType = {
    [TASK_TYPES.INTERVENTION]: tasks.filter((t) => t.type === TASK_TYPES.INTERVENTION).length,
    [TASK_TYPES.PROPOSAL]: tasks.filter((t) => t.type === TASK_TYPES.PROPOSAL).length,
    [TASK_TYPES.INSPECTION]: tasks.filter((t) => t.type === TASK_TYPES.INSPECTION).length,
    [TASK_TYPES.ESCALATION]: tasks.filter((t) => t.type === TASK_TYPES.ESCALATION).length,
    [TASK_TYPES.WORK_ORDER]: tasks.filter((t) => t.type === TASK_TYPES.WORK_ORDER).length,
  }

  const byPriority = {
    [PRIORITY_LEVELS.URGENT]: tasks.filter((t) => t.priority === PRIORITY_LEVELS.URGENT).length,
    [PRIORITY_LEVELS.HIGH]: tasks.filter((t) => t.priority === PRIORITY_LEVELS.HIGH).length,
    [PRIORITY_LEVELS.MEDIUM]: tasks.filter((t) => t.priority === PRIORITY_LEVELS.MEDIUM).length,
    [PRIORITY_LEVELS.LOW]: tasks.filter((t) => t.priority === PRIORITY_LEVELS.LOW).length,
  }

  return { total, pending, inProgress, overdue, completed, today, upcoming, byType, byPriority }
}

/**
 * Group tasks for the DM executive view.
 */
export function groupTasksForDmView(tasks) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const attention = tasks.filter(
    (t) =>
      t.status === TASK_STATUSES.OVERDUE ||
      t.priority === PRIORITY_LEVELS.URGENT ||
      t.priority === PRIORITY_LEVELS.HIGH ||
      (t.dueDate && t.dueDate.split('T')[0] <= todayStr && t.status !== TASK_STATUSES.COMPLETED)
  )

  const todayTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate.split('T')[0] === todayStr && t.status !== TASK_STATUSES.COMPLETED
  )

  const tomorrow = tasks.filter(
    (t) => t.dueDate && t.dueDate.split('T')[0] === tomorrowStr && t.status !== TASK_STATUSES.COMPLETED
  )

  const thisWeek = tasks.filter(
    (t) => t.dueDate && t.dueDate.split('T')[0] > tomorrowStr && t.dueDate.split('T')[0] <= weekEnd && t.status !== TASK_STATUSES.COMPLETED
  )

  const later = tasks.filter(
    (t) => t.dueDate && t.dueDate.split('T')[0] > weekEnd && t.status !== TASK_STATUSES.COMPLETED
  )

  const noDate = tasks.filter((t) => !t.dueDate && t.status !== TASK_STATUSES.COMPLETED)

  return { attention, todayTasks, tomorrow, thisWeek, later, noDate }
}
