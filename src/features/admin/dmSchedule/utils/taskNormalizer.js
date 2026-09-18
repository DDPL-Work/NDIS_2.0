// Task normalizers — convert backend API responses into a unified frontend
// view model. Each source type has its own normalizer. buildScheduleTask()
// produces the final normalized task used by all schedule UI components.
//
// This is a VIEW MODEL only. The backend remains authoritative.

import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS } from '../constants'

// ---------------------------------------------------------------------------
// Status normalization — centralize all backend → frontend status mapping
// All maps use LOWERCASE keys. normalizeBackendStatus lowercases the input
// before lookup, so "PROPOSED", "proposed", "Proposed" all resolve correctly.
// ---------------------------------------------------------------------------

const PROPOSAL_STATUS_MAP = {
  draft_dpr: TASK_STATUSES.PENDING,
  pending_review: TASK_STATUSES.PENDING,
  under_negotiation: TASK_STATUSES.IN_PROGRESS,
  approved: TASK_STATUSES.IN_PROGRESS,
  sanctioned: TASK_STATUSES.IN_PROGRESS,
  in_execution: TASK_STATUSES.IN_PROGRESS,
  completed: TASK_STATUSES.COMPLETED,
  rejected: TASK_STATUSES.CANCELLED,
  proposed: TASK_STATUSES.PENDING,
}

const INTERVENTION_STATUS_MAP = {
  draft: TASK_STATUSES.PENDING,
  proposed: TASK_STATUSES.PENDING,
  pending_review: TASK_STATUSES.PENDING,
  under_review: TASK_STATUSES.PENDING,
  under_revision: TASK_STATUSES.PENDING,
  approved: TASK_STATUSES.IN_PROGRESS,
  in_progress: TASK_STATUSES.IN_PROGRESS,
  completed: TASK_STATUSES.COMPLETED,
  rejected: TASK_STATUSES.CANCELLED,
  cancelled: TASK_STATUSES.CANCELLED,
}

const INSPECTION_STATUS_MAP = {
  scheduled: TASK_STATUSES.PENDING,
  postponed: TASK_STATUSES.PENDING,
  pending: TASK_STATUSES.PENDING,
  in_progress: TASK_STATUSES.IN_PROGRESS,
  completed: TASK_STATUSES.COMPLETED,
  cancelled: TASK_STATUSES.CANCELLED,
}

const COMPLAINT_STATUS_MAP = {
  submitted: TASK_STATUSES.PENDING,
  assigned: TASK_STATUSES.PENDING,
  accepted: TASK_STATUSES.PENDING,
  inspection_scheduled: TASK_STATUSES.PENDING,
  inspection_completed: TASK_STATUSES.IN_PROGRESS,
  work_started: TASK_STATUSES.IN_PROGRESS,
  work_completed: TASK_STATUSES.IN_PROGRESS,
  verification_pending: TASK_STATUSES.IN_PROGRESS,
  citizen_verified: TASK_STATUSES.COMPLETED,
  resolved: TASK_STATUSES.COMPLETED,
  citizen_confirmation: TASK_STATUSES.IN_PROGRESS,
  closed: TASK_STATUSES.COMPLETED,
  rejected: TASK_STATUSES.CANCELLED,
  cancelled: TASK_STATUSES.CANCELLED,
  escalated: TASK_STATUSES.IN_PROGRESS,
  reopened: TASK_STATUSES.IN_PROGRESS,
}

function normalizeBackendStatus(rawStatus, type) {
  if (!rawStatus) return TASK_STATUSES.PENDING
  const lower = String(rawStatus).toLowerCase()
  const map = {
    [TASK_TYPES.PROPOSAL]: PROPOSAL_STATUS_MAP,
    [TASK_TYPES.INTERVENTION]: INTERVENTION_STATUS_MAP,
    [TASK_TYPES.INSPECTION]: INSPECTION_STATUS_MAP,
    [TASK_TYPES.ESCALATION]: COMPLAINT_STATUS_MAP,
  }[type] || {}
  return map[lower] || map[rawStatus] || TASK_STATUSES.PENDING
}

// ---------------------------------------------------------------------------
// Status display — human-readable labels for backend statuses
// ---------------------------------------------------------------------------

const STATUS_DISPLAY_MAP = {
  draft_dpr: 'Draft DPR',
  pending_review: 'Under Review',
  under_negotiation: 'Under Negotiation',
  approved: 'Approved',
  sanctioned: 'Sanctioned',
  in_execution: 'In Execution',
  completed: 'Completed',
  rejected: 'Rejected',
  draft: 'Draft',
  proposed: 'Proposed',
  under_review: 'Under Review',
  under_revision: 'Under Revision',
  in_progress: 'In Progress',
  cancelled: 'Cancelled',
  scheduled: 'Scheduled',
  postponed: 'Postponed',
  pending: 'Pending',
  escalated: 'Escalated',
}

