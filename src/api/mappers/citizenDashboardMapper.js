// Dashboard DTO normalization — every dashboard endpoint (citizen,
// my-dashboard, department, officer, field-inspector, district,
// district-collector, dm, adm) returns a summary envelope whose field names
// vary by deployment.  All numbers are coerced defensively; nothing is
// invented on this side — fields the backend did not send stay null/0 so the
// UI renders EMPTY/ERROR states honestly.
const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const mapComplaintSummary = (dto = {}) => ({
  total: number(dto.total ?? dto.total_complaints),
  open: number(dto.open ?? dto.open_complaints),
  assigned: number(dto.assigned ?? dto.assigned_complaints),
  accepted: number(dto.accepted ?? dto.accepted_complaints),
  underInspection: number(dto.under_inspection ?? dto.inspection_started),
  evidenceUploaded: number(dto.evidence_uploaded ?? dto.evidence_uploaded_complaints),
  resolved: number(dto.resolved ?? dto.resolved_complaints),
  pendingVerification: number(dto.pending_verification ?? dto.citizen_verification_pending),
  closed: number(dto.closed ?? dto.closed_complaints),
  reopened: number(dto.reopened ?? dto.reopened_complaints),
  transferred: number(dto.transferred ?? dto.transferred_complaints),
  escalated: number(dto.escalated ?? dto.escalated_complaints),
  rejected: number(dto.rejected ?? dto.rejected_complaints),
  withinSla: number(dto.within_sla ?? dto.sla_met),
  slaBreached: number(dto.sla_breached ?? dto.sla_violated),
})

const mapKpi = (dto = {}) => ({
  total: number(dto.total ?? dto.total_count ?? dto.count),
  pending: number(dto.pending ?? dto.pending_count),
  inProgress: number(dto.in_progress ?? dto.in_progress_count),
  completed: number(dto.completed ?? dto.completed_count),
  dueToday: number(dto.due_today ?? dto.today ?? dto.todays_count),
  overdue: number(dto.overdue ?? dto.overdue_count),
  escalated: number(dto.escalated ?? dto.escalated_count),
  highPriority: number(dto.high_priority ?? dto.high_priority_count),
  withinSla: number(dto.within_sla ?? dto.sla_met),
  slaBreached: number(dto.sla_breached ?? dto.sla_violated),
})

const mapStatusBreakdown = (dto = {}) => {
  const source = Array.isArray(dto) ? dto : dto.status_breakdown || dto.by_status || []
  return rows(source).map((item) => ({
    status: String(item.status || ''),
    count: number(item.count),
    label: item.label || item.status_display || String(item.status || ''),
  }))
}

const mapPriorityBreakdown = (dto = {}) => {
  const source = Array.isArray(dto) ? dto : dto.priority_breakdown || dto.by_priority || []
  return rows(source).map((item) => ({
    priority: String(item.priority || ''),
    count: number(item.count),
  }))
}

const mapDepartmentBreakdown = (dto = {}) => {
  const source = Array.isArray(dto) ? dto : dto.department_breakdown || dto.by_department || []
  return rows(source).map((item) => ({
    department: String(item.department || item.department_name || ''),
    departmentId: item.department_id ?? item.department,
    count: number(item.count),
  }))
}

const mapRecentActivity = (dto = {}) => {
  const source = Array.isArray(dto) ? dto : dto.recent_activity || dto.latest_activity || []
  return rows(source).map((item) => ({
    id: item.id,
    action: String(item.action || item.activity_type || ''),
    label: String(item.label || item.title || item.action || ''),
    entityType: String(item.entity_type || ''),
    entityId: item.entity_id ?? item.entity,
    message: String(item.message || ''),
    occurredAt: item.occurred_at || item.created_at || item.timestamp || null,
    actorName: String(item.actor_name || item.actor || ''),
  }))
}

const mapGrievanceBrief = (dto = {}) => ({
  averageResponseTime: dto.average_response_time ?? dto.avg_response_time ?? null,
  satisfactionScore: dto.satisfaction_score ?? dto.csat ?? null,
  satisfactionRating: number(dto.satisfaction_rating),
  feedbackCount: number(dto.feedback_count),
})

// Envelope normalization.  The `kpis`/`complaints` keys are picked from the
// many shapes dashboards arrive in; anything unrecognized is left untouched
// inside `raw` so callers can still reach original fields.
export function mapDashboard(dto = {}) {
  const summary = dto.summary || dto.stats || dto.kpis || dto.overview || {}
  return {
    kpis: mapKpi(summary),
    complaints: mapComplaintSummary(summary),
    statusBreakdown: mapStatusBreakdown(summary),
    priorityBreakdown: mapPriorityBreakdown(summary),
    departmentBreakdown: mapDepartmentBreakdown(summary),
    recentActivity: mapRecentActivity(dto),
    brief: mapGrievanceBrief(summary),
    queue: rows(dto.queue || summary.queue || []).map((item) => ({
      id: item.id,
      complaintId: item.complaint_id || item.id,
      title: String(item.title || item.subject || ''),
      category: String(item.category || ''),
      priority: String(item.priority || ''),
      status: String(item.status || ''),
      assignedTo: String(item.assigned_to || item.assigned_to_name || ''),
      slaBreached: Boolean(item.sla_breached ?? item.is_sla_breached),
      dueAt: item.due_at || item.sla_due_at || null,
      updatedAt: item.updated_at || null,
      raw: item,
    })),
    district: {
      id: dto.district_id ?? dto.district,
      name: String(dto.district_name || dto.district || ''),
    },
    department: {
      id: dto.department_id ?? dto.department,
      name: String(dto.department_name || dto.department || ''),
    },
    role: String(dto.role || ''),
    generatedAt: dto.generated_at || dto.generatedAt || null,
    raw: dto,
  }
}

export const mapDashboardList = (response) => rows(response).map(mapDashboard)
