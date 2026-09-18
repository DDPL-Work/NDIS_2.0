// Revenue & Property Intelligence — Inspections Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inspectionApi } from '../api'
import { inspectionKeys, propertyKeys } from '../constants/queryKeys'

export function useInspections(filters = {}) {
  return useQuery({
    queryKey: inspectionKeys.list(filters),
    queryFn: () => inspectionApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useInspection(id) {
  return useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: () => inspectionApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useInspectionsByProperty(propertyId) {
  return useQuery({
    queryKey: inspectionKeys.byProperty(propertyId),
    queryFn: () => inspectionApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useAssignedInspections(officerId) {
  return useQuery({
    queryKey: inspectionKeys.assigned(officerId),
    queryFn: () => inspectionApi.getAssigned(officerId),
    enabled: !!officerId,
    staleTime: 30000,
    retry: 1,
  })
}

export function useScheduledInspections(filters = {}) {
  return useQuery({
    queryKey: inspectionKeys.scheduled(filters),
    queryFn: () => inspectionApi.getScheduled(filters),
    staleTime: 30000,
    retry: 1,
  })
}

// Mutations
export function useScheduleInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inspectionApi.schedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useStartInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, inspectorId }) => inspectionApi.start(id, inspectorId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: inspectionKeys.list() })
    },
  })
}

export function useCompleteInspection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => inspectionApi.complete(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: inspectionKeys.list() })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useUploadInspectionEvidence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }) => inspectionApi.uploadEvidence(id, files),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) })
    },
  })
}