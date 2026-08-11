// Read-model selectors for the State Administration Panel.
// Every KPI, chart series and report number is DERIVED from the finance
// records — no number is ever typed in manually for display purposes.
import { sum } from '../services/financeService'

export const yearValue = (row, field) => row?.[field] || 0

// Full state-level position for a financial year.
export function statePosition({ departmentBudgets = [], districtAllocations = [], sanctions = [], fundReleases = [], commitments = [], expenditures = [], fy } = {}) {
  const filter = (set, fn) => set.filter((r) => r.fy === fy && fn(r))
  const db = departmentBudgets.filter((d) => d.fy === fy)
  const sanctioned = filter(sanctions, () => true)
  const released = filter(fundReleases, (r) => r.status === 'approved')
  const committed = filter(commitments, () => true)
  const utilized = filter(expenditures, () => true)
  const allocated = filter(districtAllocations, () => true)
  return {
    fy,
    provision: sum(db, 'provision'),
    authorized: sum(db, 'authorized'),
    allocated: sum(allocated, 'amount'),
    sanctioned: sum(sanctioned, 'amount'),
    released: sum(released, 'amount'),
    committed: sum(committed, 'amount'),
    utilized: sum(utilized, 'amount'),
    derived: {
      unallocated: sum(db, 'authorized') - sum(allocated, 'amount'),
      remainToSanction: sum(db, 'authorized') - sum(sanctioned, 'amount'),
      unreleased: sum(sanctioned, 'amount') - sum(released, 'amount'),
      availableAfterRelease: sum(released, 'amount') - sum(committed, 'amount'),
      uncommitted: sum(released, 'amount') - sum(committed, 'amount'),
      unutilized: sum(committed, 'amount') - sum(utilized, 'amount'),
    },
  }
}

// Per-department position rows (for charts/tables).
export function departmentPositions({ departmentBudgets = [], districtAllocations = [], sanctions = [], fundReleases = [], commitments = [], expenditures = [], departments = [], fy, departmentId = null } = {}) {
  const scope = departmentBudgets.filter((d) => d.fy === fy && (!departmentId || d.departmentId === departmentId))
  return scope.map((db) => {
    const get = {
      sanctioned: sum(sanctions.filter((s) => s.fy === fy && s.departmentId === db.departmentId), 'amount'),
      released: sum(fundReleases.filter((r) => r.fy === fy && r.departmentId === db.departmentId && r.status === 'approved'), 'amount'),
      committed: sum(commitments.filter((c) => c.fy === fy && c.departmentId === db.departmentId), 'amount'),
      utilized: sum(expenditures.filter((e) => e.fy === fy && e.departmentId === db.departmentId), 'amount'),
      allocated: sum(districtAllocations.filter((a) => a.fy === fy && a.departmentId === db.departmentId), 'amount'),
    }
    return {
      departmentId: db.departmentId,
      departmentName: departments.find((d) => d.id === db.departmentId)?.name || db.departmentId,
      departmentCode: departments.find((d) => d.id === db.departmentId)?.code || db.departmentId.toUpperCase(),
      budgetHeadId: db.budgetHeadId,
      provision: db.provision,
      authorized: db.authorized,
      allocated: get.allocated,
      sanctioned: get.sanctioned,
      released: get.released,
      committed: get.committed,
      utilized: get.utilized,
      unallocated: db.authorized - get.allocated,
      remainToSanction: db.authorized - get.sanctioned,
      unreleased: get.sanctioned - get.released,
      availableAfterRelease: get.released - get.committed,
      unutilized: get.committed - get.utilized,
      utilizationPct: get.released ? Math.min(100, Math.round((get.utilized / get.released) * 100)) : null,
      utilizationOfAuthorized: db.authorized ? Math.round((get.utilized / db.authorized) * 100) : null,
      sanctionPct: db.authorized ? Math.round((get.sanctioned / db.authorized) * 100) : null,
      releasePct: get.sanctioned ? Math.round((get.released / get.sanctioned) * 100) : null,
    }
  })
}

// Per-district position rows.
export function districtPositions({ districtAllocations = [], fundReleases = [], expenditures = [], districts = [], fy, districtId = null, departmentId = null } = {}) {
  const scope = districtAllocations.filter((a) => a.fy === fy && (!districtId || a.districtId === districtId) && (!departmentId || a.departmentId === departmentId))
  const byDistrict = scope.reduce((acc, a) => {
    if (!acc[a.districtId]) acc[a.districtId] = []
    acc[a.districtId].push(a)
    return acc
  }, {})
  return Object.entries(byDistrict).map(([districtIdKey, rows]) => {
    const amount = sum(rows, 'amount')
    const month = { districtId: districtIdKey, districtName: districts.find((d) => d.id === districtIdKey)?.name || districtIdKey, allocated: amount }
    const releases = fundReleases.filter((r) => r.fy === fy && r.districtId === districtIdKey && r.status === 'approved')
    month.released = sum(releases, 'amount')
    month.utilized = sum(expenditures.filter((e) => e.fy === fy && e.districtId === districtIdKey), 'amount')
    month.utilizedPct = month.released ? Math.round((month.utilized / month.released) * 100) : null
    return month
  })
}

// Per-scheme position rows.
export function schemePositions({ departmentBudgets = [], sanctions = [], fundReleases = [], expenditures = [], schemes = [], fy } = {}) {
  const scope = departmentBudgets.filter((d) => d.fy === fy)
  return (schemes.length ? schemes : scope.map((d) => ({ id: d.schemeId, label: d.schemeId })))
    .map((scheme) => {
      const schemeId = scheme.id
      const sanctioned = sum(sanctions.filter((s) => s.fy === fy && s.schemeId === schemeId), 'amount')
      const released = sum(fundReleases.filter((r) => r.fy === fy && r.schemeId === schemeId && r.status === 'approved'), 'amount')
      const utilized = sum(expenditures.filter((e) => e.fy === fy && e.schemeId === schemeId), 'amount')
      return {
        schemeId,
        schemeName: scheme.name || scheme.label || schemeId,
        sanctioned,
        released,
        utilized,
        releasePct: sanctioned ? Math.round((released / sanctioned) * 100) : null,
        utilizationPct: released ? Math.round((utilized / released) * 100) : null,
      }
    })
    .filter((s) => s.sanctioned > 0 || s.released > 0 || s.utilized > 0)
}

// Per-sanction position rows (includes every release against it).
export function sanctionPositions(sanctions, fundReleases, fy) {
  return sanctions.filter((s) => s.fy === fy).map((s) => {
    const released = sum(fundReleases.filter((r) => r.sanctionId === s.id && r.status === 'approved'), 'amount')
    return { ...s, released, unreleased: s.amount - released, status: s.status }
  })
}

// Precise traceability: the full chain for one department ⇄ district ⇄ scheme.
export function filterRecords({ departmentId = null, districtId = null, schemeId = null, budgetHeadId = null, fy = null, sanctions = [], fundReleases = [], commitments = [], expenditures = [], allocations = [] } = {}) {
  const match = (r) =>
    (!fy || r.fy === fy) &&
    (!departmentId || r.departmentId === departmentId) &&
    (!districtId || !r.districtId || r.districtId === districtId) &&
    (!schemeId || !r.schemeId || r.schemeId === schemeId) &&
    (!budgetHeadId || !r.budgetHeadId || r.budgetHeadId === budgetHeadId)
  return {
    sanctions: sanctions.filter(match),
    fundReleases: fundReleases.filter(match),
    commitments: commitments.filter(match),
    expenditures: expenditures.filter(match),
    allocations: allocations.filter(match),
  }
}