// Proposal DTO normalization — field inventory verified against the live
// GET /api/proposals/{id}/ response (backend_guide2.1 §6, backend_next_guide
// §6.3). The backend status value is preserved verbatim in `status`;
// presentation labels come from the backend's own status_display field.
// No status is invented on this side.
import { mapNegotiation } from './negotiationMapper'

const rows = (value) => (Array.isArray(value) ? value : value?.results || value?.data || [])

const amount = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function mapProposal(dto = {}) {
  return {
    id: dto.id,
    proposalId: dto.proposal_id || dto.proposalId || String(dto.id),
    title: dto.title || '',
    category: dto.category || '',
    status: dto.status || '',
    statusDisplay: dto.status_display || dto.status || '',
    stage: dto.stage || '',
    stageDisplay: dto.stage_display || dto.stage || '',
    priority: dto.priority || '',
    districtId: dto.district,
    districtName: dto.district_name || '',
    departmentId: dto.department,
    departmentName: dto.department_name || '',
    createdBy: dto.created_by,
    createdByName: dto.created_by_name || '',
    village: dto.village || '',
    block: dto.block || '',
    ward: dto.ward || '',
    populationImpact: amount(dto.population_impact),
    gapScore: amount(dto.gap_score),
    linkedComplaint: dto.linked_complaint || null,
    linkedComplaintIds: Array.isArray(dto.linked_complaint_ids) ? dto.linked_complaint_ids : [],
    problemStatement: dto.problem_statement || '',
    // Step 2 — survey & site inspection
    inspectionDate: dto.inspection_date || null,
    surveyTeam: dto.survey_team || '',
    inspectionNotes: dto.inspection_notes || '',
    gisReference: dto.gis_reference || '',
    latitude: dto.latitude,
    longitude: dto.longitude,
    // Step 3 — technical DPR
    technicalScope: dto.technical_scope || '',
    engineeringNotes: dto.engineering_notes || '',
    estimatedTimeline: dto.estimated_timeline || '',
    // Step 4 — financial estimation
    civilWorks: amount(dto.civil_works),
    equipmentCost: amount(dto.equipment_cost),
    electricalCost: amount(dto.electrical_cost),
    contingencyCost: amount(dto.contingency_cost),
    maintenanceCost: amount(dto.maintenance_cost),
    estimatedCost: amount(dto.estimated_cost),
    costFormatted: dto.cost_formatted || '',
    delegatedPowerNote: dto.delegated_power_note || '',
    fundingSource: dto.funding_source || '',
    // Step 5 — clearances
    clearancesNotes: dto.clearances_notes || '',
    clearances: dto.clearances || {},
    // Step 6 — attachments
    attachments: Array.isArray(dto.attachments) ? dto.attachments : [],
    // Review / decision trail
    reviewNotes: dto.review_notes || '',
    reviewedBy: dto.reviewed_by,
    reviewedByName: dto.reviewed_by_name || '',
    reviewedAt: dto.reviewed_at || null,
    approvedBy: dto.approved_by,
    approvedByName: dto.approved_by_name || '',
    approvedAt: dto.approved_at || null,
    // Negotiation module (backend_next_guide §6.3) — the backend embeds the
    // full multi-round trajectory plus the agreed terms on the proposal.
    // estimated_cost is never overwritten; agreed terms and approval_mode are
    // written by the backend's own state machine.
    negotiations: Array.isArray(dto.negotiations) ? dto.negotiations.map(mapNegotiation) : [],
    agreedAmount: amount(dto.agreed_amount),
    agreedTimelineDays: amount(dto.agreed_timeline_days),
    agreedScope: dto.agreed_scope || '',
    approvalMode: dto.approval_mode || '',
    isDeleted: Boolean(dto.is_deleted),
    createdAt: dto.created_at || null,
    updatedAt: dto.updated_at || null,
    raw: dto,
  }
}

export const mapProposalList = (response) => rows(response).map(mapProposal)
