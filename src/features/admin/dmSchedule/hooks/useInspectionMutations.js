import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backendInspectionApi } from '../../../../api/inspectionApi'
import { inspectionKeys } from '../../../../config/queryKeys'
import { scheduleTaskKeys } from '../../../../config/queryKeys'

export function useCreateInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => backendInspectionApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inspectionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function useUpdateInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => backendInspectionApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: inspectionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: inspectionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function usePostponeInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => backendInspectionApi.postpone(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: inspectionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: inspectionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function useCompleteInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => backendInspectionApi.complete(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: inspectionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: inspectionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function useCancelInspection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => backendInspectionApi.cancel(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: inspectionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: inspectionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}
