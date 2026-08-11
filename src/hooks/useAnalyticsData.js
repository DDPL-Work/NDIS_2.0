import { useAsync } from './useAsync'
import { useDepartments } from './useDepartments'
import { GISRepository } from '../gis/repositories/GISRepository'
import { buildAnalyticsModel } from '../features/admin/services/AnalyticsService'

// One fetch for the whole Analytics page: department master + the facility
// collection per department run in parallel and are aggregated once. The
// per-department facility calls go through the shared facility cache, so this
// never re-downloads the same payload the map or the department overview
// already fetched (and vice-versa). Deps are stable (districtId + joined
// department ids) so nothing re-fires on render or tab changes.
// Returns { data: analyticsModel, loading, error, refetch }.
export function useAnalyticsData(districtId) {
  const { data: departments, loading: loadingDepartments, error: departmentError } = useDepartments()
  const ids = (departments || []).map((d) => d.id)
  const idsKey = ids.join(',')

  const { data, loading, error, refetch } = useAsync(async () => {
    if (!ids.length) return buildAnalyticsModel({ departments: [], facilityGroups: [] })
    const facilityGroups = await Promise.all(
      ids.map((id) => GISRepository.facilities({ districtId, departmentId: id }))
    )
    return buildAnalyticsModel({ departments, facilityGroups })
  }, [districtId, idsKey])

  return { data, loading: loadingDepartments || loading, error: error || departmentError, refetch }
}