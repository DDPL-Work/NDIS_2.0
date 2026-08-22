// Pure decision-dashboard derivation logic.
//
// Every value rendered on the DM/Collector decision dashboard is derived from
// backend-mapped collections (complaints, facilities, proposals, projects,
// budgets).  Nothing here fabricates data: when a collection is empty the
// selectors return empty arrays and the UI renders an honest empty state.
//
// Scoring model (transparent by design):
//  - facility gapScore: 50% (1 − same-category coverage) + 50% isolation,
//    computed client-side from the real spatial neighbourhood of
//    GET /api/facilities/ (facilityMapper.computeCoverageGaps).  The detail
//    panel surfaces this definition instead of pretending it is a backend fact.
//  - complaint pressure: weighted count of open complaints at a location using
//    priority, escalation and SLA-breach flags (all backend fields).
//  - planning pressure: proposal priority + population impact (backend fields).

export const GAP_CRITICAL = 0.66
export const GAP_EXTREME = 0.8

export const GAP_TIERS = {
  critical: { label: 'Critical', tone: 'alert' },
  high: { label: 'High', tone: 'saffron' },
  moderate: { label: 'Moderate', tone: 'sky' },
  low: { label: 'Low', tone: 'leaf' },
}

export function gapTier(score) {
  if (score >= GAP_EXTREME) return 'critical'
  if (score >= GAP_CRITICAL) return 'high'
  if (score >= 0.33) return 'moderate'
  return 'low'
}

const OPEN_STATES = new Set(['submitted', 'assigned', 'accepted', 'inspection_started', 'evidence_uploaded', 'verification_pending', 'resolved', 'reopened', 'transferred', 'escalated'])

export const isOpenComplaint = (complaint) => OPEN_STATES.has(String(complaint?.state || ''))

const PRIORITY_WEIGHT = { urgent: 1, high: 0.8, medium: 0.5, low: 0.2 }

const complaintWeight = (complaint) => {
  let weight = PRIORITY_WEIGHT[String(complaint.priority).toLowerCase()] ?? 0.5
  if (String(complaint.state) === 'escalated') weight += 0.4
  if (complaint.isSlaBreached) weight += 0.3
  return Math.min(1, weight)
}

const cap = (value) => Math.max(0, Math.min(1, Number(value) || 0))

const villageLabel = (complaint) => complaint.location?.village || complaint.location?.block || 'Unspecified location'

const firstPosition = (items) => {
  const point = items.map((item) => item.position || item.location?.position || null).find((item) => Array.isArray(item) && item.length >= 2)
  return point || null
}

