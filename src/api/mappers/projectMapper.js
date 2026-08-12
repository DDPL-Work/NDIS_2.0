// Project DTO normalization verified against the live GET /api/projects/{id}/
// response and serializer metadata (OPTIONS /projects/) during Phase 2.1.
// The live serializer vocabulary (project_id, title, proposal, proposal_id_str,
// proposed_amount, sanction_amount, expenditure_amount, sanction_order_no,
// progress_percentage, contract) is the source of truth; the legacy aliases
// below are retained defensively for older backend payloads.
const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

const numberOr = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback
  // The live backend may prefix amounts with the ₹ symbol (e.g. "₹10.00")
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapProject(dto = {}) {
  const sanctioned = numberOr(dto.sanction_amount ?? dto.budget_sanctioned ?? dto.budgetSanctioned ?? dto.sanctioned_amount ?? dto.sanctionedAmount)
  return {
    id: dto.id,
    projectId: dto.project_id || dto.project_code || String(dto.id),
    // Numeric relationship used for the proposal -> project linkage check.
    proposalId: dto.proposal ?? dto.proposal_id ?? null,
    // Human-readable proposal reference issued by the backend (PRP-…).
    proposalIdStr: dto.proposal_id_str || '',
    title: dto.title || dto.name || '',
    status: dto.status || '',
    statusDisplay: dto.status_display || dto.status || '',
    stage: dto.stage || '',
    priority: dto.priority || '',
    risk: dto.risk_level || dto.risk || '',
    progress: numberOr(dto.progress_percentage ?? dto.progress ?? dto.progress_pct ?? dto.physical_progress),
    budgetSanctioned: sanctioned,
    budgetUtilized: numberOr(dto.expenditure_amount ?? dto.budget_utilized ?? dto.budgetUtilized ?? dto.expenditure),
    sanctionedAmount: sanctioned,
    sanctionOrder: dto.sanction_order_no || dto.sanction_order || dto.sanctionOrder || dto.sanction_number || '',
    departmentId: dto.department,
    departmentName: dto.department_name || dto.departmentName || '',
    districtId: dto.district,
    districtName: dto.district_name || dto.districtName || '',
    village: dto.village || '',
    block: dto.block || '',
    contractor: dto.contractor_name || dto.contractor || '',
    startDate: dto.start_date || dto.startDate || null,
    completionDate: dto.actual_completion_date || dto.target_completion_date || dto.completion_date || dto.completionDate || null,
    createdAt: dto.created_at || null,
    raw: dto,
  }
}

export const mapProjectList = (response) => rows(response).map(mapProject)

export function mapProjectSummary(dto = {}) {
  return {
    runningProjects: numberOr(dto.running_projects),
    completed: numberOr(dto.completed),
    inspectionDue: numberOr(dto.inspection_due),
    budgetUtilized: numberOr(dto.budget_utilized),
    billAmount: numberOr(dto.bill_amount),
    totalBillAmount: numberOr(dto.total_bill_amount),
    netPayableAmount: numberOr(dto.net_payable_amount),
    totalNetPayable: numberOr(dto.total_net_payable),
    completedProjects: rows(dto.completed_projects).map(mapProject),
    runningProjectsList: rows(dto.running_projects_list).map(mapProject),
    inspectionDueProjects: rows(dto.inspection_due_projects).map(mapProject),
    allProjects: rows(dto.all_projects).map(mapProject),
    raw: dto,
  }
}
