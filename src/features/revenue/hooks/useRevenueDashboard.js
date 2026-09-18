// Revenue & Property Intelligence — Dashboard Hook
// Centralized data fetching for Revenue Dashboard

import { useQuery } from '@tanstack/react-query'
import { revenueDashboardKeys } from '../constants/queryKeys'
import { revenueAnalyticsApi } from '../api'
import { useAuthStore } from '../../../app/store/authStore'

export function useRevenueDashboard(filters = {}) {
  const user = useAuthStore(s => s.user)
  const isAdmin = user && ['district_collector', 'dm', 'adm', 'state_admin', 'state_finance_admin', 'system_admin'].includes(user.role)
  const isRevenueOfficer = user && ['revenue_officer', 'revenue_admin'].includes(user.role)

  // Default filters based on role
  const defaultFilters = {
    districtId: user?.districtId,
    blockId: user?.blockId,
    financialYear: filters.financialYear,
    ...filters,
  }

  const kpisQuery = useQuery({
    queryKey: revenueDashboardKeys.kpis(defaultFilters),
    queryFn: () => revenueAnalyticsApi.getKpis(defaultFilters),
    enabled: isAdmin || isRevenueOfficer,
    staleTime: 30000,
    retry: 1,
  })

  const analyticsQuery = useQuery({
    queryKey: revenueDashboardKeys.analytics(defaultFilters),
    queryFn: () => revenueAnalyticsApi.getBlockWardAnalytics(defaultFilters),
    enabled: isAdmin || isRevenueOfficer,
    staleTime: 60000,
    retry: 1,
  })

  const trendsQuery = useQuery({
    queryKey: revenueDashboardKeys.trends(defaultFilters),
    queryFn: () => revenueAnalyticsApi.getRevenueTrends(defaultFilters),
    enabled: isAdmin || isRevenueOfficer,
    staleTime: 60000,
    retry: 1,
  })

  const anomaliesQuery = useQuery({
    queryKey: revenueDashboardKeys.anomalies(defaultFilters),
    queryFn: () => revenueAnalyticsApi.getReviewCandidates(defaultFilters),
    enabled: isAdmin || isRevenueOfficer,
    staleTime: 120000,
    retry: 1,
  })

  const collectionHeatmapQuery = useQuery({
    queryKey: revenueDashboardKeys.heatmap({ ...defaultFilters, type: 'collection' }),
    queryFn: () => revenueAnalyticsApi.getCollectionHeatmap(defaultFilters),
    enabled: isAdmin || isRevenueOfficer,
    staleTime: 120000,
    retry: 1,
  })

  const arrearsHeatmapQuery = useQuery({
    queryKey: revenueDashboardKeys.heatmap({ ...defaultFilters, type: 'arrears' }),
    queryFn: () => revenueAnalyticsApi.getArrearsHeatmap(defaultFilters),
    enabled: isAdmin || isRevenueOfficer,
    staleTime: 120000,
    retry: 1,
  })

  return {
    kpis: kpisQuery.data,
    analytics: analyticsQuery.data,
    trends: trendsQuery.data,
    anomalies: anomaliesQuery.data,
    collectionHeatmap: collectionHeatmapQuery.data,
    arrearsHeatmap: arrearsHeatmapQuery.data,
    isLoading: kpisQuery.isLoading || analyticsQuery.isLoading,
    isError: kpisQuery.isError || analyticsQuery.isError,
    error: kpisQuery.error || analyticsQuery.error,
    refetch: () => {
      kpisQuery.refetch()
      analyticsQuery.refetch()
      trendsQuery.refetch()
      anomaliesQuery.refetch()
      collectionHeatmapQuery.refetch()
      arrearsHeatmapQuery.refetch()
    },
  }
}