export function getStatusDisplay(rawStatus) {
  if (!rawStatus) return ''
  const lower = String(rawStatus).toLowerCase()
  return STATUS_DISPLAY_MAP[lower] || rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).replace(/_/g, ' ')
}

// ---------------------------------------------------------------------------
// Priority normalization
// ---------------------------------------------------------------------------

const PRIORITY_MAP = {
  urgent: PRIORITY_LEVELS.URGENT,
  high: PRIORITY_LEVELS.HIGH,
  medium: PRIORITY_LEVELS.MEDIUM,
  low: PRIORITY_LEVELS.LOW,
  p1: PRIORITY_LEVELS.URGENT,
  p2: PRIORITY_LEVELS.HIGH,
  p3: PRIORITY_LEVELS.MEDIUM,
  p4: PRIORITY_LEVELS.LOW,
}

export function normalizePriority(value) {
  if (!value) return PRIORITY_LEVELS.MEDIUM
  const lower = String(value).toLowerCase()
  return PRIORITY_MAP[lower] || PRIORITY_LEVELS.MEDIUM
}

// ---------------------------------------------------------------------------
// Overdue detection
// ---------------------------------------------------------------------------

export function isOverdue(dueDate, status) {
  if (!dueDate) return false
  if (status === TASK_STATUSES.COMPLETED || status === TASK_STATUSES.CANCELLED) return false
  return new Date(dueDate) < new Date()
}

// ---------------------------------------------------------------------------
// Individual normalizers
// ---------------------------------------------------------------------------

export function normalizeIntervention(dto) {
  if (!dto) return null
  const rawStatus = dto.status || ''
  return {
    id: dto.id,
    taskId: `intervention:${dto.id}`,
    type: TASK_TYPES.INTERVENTION,
    sourceId: String(dto.id),
    title: dto.title || `${dto.intervention_type || 'Intervention'} — ${dto.facility_name || dto.facilityName || ''}`,
    description: dto.description || '',
    facilityName: dto.facility_name || dto.facilityName || '',
    facilityType: dto.facility_type || dto.facilityType || '',
    departmentName: dto.department_name || dto.departmentName || '',
    departmentCode: dto.department_code || dto.departmentCode || '',
    department: dto.department_name || dto.department_code || dto.departmentName || dto.departmentCode || '',
    districtName: dto.district_name || dto.districtName || '',
    district: dto.district_name || dto.districtName || '',
    blockName: dto.block_name || dto.blockName || '',
    block: dto.block_name || dto.blockName || '',
    location: dto.location_name || dto.locationName || '',
    locationName: dto.location_name || dto.locationName || '',
    priority: normalizePriority(dto.priority_level || dto.priorityLevel),
    priorityLabel: dto.priority_level || dto.priorityLevel || 'P3',
    status: normalizeBackendStatus(rawStatus, TASK_TYPES.INTERVENTION),
    statusDisplay: getStatusDisplay(rawStatus),
    rawStatus,
    estimatedCost: dto.estimated_cost ?? dto.estimatedCost ?? null,
    expectedTimeline: dto.expected_timeline || '',
    coverageGapScore: dto.coverage_gap_score ?? dto.coverageGapScore ?? null,
    interventionType: dto.intervention_type || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    dueDate: null,
    tags: [dto.intervention_type, dto.facility_type].filter(Boolean),
    sourceType: 'intervention',
    raw: dto,
  }
}

export function normalizeInspection(dto) {
  if (!dto) return null
  const rawStatus = dto.status || ''
  return {
    id: dto.id,
    taskId: `inspection:${dto.id}`,
    type: TASK_TYPES.INSPECTION,
    sourceId: String(dto.id),
    title: dto.title || dto.inspection_purpose || dto.purpose || `Inspection ${dto.id}`,
    description: dto.instructions || dto.remarks || dto.inspection_purpose || dto.purpose || '',
    facilityName: dto.facility_name || dto.facilityName || dto.location_name || '',
    facilityType: dto.facility_type || dto.facilityType || '',
    departmentName: dto.department_name || dto.departmentName || '',
    departmentCode: dto.department_code || dto.departmentCode || '',
    department: dto.department_name || dto.department_code || dto.departmentName || dto.departmentCode || '',
    districtName: dto.district_name || dto.districtName || '',
    district: dto.district_name || dto.districtName || '',
    blockName: dto.block_name || dto.blockName || '',
    block: dto.block_name || dto.blockName || '',
    location: dto.location_name || dto.locationName || dto.facility_name || '',
    locationName: dto.location_name || dto.locationName || '',
    priority: normalizePriority(dto.priority_level || dto.priorityLevel),
    priorityLabel: dto.priority_level || dto.priorityLevel || 'P3',
    status: normalizeBackendStatus(rawStatus, TASK_TYPES.INSPECTION),
    statusDisplay: getStatusDisplay(rawStatus),
    rawStatus,
    estimatedCost: null,
    expectedTimeline: '',
    coverageGapScore: dto.coverage_gap_score ?? dto.coverageGapScore ?? null,
    interventionType: '',
    preferredDate: dto.preferred_date || null,
    scheduledDate: dto.scheduled_date || null,
    scheduledTime: dto.scheduled_time || null,
    inspectionTeam: dto.inspection_team || '',
    inspectorName: dto.inspector_name || dto.inspectorName || '',
    inspectorDesignation: dto.inspector_designation || dto.inspectorDesignation || '',
    instructions: dto.instructions || '',
    purpose: dto.inspection_purpose || dto.purpose || '',
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    dueDate: dto.preferred_date || dto.scheduled_date || null,
    tags: ['inspection', rawStatus].filter(Boolean),
    sourceType: 'inspection',
    raw: dto,
  }
}

