import { apiRequest } from './apiClient'
import { mapProposalList } from './mappers/proposalMapper'

// GET /api/planning/dashboard/ (backend_guide2.1 §6.1). The backend supplies
// the KPI counts, suggested development needs and the active DPR repository —
// nothing is derived from frontend collections.
export const backendPlanningApi = {
  async dashboard() {
    const dto = await apiRequest('/planning/dashboard/')
    const kpi = dto?.kpi_summary || {}
    return {
      status: dto?.status || '',
      kpiSummary: {
        developmentNeeds: Number(kpi.development_needs ?? 0),
        draftDpr: Number(kpi.draft_dpr ?? 0),
        pendingReview: Number(kpi.pending_review ?? 0),
        approved: Number(kpi.approved ?? 0),
        totalProposals: Number(kpi.total_proposals ?? 0),
      },
      suggestedDevelopmentNeeds: Array.isArray(dto?.suggested_development_needs) ? dto.suggested_development_needs : [],
      dprRepository: mapProposalList(dto?.dpr_repository),
      raw: dto,
    }
  },
}
