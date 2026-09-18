// Revenue & Property Intelligence — Assessments Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assessmentApi } from '../api'
import { assessmentKeys, propertyKeys } from '../constants/queryKeys'

export function useAssessments(filters = {}) {
  return useQuery({
    queryKey: assessmentKeys.list(filters),
    queryFn: () => assessmentApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useAssessment(id) {
  return useQuery({
    queryKey: assessmentKeys.detail(id),
    queryFn: () => assessmentApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useAssessmentsByProperty(propertyId) {
  return useQuery({
    queryKey: assessmentKeys.byProperty(propertyId),
    queryFn: () => assessmentApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useAssessmentHistory(propertyId) {
  return useQuery({
    queryKey: assessmentKeys.history(propertyId),
    queryFn: () => assessmentApi.getByProperty(propertyId), // Same endpoint with different params
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useTaxRules(filters = {}) {
  return useQuery({
    queryKey: assessmentKeys.rules(filters),
    queryFn: () => assessmentApi.getRules(filters),
    staleTime: 120000,
    retry: 1,
  })
}

export function useTaxRule(id) {
  return useQuery({
    queryKey: assessmentKeys.ruleDetail(id),
    queryFn: () => assessmentApi.getRule(id),
    enabled: !!id,
    staleTime: 120000,
    retry: 1,
  })
}

export function usePendingAssessmentReview(filters = {}) {
  return useQuery({
    queryKey: assessmentKeys.pendingReview(filters),
    queryFn: () => assessmentApi.getPendingReview(filters),
    staleTime: 30000,
    retry: 1,
  })
}

// Mutations
export function useCreateAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assessmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
    },
  })
}

export function useUpdateAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => assessmentApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.list() })
    },
  })
}

export function useCreateTaxRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: assessmentApi.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.rules() })
    },
  })
}

export function useUpdateTaxRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => assessmentApi.updateRule(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.ruleDetail(variables.id) })
      queryClient.invalidateQueries({ queryKey: assessmentKeys.rules() })
    },
  })
}

export function useInitiateReassessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ propertyId, payload }) => assessmentApi.initiateReassessment(propertyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}