export function normalizeEscalation(complaint) {
  if (!complaint) return null
  const rawStatus = complaint.status || ''
  return {
    id: complaint.id,
    taskId: `escalation:${complaint.id}`,
    type: TASK_TYPES.ESCALATION,
    sourceId: String(complaint.id),
    title: complaint.title || complaint.subject || `Complaint ${complaint.complaintId || complaint.id}`,
    description: complaint.description || complaint.narrative || '',
    facilityName: complaint.facilityName || '',
    facilityType: '',
    departmentName: complaint.departmentName || '',
    departmentCode: complaint.departmentCode || '',
    department: complaint.departmentName || complaint.departmentId || '',
    districtName: complaint.districtName || '',
    district: complaint.districtName || complaint.districtId || '',
    blockName: complaint.blockName || '',
    block: complaint.blockName || complaint.blockId || '',
    location: '',
    locationName: '',
    priority: normalizePriority(complaint.priority || complaint.priorityLevel),
    priorityLabel: complaint.priority || complaint.priorityLevel || 'P3',
    status: normalizeBackendStatus(rawStatus, TASK_TYPES.ESCALATION),
    statusDisplay: getStatusDisplay(rawStatus) || 'Escalated',
    rawStatus,
    estimatedCost: null,
    expectedTimeline: '',
    coverageGapScore: null,
    interventionType: '',
    createdAt: complaint.createdAt || complaint.submittedAt || null,
    updatedAt: complaint.updatedAt || null,
    dueDate: complaint.slaDeadline || complaint.dueDate || null,
    tags: [complaint.categoryName, rawStatus].filter(Boolean),
    sourceType: 'escalation',
    complaintId: complaint.complaintId || complaint.id,
    raw: complaint,
  }
}

// ---------------------------------------------------------------------------
// Build schedule task — combines all normalizers into unified task
// ---------------------------------------------------------------------------

export function buildScheduleTask({ interventions = [], inspections = [], escalations = [] }) {
  const tasks = [
    ...interventions.map(normalizeIntervention),
    ...inspections.map(normalizeInspection),
    ...escalations.map(normalizeEscalation),
  ].filter(Boolean)

  return tasks.map((t) => ({
    ...t,
    isOverdue: isOverdue(t.dueDate, t.status),
    taskIdentity: `${t.sourceType}:${t.sourceId}`,
  }))
}

// ---------------------------------------------------------------------------
// KPI computation
// ---------------------------------------------------------------------------

export function computeKpis(tasks) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const total = tasks.length
  const pending = tasks.filter((t) => t.status === TASK_STATUSES.PENDING).length
  const inProgress = tasks.filter((t) => t.status === TASK_STATUSES.IN_PROGRESS).length
  const overdue = tasks.filter((t) => t.isOverdue).length
  const completed = tasks.filter((t) => t.status === TASK_STATUSES.COMPLETED).length
  const today = tasks.filter(
    (t) => t.dueDate && t.dueDate.split('T')[0] === todayStr && t.status !== TASK_STATUSES.COMPLETED
  ).length
  const upcoming = tasks.filter(
    (t) =>
      t.dueDate &&
      t.dueDate.split('T')[0] > todayStr &&
      t.dueDate.split('T')[0] <= weekEnd &&
      t.status !== TASK_STATUSES.COMPLETED
  ).length
  const needsAttention = tasks.filter(
    (t) => t.isOverdue || t.priority === PRIORITY_LEVELS.URGENT || t.priority === PRIORITY_LEVELS.HIGH
  ).length

  return { total, pending, inProgress, overdue, completed, today, upcoming, needsAttention }
}
