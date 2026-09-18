// Revenue & Property Intelligence — Timeline, Risk, Compliance Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timelineApi, riskApi, complianceApi } from '../api'
import { timelineKeys, riskKeys, complianceKeys, scheduleTaskKeys } from '../constants/queryKeys'
import { useAuthStore } from '../../../app/store/authStore'

export function usePropertyTimeline(propertyId, params = {}) {
  return useQuery({
    queryKey: timelineKeys.byProperty(propertyId),
    queryFn: () => timelineApi.getTimeline(propertyId, params),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyRisk(propertyId) {
  return useQuery({
    queryKey: riskKeys.byProperty(propertyId),
    queryFn: () => riskApi.getRiskAssessment(propertyId),
    enabled: !!propertyId,
    staleTime: 120000,
    retry: 1,
  })
}

export function usePropertyRiskDetail(riskId) {
  return useQuery({
    queryKey: ['revenue', 'risk', 'detail', riskId],
    queryFn: () => riskApi.getRiskAssessmentDetail(riskId),
    enabled: !!riskId,
    staleTime: 120000,
    retry: 1,
  })
}

export function usePropertyCompliance(propertyId) {
  return useQuery({
    queryKey: complianceKeys.byProperty(propertyId),
    queryFn: () => complianceApi.getComplianceStatus(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useTriggerRiskRecalculation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: riskApi.triggerRiskRecalculation,
    onSuccess: (data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['revenue', 'risk', 'property', propertyId] })
    },
  })
}

export function useCreateScheduleTask() {
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  return useMutation({
    mutationFn: async (taskData) => {
      // This would call the schedule task API
      // For now, we'll use the existing schedule task infrastructure
      throw new Error('Schedule task creation not yet implemented - requires backend API')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function useSchedulePropertyInspection() {
  const queryClient = useQueryClient()
  const createTask = useCreateScheduleTask()

  return useMutation({
    mutationFn: async ({ propertyId, scheduledDate, notes, priority = 'medium' }) => {
      const taskData = {
        type: 'PROPERTY_INSPECTION',
        title: `Property Inspection - ${propertyId}`,
        description: notes || `Scheduled inspection for property ${propertyId}`,
        dueDate: scheduledDate,
        priority,
        propertyId,
        sourceType: 'revenue_property_intelligence',
        metadata: { propertyId },
      }
      return createTask.mutateAsync(taskData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue', 'inspections', 'scheduled'] })
    },
  })
}

export function useScheduleReassessment() {
  const queryClient = useQueryClient()
  const createTask = useCreateScheduleTask()

  return useMutation({
    mutationFn: async ({ propertyId, scheduledDate, reason, priority = 'medium' }) => {
      const taskData = {
        type: 'REASSESSMENT',
        title: `Reassessment - ${propertyId}`,
        description: reason || `Reassessment requested for property ${propertyId}`,
        dueDate: scheduledDate,
        priority,
        propertyId,
        sourceType: 'revenue_property_intelligence',
        metadata: { propertyId },
      }
      return createTask.mutateAsync(taskData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue', 'reassessments', 'list'] })
    },
  })
}

export function useIssueTaxNotice() {
  const queryClient = useQueryClient()
  const createTask = useCreateScheduleTask()

  return useMutation({
    mutationFn: async ({ propertyId, noticeType, dueDate, amount, priority = 'high' }) => {
      const taskData = {
        type: 'TAX_NOTICE',
        title: `Tax Notice - ${propertyId}`,
        description: `Issue ${noticeType} notice for property ${propertyId}. Amount: ${amount}`,
        dueDate,
        priority,
        propertyId,
        sourceType: 'revenue_property_intelligence',
        metadata: { propertyId, noticeType, amount },
      }
      return createTask.mutateAsync(taskData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue', 'notices', 'list'] })
    },
  })
}

export function useCreateRecoveryAction() {
  const queryClient = useQueryClient()
  const createTask = useCreateScheduleTask()

  return useMutation({
    mutationFn: async ({ propertyId, actionType, scheduledDate, notes, priority = 'high' }) => {
      const taskData = {
        type: 'ARREAR_RECOVERY',
        title: `Recovery Action - ${propertyId}`,
        description: notes || `Initiate ${actionType} recovery for property ${propertyId}`,
        dueDate: scheduledDate,
        priority,
        propertyId,
        sourceType: 'revenue_property_intelligence',
        metadata: { propertyId, actionType },
      }
      return createTask.mutateAsync(taskData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue', 'recovery', 'list'] })
    },
  })
}