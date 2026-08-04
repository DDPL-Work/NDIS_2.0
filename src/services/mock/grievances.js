import { makeRng, pickWeighted, randInt } from '../../utils/random'
import { DEPARTMENTS } from '../../config/constants'
import { getFacilitiesBy } from './facilities'

// LLD Vol 3 §15.2 — Citizen Complaint Workflow:
// submitted → assigned → in_progress → resolved → closed, with `escalated`
// as a side-state re-entrant to `assigned` on SLA breach (default 14 days).
const ISSUE_TEMPLATES = {
  health: ['Non-functional oxygen supply', 'ASHA worker unavailable', 'Ambulance delayed response', 'Vaccine stock unavailable'],
  water: ['Borewell not functioning', 'Contaminated water supply', 'Pipeline leakage', 'No JJM connection despite sanction'],
  education: ['Damaged classroom roof', 'No digital classroom despite listing', 'Teacher shortage', 'Anganwadi closed for weeks'],
  tourism: ['Unmaintained heritage site approach road', 'Encroachment near heritage buffer', 'No signage at visitor facility'],
  solar: ['Installed panels non-functional', 'Grid connection pending for months', 'Subsidy application not processed'],
  district_assets: ['Pothole cluster on village road', 'Public building in disrepair', 'Encroachment on public land'],
}

const STATE_WEIGHTS = [['submitted', 3], ['assigned', 3], ['in_progress', 4], ['escalated', 1], ['resolved', 3], ['closed', 4]]

const REPORTER_NAMES = ['Ramesh Yadav', 'Sunita Devi', 'Md. Iqbal', 'Kavita Kumari', 'Suresh Paswan', 'Anita Devi', 'Birendra Prasad', 'Fatima Khatoon']

let _cache = null

export function getAllGrievances() {
  if (_cache) return _cache
  const list = []
  DEPARTMENTS.forEach((dept) => {
    const rng = makeRng(`grievances-${dept.id}`)
    const facilities = getFacilitiesBy({ districtId: 'nalanda', departmentId: dept.id })
    const templates = ISSUE_TEMPLATES[dept.id]
    const count = 10
    for (let i = 0; i < count; i++) {
      const facility = facilities[randInt(rng, 0, facilities.length - 1)]
      const state = pickWeighted(rng, STATE_WEIGHTS)
      const daysAgo = randInt(rng, 1, 60)
      list.push({
        id: `GRV-${dept.id.toUpperCase()}-${2000 + i}`,
        departmentId: dept.id,
        title: templates[randInt(rng, 0, templates.length - 1)],
        description: 'Reported via Citizen Portal with geo-tagged photo evidence attached at the facility location.',
        state,
        linkedFacilityId: facility?.id || null,
        facilityName: facility?.name || 'Unnamed asset',
        village: facility?.village || '—',
        reporterName: REPORTER_NAMES[randInt(rng, 0, REPORTER_NAMES.length - 1)],
        reporterMasked: true,
        submittedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        slaDueAt: new Date(Date.now() - daysAgo * 86400000 + 14 * 86400000).toISOString(),
        hasPhoto: rng() > 0.3,
        trackingCode: `NDISP-${dept.id.slice(0, 2).toUpperCase()}${100000 + i}`,
      })
    }
  })
  _cache = list
  return list
}

export function getGrievancesBy({ departmentId, state } = {}) {
  let list = getAllGrievances()
  if (departmentId) list = list.filter((g) => g.departmentId === departmentId)
  if (state) list = list.filter((g) => g.state === state)
  return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
}

export function findGrievanceByTrackingCode(code) {
  return getAllGrievances().find((g) => g.trackingCode.toLowerCase() === code.trim().toLowerCase()) || null
}