const populationOf = (facility) => {
  const value = facility?.attributes?.population ?? facility?.attributes?.population_served ?? facility?.raw?.population
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

// ---------------------------------------------------------------------------
// Priority areas — the decision heart of the dashboard.  Each area answers:
// WHERE, HOW URGENT, WHY (score components), WHO (department), WHAT NEXT.
// ---------------------------------------------------------------------------
export function computePriorityAreas({ facilities = [], complaints = [], proposals = [] }) {
  const openComplaints = complaints.filter(isOpenComplaint)
  const areas = []
  const byVillage = new Map() // village(lower) -> area for merging evidence

  // 1. Critical facility gaps (gap heuristic) + hazard-flagged facilities.
  facilities
    .filter((facility) => Array.isArray(facility.position))
    .filter((facility) => facility.gapScore >= GAP_CRITICAL || facility.hazardSafe === false)
    .forEach((facility) => {
      const key = `${facility.village || facility.departmentName}::${facility.departmentId}`
      let area = byVillage.get(key)
      if (!area) {
        area = {
          id: `facility-${key}-${facility.id}`,
          type: 'facility_gap',
          title: facility.village || facility.name,
          village: facility.village || '',
          block: facility.raw?.block_name || facility.village || '',
          position: facility.position,
          priorityLevel: 'critical',
          score: facility.gapScore,
          scoreComponents: [
            { label: 'Gap score', value: facility.gapScore.toFixed(2), note: '50% (1 − coverage) + 50% isolation, client spatial heuristic' },
            { label: 'Hazard', value: facility.hazardSafe === false ? 'Flagged' : 'None', note: 'hazard_safe field from GET /api/facilities/' },
          ],
          affectedPopulation: populationOf(facility),
          departmentId: facility.departmentId,
          departmentName: facility.departmentName || facility.categoryLabel,
          recommendedAction: `Verify the ground status of the ${facility.categoryLabel.toLowerCase()} facility; dispatch a field inspection if the deficit is confirmed.`,
          facilityIds: [facility.id],
          complaintIds: [],
          proposalIds: [],
          source: 'gap-heuristic',
        }
        byVillage.set(key, area)
        areas.push(area)
      } else {
        area.facilityIds.push(facility.id)
        area.score = Math.max(area.score, facility.gapScore)
        if (facility.hazardSafe === false) {
          area.scoreComponents = [...area.scoreComponents.filter((c) => c.label !== 'Hazard'), { label: 'Hazard', value: 'Flagged', note: 'hazard_safe field from GET /api/facilities/' }]
        }
      }
    })

  // 2. Complaint hotspots — recurring citizen reports grouped by village.
  const groups = new Map()
  openComplaints.forEach((complaint) => {
    const village = villageLabel(complaint)
    const key = `${village}::${complaint.categoryName || 'complaint'}`
    const group = groups.get(key) || { village, category: complaint.categoryName || 'Complaint', complaints: [] }
    group.complaints.push(complaint)
    groups.set(key, group)
  })

  groups.forEach((group) => {
    if (group.complaints.length < 1) return
    const weight = Math.max(...group.complaints.map(complaintWeight))
    const escalated = group.complaints.filter((c) => String(c.state) === 'escalated').length
    const breached = group.complaints.filter((c) => c.isSlaBreached).length
    const highPriority = group.complaints.filter((c) => ['urgent', 'high'].includes(String(c.priority).toLowerCase())).length
    const score = cap(0.35 * weight + 0.35 * Math.min(1, group.complaints.length / 5) + 0.3 * (escalated ? 1 : breached ? 0.7 : 0))

    const key = `${group.village}::${group.complaints[0].departmentId || 'district'}`
    const existing = byVillage.get(key)
    if (existing) {
      existing.complaintIds.push(...group.complaints.map((c) => c.id))
      existing.score = Math.max(existing.score, score)
      existing.scoreComponents = [
        { label: 'Open complaints', value: existing.complaintIds.length, note: 'open complaints at this location' },
        { label: 'Escalated', value: escalated, note: 'workflow state = escalated' },
        { label: 'SLA breached', value: breached, note: 'is_sla_breached from backend' },
      ]
      if (group.category && !existing.title.includes(group.category)) existing.title = `${group.village} · ${group.category}`
      return
    }
    const area = {
      id: `hotspot-${key}-${group.village}-${group.category}`,
      type: 'complaint_hotspot',
      title: `${group.village} · ${group.category}`,
      village: group.village,
      block: group.complaints[0].location?.block || group.village,
      position: firstPosition(group.complaints),
      priorityLevel: score >= GAP_CRITICAL ? 'critical' : score >= 0.4 ? 'high' : 'medium',
      score,
      scoreComponents: [
        { label: 'Open complaints', value: group.complaints.length, note: 'open complaints at this location' },
        { label: 'Escalated', value: escalated, note: 'workflow state = escalated' },
        { label: 'SLA breached', value: breached, note: 'is_sla_breached from backend' },
        { label: 'High / urgent', value: highPriority, note: 'priority field from backend' },
      ],
      affectedPopulation: null,
      departmentId: group.complaints[0].departmentId,
      departmentName: group.complaints[0].departmentName || 'District',
      recommendedAction: `Review ${group.complaints.length} open complaint(s) at ${group.village}; direct the responsible department to respond within SLA.`,
      facilityIds: [],
      complaintIds: group.complaints.map((c) => c.id),
      proposalIds: [],
      source: 'citizen-complaints',
    }
    byVillage.set(key, area)
    areas.push(area)
  })

  // 3. Planning pressure — high-priority proposals that are stuck before the
  //    execution gate (draft / pending review / approved awaiting sanction).
  proposals
    .filter((proposal) => ['draft', 'pending_review', 'approved'].includes(String(proposal.status)))
    .filter((proposal) => ['urgent', 'high'].includes(String(proposal.priority).toLowerCase()))
    .forEach((proposal) => {
      const stageLabel = String(proposal.status).replace(/_/g, ' ')
      const area = {
        id: `planning-${proposal.proposalId}`,
        type: 'planning',
        title: proposal.title || proposal.village || proposal.block || 'Proposal',
        village: proposal.village || proposal.block || '',
        block: proposal.block || proposal.village || '',
        position: proposal.position || null,
        priorityLevel: String(proposal.priority).toLowerCase() === 'urgent' ? 'critical' : 'high',
        score: cap((String(proposal.priority).toLowerCase() === 'urgent' ? 0.9 : 0.75) + (proposal.populationImpact ? 0.05 : 0)),
        scoreComponents: [
          { label: 'Priority', value: String(proposal.priority).toUpperCase(), note: 'priority field from backend' },
          { label: 'Stage', value: stageLabel, note: 'proposal status from GET /api/proposals/' },
          { label: 'Population impact', value: proposal.populationImpact != null ? Number(proposal.populationImpact).toLocaleString('en-IN') : 'Not available', note: 'populationImpact field from backend' },
        ],
        affectedPopulation: proposal.populationImpact != null ? Number(proposal.populationImpact) : null,
        departmentId: proposal.departmentId,
        departmentName: proposal.departmentName || 'Department',
        recommendedAction: `Fast-track the ${stageLabel} decision for this intervention; approve or return with clear next steps.`,
        facilityIds: [],
        complaintIds: proposal.linkedComplaint ? [proposal.linkedComplaint] : [],
        proposalIds: [proposal.proposalId],
        source: 'planning-pipeline',
      }
      areas.push(area)
    })

  return areas
    .sort((a, b) => b.score - a.score)
    .map((area, index) => ({ rank: index + 1, ...area }))
}

// ---------------------------------------------------------------------------
// Planning pipeline (section F) — Priority → Intervention → DPR → Budget →
// Sanction → Execution → Monitoring.
// ---------------------------------------------------------------------------
export const PIPELINE_STAGES = [
  { key: 'priority', label: 'Priority', hint: 'Urgent / high interventions awaiting a DM decision' },
  { key: 'intervention', label: 'Intervention', hint: 'Complaint-linked interventions being shaped' },
  { key: 'dpr', label: 'DPR', hint: 'Technical DPR under preparation' },
  { key: 'budget', label: 'Budget', hint: 'Financial estimation & clearances under review' },
  { key: 'sanction', label: 'Sanction', hint: 'Approved — awaiting sanction order' },
  { key: 'execution', label: 'Execution', hint: 'Sanctioned — under execution' },
  { key: 'monitoring', label: 'Monitoring', hint: 'Completed — verification & monitoring' },
]

export function pipelineBuckets(proposals = []) {
  const list = Array.isArray(proposals) ? proposals : []
  const byKey = {
    priority: list.filter((p) => ['draft', 'pending_review', 'approved'].includes(String(p.status)) && ['urgent', 'high'].includes(String(p.priority).toLowerCase())),
    intervention: list.filter((p) => Boolean(p.linkedComplaint) && String(p.status) !== 'completed'),
    dpr: list.filter((p) => String(p.status) === 'draft'),
    budget: list.filter((p) => String(p.status) === 'pending_review'),
    sanction: list.filter((p) => String(p.status) === 'approved'),
    execution: list.filter((p) => ['sanctioned', 'in_execution'].includes(String(p.status))),
    monitoring: list.filter((p) => String(p.status) === 'completed'),
  }
  return PIPELINE_STAGES.map((stage) => ({ ...stage, count: byKey[stage.key].length, items: byKey[stage.key] }))
}

// ---------------------------------------------------------------------------
// Citizen signals (section E) — recurring location/service feedback.  Citizen
// reports are kept visually and semantically separate from administrative
// workflow facts (SLA/escalation) so perception is never confused with fact.
// ---------------------------------------------------------------------------
export function citizenSignals(complaints = []) {
  const open = complaints.filter(isOpenComplaint)
  const groups = new Map()
  open.forEach((complaint) => {
    const key = `${villageLabel(complaint)}|${complaint.categoryName || 'complaint'}`
    const group = groups.get(key) || { village: villageLabel(complaint), category: complaint.categoryName || 'Complaint', complaints: [] }
    group.complaints.push(complaint)
    groups.set(key, group)
  })

  const signals = [...groups.values()]
    .map((group) => ({
      village: group.village,
      category: group.category,
      count: group.complaints.length,
      complaintIds: group.complaints.map((c) => c.id),
      samples: group.complaints.slice(0, 3).map((c) => c.title),
      latestAt: group.complaints.reduce((latest, c) => (c.createdAt > latest ? c.createdAt : latest), group.complaints[0]?.createdAt || ''),
    }))
    .filter((signal) => signal.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const administrative = {
    slaBreached: open.filter((c) => c.isSlaBreached).length,
    escalated: open.filter((c) => String(c.state) === 'escalated').length,
  }

  return { signals, administrative }
}

// ---------------------------------------------------------------------------
// Action queue (section H) — items that require DM attention, most urgent
// first.  Every item carries a concrete recommended action and a navigation
// target handled by the dashboard (open detail modal / select on map).
// ---------------------------------------------------------------------------
export function buildActionQueue({ complaints = [], proposals = [], projectSummary = {} }) {
  const items = []
  complaints.filter((c) => String(c.state) === 'escalated').forEach((complaint) => {
    items.push({
      key: `escalated-${complaint.id}`,
      type: 'escalated_complaint',
      typeLabel: 'Escalated complaint',
      title: complaint.title,
      location: complaint.location?.village || complaint.location?.block || '',
      urgency: 'critical',
      recommendedAction: 'Acknowledge the escalation and direct the department officer to respond.',
      entity: complaint,
      complaintId: complaint.id,
    })
  })
  complaints.filter((c) => isOpenComplaint(c) && c.isSlaBreached).forEach((complaint) => {
    items.push({
      key: `sla-${complaint.id}`,
      type: 'sla_breach',
      typeLabel: 'SLA breach',
      title: complaint.title,
      location: complaint.location?.village || complaint.location?.block || '',
      urgency: 'high',
      recommendedAction: 'Escalate to the department head with the breach details and a response deadline.',
      entity: complaint,
      complaintId: complaint.id,
    })
  })
  proposals.filter((p) => String(p.status) === 'approved').forEach((proposal) => {
    items.push({
      key: `sanction-${proposal.proposalId}`,
      type: 'sanction_pending',
      typeLabel: 'Awaiting sanction',
      title: proposal.title,
      location: proposal.village || proposal.block || '',
      urgency: 'high',
      recommendedAction: 'Review the approved DPR and issue the sanction order.',
      entity: proposal,
      proposalId: proposal.proposalId,
    })
  })
  proposals.filter((p) => String(p.status) === 'pending_review').forEach((proposal) => {
    items.push({
      key: `review-${proposal.proposalId}`,
      type: 'pending_review',
      typeLabel: 'Proposal awaiting review',
      title: proposal.title,
      location: proposal.village || proposal.block || '',
      urgency: 'medium',
      recommendedAction: 'Review the financial estimation and clearances; approve or return.',
      entity: proposal,
      proposalId: proposal.proposalId,
    })
  })
  if (Number(projectSummary.inspectionDue) > 0) {
    items.push({
      key: 'inspection-due',
      type: 'inspection_due',
      typeLabel: 'Inspections due',
      title: `${projectSummary.inspectionDue} project(s) due for inspection`,
      location: '',
      urgency: 'medium',
      recommendedAction: 'Schedule the due inspections and verify physical progress on site.',
      entity: projectSummary,
    })
  }

  const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
  return items.sort((a, b) => (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9)).slice(0, 12)
}

// ---------------------------------------------------------------------------
// Critical KPI row (section A).  Every KPI declares its source endpoint and
// its exact calculation so the number is auditable, not decorative.
// ---------------------------------------------------------------------------
export function computeKpis({ facilities = [], complaints = [], proposals = [], projectSummary = {} }) {
  const open = complaints.filter(isOpenComplaint)
  const criticalGaps = facilities.filter((f) => f.gapScore >= GAP_CRITICAL).length
  const atRisk = facilities.filter((f) => f.hazardSafe === false || f.gapScore >= GAP_EXTREME).length
  const escalated = open.filter((c) => String(c.state) === 'escalated').length
  const slaBreached = open.filter((c) => c.isSlaBreached).length
  const pendingReview = proposals.filter((p) => String(p.status) === 'pending_review').length
  const awaitingSanction = proposals.filter((p) => String(p.status) === 'approved').length
  const projectsPending = Number(projectSummary.inspectionDue || 0) + pendingReview + awaitingSanction
  const highPriorityLocations = new Set(
    computePriorityAreas({ facilities, complaints, proposals })
      .filter((area) => ['critical', 'high'].includes(area.priorityLevel))
      .map((area) => area.village || area.title)
  ).size

  return {
    kpis: [
      {
        key: 'critical_gaps',
        label: 'Critical gaps',
        value: criticalGaps,
        sub: `${facilities.filter((f) => f.gapScore >= GAP_EXTREME).length} extreme (≥ ${Math.round(GAP_EXTREME * 100)}%)`,
        tone: 'alert',
        source: 'GET /api/facilities/',
        definition: `facilities with gapScore ≥ ${GAP_CRITICAL}; gapScore = 50% (1 − same-category coverage) + 50% isolation (client spatial heuristic)`,
      },
      {
        key: 'high_priority_locations',
        label: 'High-priority locations',
        value: highPriorityLocations,
        sub: `across facilities, complaints and planning`,
        tone: 'saffron',
        source: 'derived from facilities + complaints + proposals',
        definition: 'distinct villages with a critical/high priority area (facility gap, complaint hotspot or planning pressure)',
      },
      {
        key: 'facilities_at_risk',
        label: 'Facilities at risk',
        value: atRisk,
        sub: `${facilities.filter((f) => f.hazardSafe === false).length} hazard-flagged`,
        tone: 'alert',
        source: 'GET /api/facilities/',
        definition: `hazard_safe = false OR gapScore ≥ ${GAP_EXTREME}`,
      },
      {
        key: 'projects_pending_action',
        label: 'Projects pending action',
        value: projectsPending,
        sub: `${awaitingSanction} awaiting sanction · ${pendingReview} in review · ${Number(projectSummary.inspectionDue || 0)} inspections due`,
        tone: 'sky',
        source: 'GET /api/projects/summary/ + GET /api/proposals/',
        definition: 'inspection_due + proposals pending_review + proposals approved awaiting sanction',
      },
    ],
    openComplaints: open.length,
    escalated,
    slaBreached,
  }
}

// ---------------------------------------------------------------------------
// Health snapshot (section D) — rendered ONLY when the backend supplies the
// underlying telemetry.  With the health module in config-only mode there is
// no telemetry to show, so every metric reports an honest unavailable state.
// ---------------------------------------------------------------------------
export function healthSnapshot(facilities = []) {
  const health = facilities.filter((facility) => {
    const category = String(facility.categoryLabel || '').toLowerCase()
    const department = String(facility.departmentName || '').toLowerCase()
    return /health|hospital|primary health|sub.?centre|wellness/i.test(category) || /health|family welfare/i.test(department)
  })
  const telemetry = health.filter((facility) => {
    const attrs = facility.attributes || {}
    return attrs.bed_count != null || attrs.staff_count != null || attrs.medical_officer_count != null
  })
  const readiness = telemetry.length
    ? Math.round((telemetry.filter((f) => Number(f.attributes?.staff_count) > 0 && Number(f.attributes?.bed_count) > 0).length / telemetry.length) * 100)
    : null

  return {
    totalHealthFacilities: health.length,
    telemetryFacilities: telemetry.length,
    metrics: [
      {
        key: 'hr_gaps',
        label: 'HR gaps',
        status: 'unavailable',
        detail: 'No health staff telemetry endpoint is deployed yet.',
        source: '—',
      },
      {
        key: 'infrastructure_readiness',
        label: 'Infrastructure readiness',
        status: readiness === null ? 'unavailable' : 'available',
        detail: readiness === null
          ? 'No bed/staff counts returned for health facilities.'
          : `${readiness}% of health facilities report staff + beds available`,
        source: 'GET /api/facilities/ (attributes)',
      },
      {
        key: 'medicine_risk',
        label: 'Medicine supply risk',
        status: 'unavailable',
        detail: 'No medicine stock telemetry endpoint is deployed yet.',
        source: '—',
      },
      {
        key: 'vaccination',
        label: 'Vaccination coverage',
        status: 'unavailable',
        detail: 'No vaccination telemetry endpoint is deployed yet.',
        source: '—',
      },
      {
        key: 'high_risk_indicators',
        label: 'High-risk indicators',
        status: 'unavailable',
        detail: 'No epidemic / high-risk indicator telemetry endpoint is deployed yet.',
        source: '—',
      },
    ],
  }
}