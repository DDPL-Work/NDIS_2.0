// Revenue & Property Intelligence — Reassessments Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reassessmentApi } from '../api'
import { reassessmentKeys, propertyKeys, assessmentKeys } from '../constants/queryKeys'

export function useReassessments(filters = {}) {
  return useQuery({
    queryKey: reassessmentKeys.list(filters),
    queryFn: () => reassessmentApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useReassessment(id) {
  return useQuery({
    queryKey: reassessmentKeys.detail(id),
    queryFn: () => reassessmentApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useReassessmentsByProperty(propertyId) {
  return useQuery({
    queryKey: reassessmentKeys.byProperty(propertyId),
    queryFn: () => reassessmentApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

// Mutations
export function useInitiateReassessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reassessmentApi.initiate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reassessmentKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
    },
  })
}

export function useApproveReassessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => reassessmentApi.approve(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: reassessmentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: reassessmentKeys.list() })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
    },
  })
}

export function useRejectReassessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => reassessmentApi.reject(id, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: reassessmentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: reassessmentKeys.list() })
    },
  })
}