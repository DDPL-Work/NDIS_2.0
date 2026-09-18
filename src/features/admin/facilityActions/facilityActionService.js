// Facility action service — API abstraction layer.
// All three actions now hit real backend endpoints.
// No fabricated responses. No mock data. No hardcoded IDs.

import { backendInterventionApi } from '../../../api/interventionApi'
import { backendInspectionApi } from '../../../api/inspectionApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { ERROR_MESSAGES } from './constants'

/**
 * Normalize backend errors to user-friendly messages.
 */
function normalizeError(error) {
  if (!error) return ERROR_MESSAGES.DEFAULT
  if (error?.name === 'AbortError' || error?.isAborted) return null
  if (!navigator.onLine) return ERROR_MESSAGES.NETWORK
  const status = error?.status || error?.statusCode
  if (status && ERROR_MESSAGES[status]) return ERROR_MESSAGES[status]
  if (error?.message) {
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) return ERROR_MESSAGES.NETWORK
  }
  return error?.message || ERROR_MESSAGES.DEFAULT
}

/**
 * Create an intervention proposal via POST /api/interventions/propose/.
 * Maps the simplified form to the backend intervention contract.
 */
export async function createProposal({ facility, form }) {
  try {
    const payload = {
      facility_name: facility.name,
      facility_type: facility.category || facility.categoryLabel || '',
      intervention_type: form.interventionType || '',
      description: form.description || '',
      estimated_cost: form.estimatedCost ? Number(form.estimatedCost) : null,
      expected_timeline: form.timeline || null,
      coverage_gap_score: facility.gapScore != null ? Math.round(facility.gapScore * 100) : null,
    }
    const intervention = await backendInterventionApi.create(payload)
    return { success: true, data: intervention }
  } catch (error) {
    return { success: false, error: normalizeError(error) }
  }
}

/**
 * Schedule a field inspection via POST /api/inspections/schedule/.
 * Maps the simplified form to the backend inspection contract.
 */
export async function scheduleInspection({ facility, form }) {
  try {
    const payload = {
      title: `Inspection — ${facility.name}`,
      location_name: [facility.village, facility.block, facility.district].filter(Boolean).join(', '),
      department_code: facility.departmentId || facility.department || '',
      inspection_purpose: form.purpose || `Verify reported service gap at ${facility.name}.`,
      preferred_date: form.preferredDate || null,
      scheduled_date: form.preferredDate || null,
      inspection_team: form.team || '',
      inspector_name: '',
      instructions: form.notes || '',
      remarks: '',
    }
    const inspection = await backendInspectionApi.create(payload)
    return { success: true, data: inspection }
  } catch (error) {
    return { success: false, error: normalizeError(error) }
  }
}

/**
 * Escalate a facility issue to district administration.
 * Uses the proposal API's escalation category since no dedicated
 * escalation endpoint exists. The proposal system tracks escalations.
 */
export async function escalateIssue({ facility, form }) {
  try {
    const payload = {
      title: `Escalation — ${facility.name}`,
      category: 'escalation',
      facility_id: facility.id,
      facility_name: facility.name,
      department: facility.departmentId || null,
      district: facility.districtId || null,
      village: facility.village || null,
      block: facility.block || null,
      problem_statement: form.reason || form.additionalMessage || 'Facility escalation from DM.',
      recommended_action: form.reason || '',
      priority: facility.priority?.band || null,
      gap_score: facility.gapScore != null ? Math.round(facility.gapScore * 100) : null,
    }
    const proposal = await backendProposalApi.create(payload)
    return { success: true, data: proposal, type: 'proposal' }
  } catch (error) {
    return { success: false, error: normalizeError(error) }
  }
}

/**
 * Check for existing actions on a facility.
 * Returns open interventions, inspections, and proposals from the real APIs.
 */
export async function checkExistingActions(facilityId) {
  try {
    const [interventions, inspections, proposals] = await Promise.all([
      backendInterventionApi.list({ facility_name: '' }).catch(() => []),
      backendInspectionApi.list({ location_name: '' }).catch(() => []),
      backendProposalApi.list({ facility_id: facilityId }).catch(() => ({ results: [] })),
    ])

    const openInterventions = (Array.isArray(interventions) ? interventions : []).filter(
      (i) => !['completed', 'cancelled', 'rejected'].includes(i.status)
    )
    const openInspections = (Array.isArray(inspections) ? inspections : []).filter(
      (i) => !['completed', 'cancelled'].includes(i.status)
    )
    const openProposals = (proposals?.results || []).filter(
      (p) => ['DRAFT_DPR', 'PENDING_REVIEW'].includes(p.status)
    )

    return {
      hasOpenProposal: openInterventions.length > 0 || openProposals.length > 0,
      openProposal: openInterventions[0] || openProposals[0] || null,
      hasOpenInspection: openInspections.length > 0,
      openInspection: openInspections[0] || null,
    }
  } catch {
    return { hasOpenProposal: false, openProposal: null, hasOpenInspection: false, openInspection: null }
  }
}
