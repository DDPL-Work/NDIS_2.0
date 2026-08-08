import { makeRng, pickWeighted, randInt, randFloat } from '../../utils/random'
import { DEPARTMENTS, PROPOSAL_STATES } from '../../config/constants'
import { getFacilitiesBy } from './facilities'
import { getOfficerFor, getFieldEngineers } from './users'

// LLD Vol 3 §15.3 — Draft → Submitted → Under DM Review → Approved/Rejected →
// Budget Approved → Tasked → Assigned to Field → Inspection Scheduled →
// Inspection Complete → Completed → Citizen Feedback Open → Closed
const STATE_WEIGHTS = [
  ['submitted', 3], ['under_review', 4], ['approved', 3], ['rejected', 1.5],
  ['budget_approved', 3], ['tasked', 3], ['assigned_to_field', 3],
  ['inspection_scheduled', 2], ['inspection_complete', 2], ['completed', 4],
  ['citizen_feedback_open', 1.5], ['closed', 3],
]

const PROPOSAL_TITLES = {
  health: ['New Subcentre at {village}', 'Upgrade PHC to CHC — {village}', 'Ambulance deployment for {village} cluster', 'Oxygen supply augmentation — {village}'],
  water: ['New borewell — {village}', 'JJM last-mile connection — {village}', 'Overhead tank capacity upgrade — {village}', 'Water quality remediation — {village}'],
  education: ['New classroom block — {village}', 'Digital classroom rollout — {village}', 'Teacher deployment request — {village}', 'Anganwadi upgrade — {village}'],
  urban: ['Heritage buffer fencing — {village}', 'Visitor facilitation centre — {village}', 'Solid waste management plant — {village}'],
  electricity: ['Rooftop solar assessment — {village} govt building', 'Solar park feasibility — {village}', 'Grid connection for installed capacity — {village}'],
  pwd: ['Road resurfacing — {village}', 'Public building repair — {village}', 'Land parcel utilization plan — {village}'],
}

function guardConditionFor(state) {
  const map = {
    submitted: 'All mandatory proposal fields present',
    under_review: 'Auto-routed to DM/ADM review queue',
    approved: 'actor.role ∈ {ADM, DM} AND actor.district_id = proposal.district_id',
    rejected: 'Same as approval; remarks mandatory',
    budget_approved: 'approved_amount ≤ actor.approval_limit',
    tasked: 'Auto on budget confirmation',
    assigned_to_field: 'Department Officer nominates Field Engineer',
    inspection_scheduled: 'Field Engineer visit scheduled',
    inspection_complete: 'Geo-tagged photo evidence attached (variance < threshold)',
    completed: 'Auto; notifies linked grievance citizen if any',
    citizen_feedback_open: 'Auto on completion',
    closed: 'Citizen confirmation received or SLA elapsed',
  }
  return map[state] || '—'
}

let _cache = null

export function getAllProposals() {
  if (_cache) return _cache
  const proposals = []
  DEPARTMENTS.forEach((dept) => {
    const rng = makeRng(`proposals-${dept.id}`)
    const facilities = getFacilitiesBy({ districtId: 'nalanda', departmentId: dept.id })
    const officer = getOfficerFor(dept.id)
    const engineers = getFieldEngineers(dept.id)
    const count = 9
    for (let i = 0; i < count; i++) {
      const facility = facilities[randInt(rng, 0, facilities.length - 1)] || null
      const state = pickWeighted(rng, STATE_WEIGHTS)
      const titleTemplate = PROPOSAL_TITLES[dept.id][randInt(rng, 0, PROPOSAL_TITLES[dept.id].length - 1)]
      const village = facility ? facility.village : 'Rajgir'
      const amount = randInt(rng, 3, 850) * 100000
      const submittedDaysAgo = randInt(rng, 2, 160)
      const engineer = engineers[randInt(rng, 0, engineers.length - 1)]

      proposals.push({
        id: `PROP-${dept.id.toUpperCase()}-${1000 + i}`,
        departmentId: dept.id,
        title: titleTemplate.replace('{village}', village),
        state,
        stateLabel: guardConditionFor(state),
        districtId: 'nalanda',
        village,
        linkedFacilityId: facility?.id || null,
        requestedAmount: amount,
        approvedAmount: ['approved', 'budget_approved', 'tasked', 'assigned_to_field', 'inspection_scheduled', 'inspection_complete', 'completed', 'citizen_feedback_open', 'closed'].includes(state)
          ? Math.round(amount * randFloat(rng, 0.75, 1, 2))
          : null,
        submittedBy: officer?.name || 'Department Officer',
        assignedFieldEngineer: ['assigned_to_field', 'inspection_scheduled', 'inspection_complete', 'completed', 'citizen_feedback_open', 'closed'].includes(state) ? engineer?.name : null,
        submittedAt: new Date(Date.now() - submittedDaysAgo * 86400000).toISOString(),
        slaDueAt: new Date(Date.now() + randInt(rng, -5, 12) * 86400000).toISOString(),
        remarks: state === 'rejected' ? 'Insufficient population-coverage justification; resubmit with updated gap-score evidence.' : null,
        gapScoreRef: randFloat(rng, 0.3, 0.95, 2),
        history: buildHistory(rng, state, submittedDaysAgo),
      })
    }
  })
  _cache = proposals
  return proposals
}

function buildHistory(rng, finalState, submittedDaysAgo) {
  const order = ['draft', 'submitted', ...PROPOSAL_STATES.filter((s) => !['draft', 'submitted', 'rejected'].includes(s))]
  const finalIdx = finalState === 'rejected' ? 2 : order.indexOf(finalState)
  const steps = finalState === 'rejected' ? ['draft', 'submitted', 'under_review', 'rejected'] : order.slice(0, finalIdx + 1)
  let dayOffset = submittedDaysAgo
  return steps.map((state) => {
    dayOffset = Math.max(0, dayOffset - randInt(rng, 1, 6))
    return { state, at: new Date(Date.now() - dayOffset * 86400000).toISOString() }
  })
}

export function getProposalsBy({ departmentId, state, districtId } = {}) {
  let list = getAllProposals()
  if (departmentId) list = list.filter((p) => p.departmentId === departmentId)
  if (state) list = list.filter((p) => p.state === state)
  if (districtId) list = list.filter((p) => p.districtId === districtId)
  return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export function getProposalById(id) {
  return getAllProposals().find((p) => p.id === id) || null
}

// Directives: DM/ADM taskings issued to a department (a thin projection over
// tasked/completed proposals — LLD Vol 3 §15.5 workflow.transitioned events).
export function getDirectivesFor(departmentId) {
  return getProposalsBy({ departmentId }).filter((p) =>
    ['tasked', 'assigned_to_field', 'inspection_scheduled', 'inspection_complete', 'completed', 'citizen_feedback_open', 'closed'].includes(p.state)
  )
}
