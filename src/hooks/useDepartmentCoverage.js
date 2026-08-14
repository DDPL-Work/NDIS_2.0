import { useAsync } from './useAsync'
import { useDepartments } from './useDepartments'
import { GISRepository } from '../gis/repositories/GISRepository'
import { DepartmentRepository } from '../gis/repositories/DepartmentRepository'
import { buildDepartmentRows, topCoverageGaps, weightedGapScore } from '../features/admin/services/DepartmentCoverageService'

// One fetch for the whole executive overview: departments + facilities count
// + complaint rollups + project/proposal registries run in parallel
// (independent lightweight calls, bounded by the number of departments) and
// are aggregated once. Stable deps (districtId + joined department ids) so
// nothing re-fires on render. Returns { rows, topGaps, facilityCount, avgGapScore }.
export function useDepartmentCoverage(districtId) {
  const { data: departments, loading: loadingDepartments, error: departmentError } = useDepartments()
  const ids = (departments || []).map((d) => d.id)
  const idsKey = ids.join(',')

  const { data, loading, error, refetch } = useAsync(async () => {
    if (!ids.length) return { rows: [], topGaps: [], facilityCount: 0, avgGapScore: null }
    const [facilityGroups, rollups, projectGroups, proposalGroups] = await Promise.all([
      Promise.all(ids.map((id) => GISRepository.facilities({ districtId, departmentId: id }))),
      Promise.all(ids.map((id) => DepartmentRepository.complaints(id))),
      Promise.all(ids.map((id) => DepartmentRepository.projects(id))),
      Promise.all(ids.map((id) => DepartmentRepository.proposals(id))),
    ])
    const rows = buildDepartmentRows(departments, facilityGroups, rollups, projectGroups, proposalGroups)
    return {
      rows,
      topGaps: topCoverageGaps(rows, 5),
      facilityCount: rows.reduce((sum, row) => sum + row.facilityCount, 0),
      avgGapScore: weightedGapScore(rows),
    }
  }, [districtId, idsKey])

  return { data, loading: loadingDepartments || loading, error: error || departmentError, refetch }
}