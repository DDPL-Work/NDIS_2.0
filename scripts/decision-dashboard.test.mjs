import assert from 'node:assert/strict'
import {
  gapTier,
  GAP_CRITICAL,
  GAP_EXTREME,
  computePriorityAreas,
  pipelineBuckets,
  citizenSignals,
  buildActionQueue,
  computeKpis,
  healthSnapshot,
} from '../src/features/admin/decisionDashboard/priorityScoring.js'
import { dashboardConfigForRole, DEPARTMENT_ROLES, DASHBOARD_CONFIG } from '../src/features/admin/decisionDashboard/decisionDashboardConfig.js'

let passed = 0
const check = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`) }

const facility = (id, overrides = {}) => ({
  id: String(id),
  name: `Facility ${id}`,
  categoryLabel: overrides.categoryLabel || 'Health Facility',
  departmentId: overrides.departmentId || '1',
  departmentName: overrides.departmentName || 'Health Department',
  village: overrides.village || `Village ${id}`,
  position: overrides.position || [85 + id * 0.01, 25 + id * 0.01],
  gapScore: overrides.gapScore ?? 0,
  hazardSafe: overrides.hazardSafe ?? null,
  attributes: overrides.attributes || {},
  raw: overrides.raw || {},
  ...overrides,
})

const complaint = (id, overrides = {}) => ({
  id: String(id),
  ticketNumber: `CMP-${id}`,
  title: overrides.title || `Complaint ${id}`,
  categoryName: overrides.categoryName || 'Water',
  departmentId: overrides.departmentId || '1',
  departmentName: overrides.departmentName || 'Water Department',
  priority: overrides.priority || 'medium',
  state: overrides.state || 'submitted',
  isSlaBreached: Boolean(overrides.isSlaBreached),
  location: { village: overrides.village || 'V1', block: overrides.block || 'B1', position: overrides.position || null },
  createdAt: overrides.createdAt || '2026-01-01T00:00:00Z',
  ...overrides,
})

const proposal = (id, overrides = {}) => ({
  proposalId: String(id),
  title: overrides.title || `Proposal ${id}`,
  status: overrides.status || 'draft',
  statusDisplay: String(overrides.status || 'draft').replace(/_/g, ' '),
  priority: overrides.priority || 'medium',
  departmentId: overrides.departmentId || '1',
  departmentName: overrides.departmentName || 'PWD',
  village: overrides.village || 'V1',
  block: overrides.block || 'B1',
  estimatedCost: overrides.estimatedCost || 1000000,
  populationImpact: overrides.populationImpact ?? null,
  linkedComplaint: overrides.linkedComplaint || null,
  position: overrides.position || null,
  ...overrides,
})

// 1. gap tiers
check('gapTier tiers', () => {
  assert.equal(gapTier(0.9), 'critical')
  assert.equal(gapTier(0.7), 'high')
  assert.equal(gapTier(0.4), 'moderate')
  assert.equal(gapTier(0.1), 'low')
  assert.equal(GAP_CRITICAL, 0.66)
  assert.equal(GAP_EXTREME, 0.8)
})

// 2. priority areas
check('priority areas: facility gap', () => {
  const areas = computePriorityAreas({ facilities: [facility('f1', { gapScore: 0.9, departmentId: '1' })], complaints: [], proposals: [] })
  assert.equal(areas.length, 1)
  assert.equal(areas[0].type, 'facility_gap')
  assert.equal(areas[0].priorityLevel, 'critical')
  assert.equal(areas[0].score, 0.9)
  assert.ok(areas[0].recommendedAction.includes('facility'))
})

check('priority areas: complaint hotspot groups by village+category', () => {
  const areas = computePriorityAreas({
    facilities: [],
    complaints: [
      complaint('c1', { village: 'V1', categoryName: 'Water', priority: 'high' }),
      complaint('c2', { village: 'V1', categoryName: 'Water', priority: 'medium', state: 'escalated' }),
      complaint('c3', { village: 'V2', categoryName: 'Water', priority: 'low' }),
    ],
    proposals: [],
  })
  const hotspot = areas.find((a) => a.type === 'complaint_hotspot')
  assert.ok(hotspot)
  assert.equal(hotspot.complaintIds.length, 2)
  assert.ok(hotspot.scoreComponents.some((c) => c.label === 'Escalated' && c.value === 1))
})

check('priority areas: planning pressure from urgent proposal', () => {
  const areas = computePriorityAreas({
    facilities: [],
    complaints: [],
    proposals: [proposal('p1', { status: 'pending_review', priority: 'urgent', populationImpact: 25000 })],
  })
  const planning = areas.find((a) => a.type === 'planning')
  assert.ok(planning)
  assert.equal(planning.priorityLevel, 'critical')
  assert.equal(planning.affectedPopulation, 25000)
  assert.ok(planning.scoreComponents.some((c) => c.label === 'Priority' && c.value === 'URGENT'))
})

// 3. pipeline buckets
check('pipeline buckets by status', () => {
  const pipeline = pipelineBuckets([
    proposal('p1', { status: 'draft' }),
    proposal('p2', { status: 'draft', priority: 'high' }),
    proposal('p3', { status: 'pending_review', priority: 'high' }),
    proposal('p4', { status: 'approved' }),
    proposal('p5', { status: 'sanctioned' }),
    proposal('p6', { status: 'in_execution' }),
    proposal('p7', { status: 'completed' }),
    proposal('p8', { status: 'completed' }),
  ])
  const byKey = Object.fromEntries(pipeline.map((s) => [s.key, s.count]))
  assert.equal(byKey.priority, 2) // p2 (high draft) + p3 (high pending_review)
  assert.equal(byKey.dpr, 2)
  assert.equal(byKey.budget, 1)
  assert.equal(byKey.sanction, 1)
  assert.equal(byKey.execution, 2)
  assert.equal(byKey.monitoring, 2)
})

// 4. citizen signals separation
check('citizen signals separate perception from admin facts', () => {
  const { signals, administrative } = citizenSignals([
    complaint('c1', { village: 'V1', categoryName: 'Water' }),
    complaint('c2', { village: 'V1', categoryName: 'Water' }),
    complaint('c3', { village: 'V3', categoryName: 'Road', state: 'escalated', isSlaBreached: true }),
  ])
  assert.equal(signals.length, 2)
  const v1 = signals.find((s) => s.village === 'V1')
  assert.equal(v1.count, 2)
  assert.ok(v1.samples.length >= 1)
  assert.equal(administrative.escalated, 1)
  assert.equal(administrative.slaBreached, 1)
})

// 5. action queue ordering
check('action queue orders by urgency', () => {
  const queue = buildActionQueue({
    complaints: [
      complaint('c1', { state: 'submitted', isSlaBreached: true }),
      complaint('c2', { state: 'escalated' }),
    ],
    proposals: [proposal('p1', { status: 'approved' })],
    projectSummary: { inspectionDue: 2 },
  })
  assert.equal(queue[0].type, 'escalated_complaint')
  assert.ok(queue.some((i) => i.type === 'inspection_due'))
  assert.ok(queue.some((i) => i.type === 'sanction_pending'))
})

// 6. KPIs carry provenance
check('KPIs expose source + definition', () => {
  const result = computeKpis({
    facilities: [facility('f1', { gapScore: 0.9 }), facility('f2', { gapScore: 0.5 }), facility('f3', { gapScore: 0.7, hazardSafe: false })],
    complaints: [complaint('c1', { state: 'escalated' })],
    proposals: [proposal('p1', { status: 'pending_review' }), proposal('p2', { status: 'approved' })],
    projectSummary: { inspectionDue: 1 },
  })
  const kpis = Object.fromEntries(result.kpis.map((k) => [k.key, k]))
  assert.equal(kpis.critical_gaps.value, 2)
  assert.equal(kpis.facilities_at_risk.value, 2)
  assert.equal(kpis.projects_pending_action.value, 3)
  assert.ok(kpis.critical_gaps.definition.includes('gapScore'))
  assert.ok(kpis.projects_pending_action.source.includes('/api/projects/summary/'))
})

// 7. health snapshot honesty
check('health snapshot reports unavailable without telemetry', () => {
  const snap = healthSnapshot([facility('f1', { categoryLabel: 'Health Facility', attributes: {} })])
  assert.equal(snap.metrics.find((m) => m.key === 'hr_gaps').status, 'unavailable')
  assert.equal(snap.metrics.find((m) => m.key === 'infrastructure_readiness').status, 'unavailable')
})

check('health snapshot derives readiness from telemetry', () => {
  const snap = healthSnapshot([
    facility('f1', { categoryLabel: 'Health Facility', attributes: { staff_count: 5, bed_count: 20 } }),
    facility('f2', { categoryLabel: 'Health Facility', attributes: { staff_count: 0, bed_count: 0 } }),
    facility('f3', { categoryLabel: 'Health Facility', attributes: { bed_count: 10 } }),
  ])
  const readiness = snap.metrics.find((m) => m.key === 'infrastructure_readiness')
  assert.equal(readiness.status, 'available')
  assert.ok(readiness.detail.includes('33%')) // 1 of 3 reports staff + beds
})

// 8. role-aware config
check('role-aware dashboard config', () => {
  assert.equal(dashboardConfigForRole('dm').title, 'DM Decision Dashboard')
  assert.equal(dashboardConfigForRole('district_collector').title, 'Collector Decision Dashboard')
  assert.equal(dashboardConfigForRole('system_administrator').sections.join(','), 'kpis,actions')
  assert.ok(DEPARTMENT_ROLES.includes('department_head'))
  assert.ok(!DASHBOARD_CONFIG.department_head, 'department roles are NOT admin-dashboard keys — they resolve via the department registry')
})

console.log(`\n${passed} assertions passed`)