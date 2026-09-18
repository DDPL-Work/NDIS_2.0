// Revenue & Property Intelligence — Demands Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { demandApi } from '../api'
import { demandKeys, propertyKeys } from '../constants/queryKeys'

export function useDemands(filters = {}) {
  return useQuery({
    queryKey: demandKeys.list(filters),
    queryFn: () => demandApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useDemand(id) {
  return useQuery({
    queryKey: demandKeys.detail(id),
    queryFn: () => demandApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useDemandsByProperty(propertyId) {
  return useQuery({
    queryKey: demandKeys.byProperty(propertyId),
    queryFn: () => demandApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useDemandsByFinancialYear(fy) {
  return useQuery({
    queryKey: demandKeys.byFinancialYear(fy),
    queryFn: () => demandApi.getByFinancialYear(fy),
    enabled: !!fy,
    staleTime: 60000,
    retry: 1,
  })
}

export function useDemandHistory(filters = {}) {
  return useQuery({
    queryKey: demandKeys.history(filters),
    queryFn: () => demandApi.getHistory(filters),
    staleTime: 60000,
    retry: 1,
  })
}

// Mutations
export function useGenerateDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: demandApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demandKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useGenerateDemandForProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ propertyId, financialYear }) => demandApi.generateForProperty(propertyId, financialYear),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.byProperty(variables.propertyId) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.propertyId) })
    },
  })
}

export function useSendDemandNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: demandApi.sendNotice,
    onSuccess: (data, demandId) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.detail(demandId) })
      queryClient.invalidateQueries({ queryKey: demandKeys.list() })
    },
  })
}

export function useReviseDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ demandId, payload }) => demandApi.reviseDemand(demandId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.detail(variables.demandId) })
      queryClient.invalidateQueries({ queryKey: demandKeys.list() })
    },
  })
}

export function useCancelDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ demandId, reason }) => demandApi.cancelDemand(demandId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: demandKeys.detail(variables.demandId) })
      queryClient.invalidateQueries({ queryKey: demandKeys.list() })
    },
  })
}