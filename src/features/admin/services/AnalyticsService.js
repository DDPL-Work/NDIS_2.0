// Executive analytics aggregation for /admin/analytics.
//
// Data sources (backend_guide2.0.md):
//   - GET /api/departments/                department master rows (names/ids)
//   - GET /api/facilities/?district={d}    real facility collection per
//                                          department, reusing the SAME shared
//                                          cache + facilityMapper gap scoring
//                                          the admin overview already uses, so
//                                          counts and gap scores are identical
//                                          everywhere in the app (§30).
//
// Coverage / gap definition (existing project convention):
//   - gapScore 0..1 per facility     → facilityMapper neighbourhood model
//   - department gap                 → mean over positioned facilities
//   - coveragePct                    → (1 − gap) × 100, the definition the
//     dashboard always used (Vol 3 deficit engine)
//   - geoTaggedPct                   → facilities with valid coordinates /
//                                      total × 100
//
// Deliberately NOT computed:
//   - sanctioned / utilized / budget-used: the backend guide (v2.0) and the
//     deployed API expose no budget endpoints (schemes/budgets are listed as
//     backend gaps in PHASE_2_INTEGRATION_REPORT.md). Fabricating rupees or
//     percentages would violate the dashboard's no-fake-data policy; pages
//     must render an explicit "not available" state instead.
//   - historical monthly coverage: no history endpoint exists and coverage is
//     derived from current facility geometry, so a 7-month trend cannot be
//     reconstructed. Same no-fabrication rule applies.
import { buildDepartmentRows, weightedGapScore } from './DepartmentCoverageService'

const isPositioned = (facility) => Number.isFinite(facility.longitude) && Number.isFinite(facility.latitude)

// geo-tagged facilities / total facilities × 100 — null when there is nothing
// to divide (avoids NaN/Infinity; UI shows "—" for those cases).
export function geoTaggedPct(facilities = []) {
  const total = facilities.length
  if (!total) return null
  return Math.round((facilities.filter(isPositioned).length / total) * 100)
}

// Facility-weighted % across departments (a dept with more facilities counts
// for more), matching how the overview weights gap scores.
export function weightedPercentage(rows, key) {
  const part = rows.filter((row) => row[key] != null && row.facilityCount > 0)
  const total = part.reduce((sum, row) => sum + row.facilityCount, 0)
  if (!total) return null
  return Math.round(part.reduce((sum, row) => sum + row[key] * row.facilityCount, 0) / total)
}

// Build the normalized analytics model used by every section of the page:
// { rows, totalFacilities, geoTaggedPct, departmentsReported, avgGapScore,
//   coveragePct, totalSanctioned: null, totalUtilized: null }.
export function buildAnalyticsModel({ departments = [], facilityGroups = [] }) {
  const base = buildDepartmentRows(departments, facilityGroups, [])
  const rows = base.map((row, index) => {
    const facilities = facilityGroups[index] || []
    return {
      ...row,
      geoTaggedPct: facilities.length ? geoTaggedPct(facilities) : null,
      // Coverage = (1 − avg gap) — same definition used by the KPI, the
      // budget-adjacent cards and this matrix.
      coveragePct: row.gapScore == null ? null : Math.round((1 - row.gapScore) * 100),
      // Budget utilization is a documented backend gap → null, not 0, so the
      // UI can show "not available" instead of pretending.
      budgetUsedPct: null,
    }
  })
  const reported = rows.filter((row) => row.facilityCount > 0)
  const totalFacilities = rows.reduce((sum, row) => sum + row.facilityCount, 0)
  return {
    rows,
    totalFacilities,
    geoTaggedPct: weightedPercentage(rows, 'geoTaggedPct'),
    departmentsReported: reported.length,
    totalDepartments: rows.length,
    avgGapScore: weightedGapScore(rows),
    coveragePct: weightedPercentage(rows, 'coveragePct'),
    totalSanctioned: null, // backend gap — do NOT present a fabricated number
    totalUtilized: null,
  }
}