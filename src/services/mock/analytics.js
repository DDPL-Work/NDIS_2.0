import { makeRng, randInt, randFloat, pickWeighted } from '../../utils/random'
import { DEPARTMENTS } from '../../config/constants'
import { getFacilitiesBy } from './facilities'

// LLD Vol 3 §17.1 Deficit Detection Engine — per-department gap score summary,
// aggregated here at district level (production computes per grid cell, §17.1 step 3).
export function getDepartmentKpis(districtId = 'nalanda') {
  return DEPARTMENTS.map((dept) => {
    const rng = makeRng(`kpi-${districtId}-${dept.id}`)
    const facilities = getFacilitiesBy({ districtId, departmentId: dept.id })
    const avgGap = facilities.length ? facilities.reduce((s, f) => s + f.gapScore, 0) / facilities.length : 0
    const coveragePct = Math.round((1 - avgGap) * 100)
    return {
      departmentId: dept.id,
      facilityCount: facilities.length,
      avgGapScore: Number(avgGap.toFixed(2)),
      coveragePct,
      geoTaggedPct: randInt(rng, 88, 99),
      openProposals: randInt(rng, 2, 9),
      openGrievances: randInt(rng, 1, 8),
      budgetUtilizedPct: randInt(rng, 38, 92),
      trend: buildTrend(rng, coveragePct),
    }
  })
}

function buildTrend(rng, base) {
  const points = []
  let v = Math.max(20, base - randInt(rng, 8, 18))
  for (let i = 0; i < 6; i++) {
    v = Math.min(99, Math.max(15, v + randInt(rng, -2, 6)))
    points.push({ month: MONTHS[i], value: v })
  }
  return points
}

const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

export function getDistrictSummary(districtId = 'nalanda') {
  const rng = makeRng(`district-summary-${districtId}`)
  const facilities = getFacilitiesBy({ districtId })
  const avgGap = facilities.reduce((s, f) => s + f.gapScore, 0) / (facilities.length || 1)
  return {
    districtId,
    totalFacilities: facilities.length,
    geoTaggedPct: randInt(rng, 90, 98),
    avgGapScore: Number(avgGap.toFixed(2)),
    approvalCycleDays: randInt(rng, 4, 9),
    grievanceClosureSlaPct: randInt(rng, 65, 88),
    uptime: 99.6,
  }
}

// LLD Vol 3 §17.4 — Hotspot Detection (kernel density over grievance/outbreak points)
export function getHotspots(districtId = 'nalanda') {
  const rng = makeRng(`hotspots-${districtId}`)
  const facilities = getFacilitiesBy({ districtId })
  const byVillage = new Map()
  facilities.forEach((f) => {
    if (!byVillage.has(f.village)) byVillage.set(f.village, { village: f.village, position: f.position, score: 0, count: 0 })
    const entry = byVillage.get(f.village)
    entry.score += f.gapScore
    entry.count += 1
  })
  return Array.from(byVillage.values())
    .map((v) => ({ ...v, intensity: Number((v.score / v.count).toFixed(2)) }))
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 8)
}

const RECOMMENDATION_TEMPLATES = {
  health: (village) => `Recommend new Health Subcentre near ${village} — population-coverage gap exceeds 3km service radius.`,
  water: (village) => `Recommend recharge structure (percolation tank) near ${village} — groundwater stress + rainfall deficit overlay.`,
  education: (village) => `Recommend school-catchment expansion near ${village} — settlements beyond acceptable travel distance.`,
  urban: (village) => `Recommend visitor facility upgrade near ${village} — footfall density exceeds current facility adequacy ratio.`,
  electricity: (village) => `Recommend rooftop solar assessment for government buildings near ${village} — high irradiance, low shadow interference.`,
  pwd: (village) => `Recommend road resurfacing priority near ${village} — condition rating and population served both flag high priority.`,
}

// LLD Vol 3 §17.5 — rules-based MCDA ranking; every recommendation carries a
// confidence score and a linked evidence set (anl_recommendation.confidence, §12.5)
export function getRecommendations(districtId = 'nalanda') {
  const rng = makeRng(`recommendations-${districtId}`)
  const hotspots = getHotspots(districtId)
  return hotspots.slice(0, 6).map((h, i) => {
    const dept = DEPARTMENTS[randInt(rng, 0, DEPARTMENTS.length - 1)]
    return {
      id: `REC-${districtId.toUpperCase()}-${100 + i}`,
      departmentId: dept.id,
      title: RECOMMENDATION_TEMPLATES[dept.id](h.village),
      confidence: randFloat(rng, 0.62, 0.94, 2),
      priority: pickWeighted(rng, [['high', 2], ['medium', 3], ['low', 1]]),
      village: h.village,
      position: h.position,
      evidence: [
        `Composite gap score ${h.intensity.toFixed(2)} (population density × facility-coverage deficit)`,
        'Terrain accessibility: slope-adjusted travel time above district median',
        `${randInt(rng, 2, 5)} linked proposals in this catchment over the last 12 months`,
      ],
      estimatedCost: randInt(rng, 8, 220) * 100000,
      generatedAt: new Date(Date.now() - randInt(rng, 1, 5) * 86400000).toISOString(),
    }
  })
}

export function getBudgetUtilization(districtId = 'nalanda') {
  const rng = makeRng(`budget-${districtId}`)
  return DEPARTMENTS.map((d) => ({
    departmentId: d.id,
    sanctioned: randInt(rng, 200, 900) * 100000,
    utilized: randInt(rng, 80, 700) * 100000,
  }))
}

// Monthly budget-spend utilization % per department — used by Analytics page
const TIMELINE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
export function getBudgetTimeline(districtId = 'nalanda') {
  const rng = makeRng(`budget-timeline-${districtId}`)
  return TIMELINE_MONTHS.map((month) => {
    const row = { month }
    DEPARTMENTS.forEach((d) => { row[d.id] = randInt(rng, 20, 95) })
    return row
  })
}
