import { useQuery } from '@tanstack/react-query'
import { backendInspectionApi } from '../../../../api/inspectionApi'
import { inspectionKeys } from '../../../../config/queryKeys'

export function useInspectionSchedules(filters = {}) {
  return useQuery({
    queryKey: inspectionKeys.list(filters),
    queryFn: () => backendInspectionApi.list(filters),
    staleTime: 30_000,
  })
}

export function useInspectionSchedule(id) {
  return useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => backendInspectionApi.get(id),
    enabled: !!id,
  })
}
