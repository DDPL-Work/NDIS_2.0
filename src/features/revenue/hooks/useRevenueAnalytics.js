// Revenue & Property Intelligence — Revenue Analytics Hook
import { useQuery } from '@tanstack/react-query'
import { revenueAnalyticsApi } from '../api'
import { revenueAnalyticsKeys } from '../constants/queryKeys'

export function useRevenueKPIs(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.all, // KPIs use a simple key
    queryFn: () => revenueAnalyticsApi.getKpis(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useCollectionHeatmap(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.collectionHeatmap(filters),
    queryFn: () => revenueAnalyticsApi.getCollectionHeatmap(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useArrearsHeatmap(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.arrearsHeatmap(filters),
    queryFn: () => revenueAnalyticsApi.getArrearsHeatmap(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useDemandHeatmap(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.demandHeatmap(filters),
    queryFn: () => revenueAnalyticsApi.getDemandHeatmap(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useRevenueGap(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.revenueGap(filters),
    queryFn: () => revenueAnalyticsApi.getRevenueGap(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyDensity(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.propertyDensity(filters),
    queryFn: () => revenueAnalyticsApi.getPropertyDensity(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useHighValueProperties(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.highValueMap(filters),
    queryFn: () => revenueAnalyticsApi.getHighValueProperties(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function useAssessmentChangeCandidates(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.assessmentChange(filters),
    queryFn: () => revenueAnalyticsApi.getAssessmentChangeCandidates(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useBlockWardAnalytics(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.blockWard(filters),
    queryFn: () => revenueAnalyticsApi.getBlockWardAnalytics(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function useRevenueTrends(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.trends(filters),
    queryFn: () => revenueAnalyticsApi.getRevenueTrends(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function useReviewCandidates(filters = {}) {
  return useQuery({
    queryKey: revenueAnalyticsKeys.reviewCandidates(filters),
    queryFn: () => revenueAnalyticsApi.getReviewCandidates(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useCollectionVsDemand(filters = {}) {
  return useQuery({
    queryKey: ['revenue', 'analytics', 'collectionVsDemand', filters],
    queryFn: () => revenueAnalyticsApi.getCollectionVsDemand(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function useTopDefaulters(filters = {}) {
  return useQuery({
    queryKey: ['revenue', 'analytics', 'topDefaulters', filters],
    queryFn: () => revenueAnalyticsApi.getTopDefaulters(filters),
    staleTime: 60000,
    retry: 1,
  })
}