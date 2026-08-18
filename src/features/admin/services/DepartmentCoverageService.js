// Executive department coverage aggregation for /admin/departments-overview.
//
// Data sources (backend_guide2.0.md):
//   - GET /api/departments/                 department master rows
//   - GET /api/facilities/?department={id}  real facility collection per
//                                           department (same call SituationMatrix
//                                           already makes; counts + the shared
//                                           facilityMapper gap scores are reused)
//   - GET /api/department/{id}/complain/    complaint rollup (totals, per-status
//                                           summary, rows) for open counts/trend
//   - GET /api/projects/?department={id}     department project registry
//   - GET /api/proposals/?department={id}    department proposal registry
//
// Uptime/p95 telemetry has no backend endpoint; the UI renders an unavailable
// state instead of making up numbers (see components).

// Backend UPPERCASE statuses that end the complaint lifecycle. "Open" is the
// complement — every status NOT listed here is an in-flight grievance. This
// mirrors the citizen dashboard's "active" definition and the department queue
// KPIs (DepartmentOfficerQueue stats.pending + stats.inProgress).
export const TERMINAL_STATUSES = ['CLOSED', 'RESOLVED', 'REJECTED', 'CANCELLED', 'DRAFT']

// Centralised department look (icon + accent). Backend master data has no
// visuals; known Nalanda sectors map by name, the hash fallback guarantees a
// deterministic colour for anything new (same idea as departmentApi.colorFor).
export const DEPARTMENT_VISUAL_CONFIG = [
  { match: /urban|local body|sanitation/i, icon: 'Landmark', color: '#8a4fc0' },
  { match: /water|jj|wr\b/i, icon: 'Droplets', color: '#1d7ab5' },
  { match: /health|family welfare/i, icon: 'HeartPulse', color: '#c0392b' },
  { match: /education|school/i, icon: 'GraduationCap', color: '#1f7a54' },
  { match: /solar|renewable|energy/i, icon: 'Sun', color: '#d35400' },
  { match: /forest|environment|forest/i, icon: 'TreePine', color: '#2e7d32' },
  { match: /public works|pwd|road|transport/i, icon: 'Building2', color: '#546882' },
  { match: /revenue/i, icon: 'HandCoins', color: '#b7950b' },
  { match: /general administration|admin/i, icon: 'Shield', color: '#34495e' },
  { match: /district administration/i, icon: 'ShieldCheck', color: '#3a7ca5' },
]

export function visualForDepartment(name = '', fallbackColor = '#546882') {
  const entry = DEPARTMENT_VISUAL_CONFIG.find((item) => item.match.test(name))
  if (entry) return entry
  let hash = 0
  for (const char of name) hash = ((hash << 5) - hash) + char.charCodeAt(0)
  return { icon: 'Building2', color: fallbackColor || `hsl(${Math.abs(hash) % 360} 58% 42%)` }
}

// Complaint created_at → bucket counts for the trailing `months` calendar
// months (calendar month labels, real rows only — nothing is manufactured).
export function monthlyTrend(complaints = [], months = 3) {
  const buckets = new Map()
  const now = new Date()
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    buckets.set(date.toISOString().slice(0, 7), { month: date.toLocaleDateString('en-US', { month: 'short' }), value: 0 })
  }
  complaints.forEach((complaint) => {
    if (!complaint.createdAt) return
    const date = new Date(complaint.createdAt)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.get(key)
    if (bucket) bucket.value += 1
  })
  return [...buckets.values()]
}

export function openComplaintsFrom(rollup) {
  const terminal = Object.entries(rollup.statusSummary || {})
    .filter(([status]) => TERMINAL_STATUSES.includes(status))
    .reduce((sum, [, count]) => sum + Number(count), 0)
  return Math.max(0, rollup.total - terminal)
}

// Backend UPPERCASE statuses that end the proposal lifecycle. "Open" is the
// complement — same idea as the complaint definition above.
export const PROPOSAL_TERMINAL_STATUSES = ['COMPLETED', 'REJECTED']

export function openProposalsFrom(proposals = []) {
  return proposals.filter((proposal) => !PROPOSAL_TERMINAL_STATUSES.includes(String(proposal.status || '').toUpperCase())).length
}

export function buildDepartmentRows(departments, facilityGroups, rollups, projectGroups = [], proposalGroups = []) {
  return departments.map((dept, index) => {
    const facilities = facilityGroups[index] || []
    const rollup = rollups[index] || { total: 0, statusSummary: {}, complaints: [] }
    const projects = projectGroups[index] || []
    const proposals = proposalGroups[index] || []
    const positioned = facilities.filter((f) => Number.isFinite(f.longitude) && Number.isFinite(f.latitude))
    const gapScore = positioned.length
      ? positioned.reduce((sum, f) => sum + Number(f.gapScore || 0), 0) / positioned.length
      : null
    return {
      id: dept.id,
      name: dept.name,
      ...visualForDepartment(dept.name, dept.color),
      facilityCount: facilities.length,
      projectCount: projects.length,
      proposalCount: proposals.length,
      openProposals: openProposalsFrom(proposals),
      openGrievances: openComplaintsFrom(rollup),
      grievanceTotal: rollup.total,
      gapScore,
      trend: rollup.complaints.length ? monthlyTrend(rollup.complaints) : [],
    }
  })
}

// Highest-deficit sectors — real gap scores (shared facilityMapper algorithm)
// sorted descending, used by the GIS Decision Support card.
export function topCoverageGaps(rows, limit = 5) {
  return rows
    .filter((row) => row.gapScore != null)
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, limit)
}

// Facility-weighted mean gap score, sensibly rounded — feeds the KPI strip.
export function weightedGapScore(rows) {             
  const weighted = rows.filter((row) => row.gapScore != null)
  if (!weighted.length) return null
  const total = weighted.reduce((sum, row) => sum + row.facilityCount, 0)
  if (!total) return null
  return weighted.reduce((sum, row) => sum + row.gapScore * row.facilityCount, 0) / total
}