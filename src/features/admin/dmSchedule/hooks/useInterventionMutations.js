import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backendInterventionApi } from '../../../../api/interventionApi'
import { interventionKeys } from '../../../../config/queryKeys'
import { scheduleTaskKeys } from '../../../../config/queryKeys'

export function useCreateIntervention() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => backendInterventionApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interventionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function useUpdateIntervention() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => backendInterventionApi.update(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: interventionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: interventionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}

export function useTransitionIntervention() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, payload }) => backendInterventionApi[action](id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: interventionKeys.detail(id) })
      qc.invalidateQueries({ queryKey: interventionKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
    },
  })
}
