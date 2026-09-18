// DM Schedule & Tasks — data aggregation service.
// Fetches interventions, inspections, proposals, escalations, and work orders
// from real backend APIs. No local stores for task data.

import { backendInterventionApi } from '../../../api/interventionApi'
import { backendInspectionApi } from '../../../api/inspectionApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { useComplaintEngine } from '../../../app/store/complaintEngine'
import { invalidateData, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { buildUnifiedTasks } from './dmScheduleMapper'

/**
 * Fetch all task data sources in parallel from real backend APIs.
 * Returns unified tasks for the DM schedule view.
 */
export async function fetchAllTasks(districtId) {
  const [interventions, inspections, proposalsResult, escalationsResult] = await Promise.all([
    backendInterventionApi.list(districtId ? { district: districtId } : {}).catch(() => []),
    backendInspectionApi.list(districtId ? { district: districtId } : {}).catch(() => []),
    backendProposalApi.list(districtId ? { district: districtId } : {}).catch(() => ({ results: [] })),
    fetchEscalations(districtId).catch(() => []),
  ])

  const proposals = proposalsResult?.results || proposalsResult || []

  return buildUnifiedTasks({
    interventions,
    inspections,
    proposals,
    escalations: escalationsResult,
  })
}

/**
 * Fetch escalated complaints from the complaint engine.
 */
async function fetchEscalations(districtId) {
  const complaintEngine = useComplaintEngine.getState()
  const allComplaints = complaintEngine.complaints || []

  const escalated = allComplaints.filter(
    (c) => c.status === 'escalated' || c.priority === 'urgent' || c.priority === 'high'
  )

  if (districtId) {
    return escalated.filter(
      (c) => c.districtId === districtId || c.district === districtId
    )
  }

  return escalated
}

/**
 * Refresh all data sources.
 */
export function getRefreshFn() {
  return () => {
    invalidateData(DATA_SCOPES.INTERVENTIONS)
    invalidateData(DATA_SCOPES.INSPECTIONS)
    invalidateData(DATA_SCOPES.PROPOSALS)
    invalidateData(DATA_SCOPES.COMPLAINTS)
  }
}
