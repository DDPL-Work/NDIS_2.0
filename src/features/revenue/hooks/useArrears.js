// Revenue & Property Intelligence — Arrears & Recovery Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { arrearsApi } from '../api'
import { arrearsKeys, propertyKeys } from '../constants/queryKeys'

export function useArrears(filters = {}) {
  return useQuery({
    queryKey: arrearsKeys.list(filters),
    queryFn: () => arrearsApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useArrear(id) {
  return useQuery({
    queryKey: arrearsKeys.detail(id),
    queryFn: () => arrearsApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useArrearsByProperty(propertyId) {
  return useQuery({
    queryKey: arrearsKeys.byProperty(propertyId),
    queryFn: () => arrearsApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useArrearsAging(filters = {}) {
  return useQuery({
    queryKey: arrearsKeys.aging(filters),
    queryFn: () => arrearsApi.getAging(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function useRecoveryList(filters = {}) {
  return useQuery({
    queryKey: arrearsKeys.recovery(filters),
    queryFn: () => arrearsApi.getRecoveryList(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useRecoveryDetail(id) {
  return useQuery({
    queryKey: arrearsKeys.recoveryDetail(id),
    queryFn: () => arrearsApi.getRecoveryDetail(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useRecoveryByProperty(propertyId) {
  return useQuery({
    queryKey: ['revenue', 'recovery', 'property', propertyId],
    queryFn: () => arrearsApi.getRecoveryByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

// Mutations
export function useCreateRecoveryAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: arrearsApi.createRecoveryAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recovery() })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.all })
    },
  })
}

export function useUpdateRecoveryAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => arrearsApi.updateRecoveryAction(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recoveryDetail(variables.id) })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recovery() })
    },
  })
}

export function useInitiateAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: arrearsApi.initiateAttachment,
    onSuccess: (data, recoveryId) => {
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recoveryDetail(recoveryId) })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recovery() })
    },
  })
}

export function useScheduleAuction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ recoveryId, auctionDate }) => arrearsApi.scheduleAuction(recoveryId, auctionDate),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recoveryDetail(variables.recoveryId) })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recovery() })
    },
  })
}

export function useRecordSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ recoveryId, payload }) => arrearsApi.recordSettlement(recoveryId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recoveryDetail(variables.recoveryId) })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recovery() })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useWriteOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ recoveryId, payload }) => arrearsApi.writeOff(recoveryId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recoveryDetail(variables.recoveryId) })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.recovery() })
      queryClient.invalidateQueries({ queryKey: arrearsKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}