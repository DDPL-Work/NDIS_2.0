// Facility action mapper Ã¢â‚¬â€ normalizes backend facility data into a stable
// frontend model. Handles missing fields gracefully. No fabricated values.

import { PRIORITY_BAND_LABELS } from './constants'
import { formatScorePercent } from '../../../utils/format'

/**
 * Map a raw facility object (from backend or department model) into the
 * normalized shape used by all action workflows.
 */
export function mapFacilityForAction(facility = {}, priority = null) {
  if (!facility) return null

  const band = priority?.band || facility.priority?.band || null
  const bandLabel = band ? (PRIORITY_BAND_LABELS[band] || band) : null
  const score = priority?.score ?? facility.priority?.score ?? facility.gapScore ?? null

  return {
    id: facility.id,
    name: facility.name || 'Unnamed facility',
    category: facility.categoryLabel || facility.category || facility.type || 'Facility',
    department: facility.departmentName || facility.department || null,
    departmentId: facility.departmentId || facility.department_id || null,
    district: facility.districtName || facility.district || null,
    districtId: facility.districtId || facility.district_id || null,
    village: facility.village || null,
    block: facility.block || facility.raw?.block_name || null,
    ward: facility.ward || null,
    latitude: facility.latitude || facility.position?.[1] || null,
    longitude: facility.longitude || facility.position?.[0] || null,
    position: facility.position || null,
    gapScore: facility.gapScore ?? null,
    priority: band ? { band, bandLabel, score } : null,
    hazardSafe: facility.hazardSafe,
    status: facility.status || null,
    recommendedAction: facility.recommendedAction || facility.attributes?.recommended_action || null,
    problemStatement: facility.problemStatement || facility.attributes?.problem_statement || null,
    reason: facility.reason || facility.attributes?.reason || null,
    indicators: facility.indicators || {},
    raw: facility.raw || facility.attributes || {},
  }
}

/**
 * Map a priority object from the department model.
 */
export function mapPriorityForAction(priority = {}) {
  if (!priority || !priority.band) return null
  return {
    band: priority.band,
    bandLabel: PRIORITY_BAND_LABELS[priority.band] || priority.bandLabel || priority.band,
    score: priority.score ?? null,
    components: priority.components || [],
    basis: priority.basis || null,
  }
}

/**
 * Build the default problem statement from available facility data.
 * Returns the best available text without fabricating anything.
 */
export function buildProblemStatement(facility) {
  if (!facility) return ''
  const parts = []
  if (facility.recommendedAction) parts.push(facility.recommendedAction)
  if (facility.problemStatement) parts.push(facility.problemStatement)
  if (facility.reason) parts.push(facility.reason)
  if (facility.gapScore != null && facility.gapScore >= 66) {
    parts.push(`High coverage gap score (${formatScorePercent(facility.gapScore, 0)}).`)
  }
  return parts.join(' ').trim()
}

/**
 * Build the default inspection purpose from available facility data.
 */
export function buildInspectionPurpose(facility) {
  if (!facility) return 'Verify reported service gap and facility condition.'
  const parts = ['Verify reported service gap and facility condition.']
  if (facility.recommendedAction) parts.push(`Recommended action: ${facility.recommendedAction}`)
  return parts.join(' ')
}

/**
 * Build the default escalation reason from available facility data.
 */
export function buildEscalationReason(facility) {
  if (!facility) return ''
  const parts = []
  if (facility.gapScore != null && facility.gapScore >= 66) {
    parts.push(`High operational deficit identified (gap score: ${formatScorePercent(facility.gapScore, 0)}).`)
  }
  if (facility.hazardSafe === false) {
    parts.push('Facility is at risk from environmental hazards.')
  }
  if (facility.recommendedAction) {
    parts.push(`Recommended action: ${facility.recommendedAction}`)
  }
  return parts.join(' ').trim()
}
