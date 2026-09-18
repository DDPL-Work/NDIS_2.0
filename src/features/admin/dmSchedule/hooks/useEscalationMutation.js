import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../../../api/apiClient'
import { complaintKeys } from '../../../../config/queryKeys'
import { scheduleTaskKeys } from '../../../../config/queryKeys'
import { invalidateData, DATA_SCOPES } from '../../../../app/store/dataVersionStore'

export function useEscalateComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ complaintId, reason }) =>
      apiRequest(`/complaints/${complaintId}/escalate/`, {
        method: 'POST',
        body: { reason },
      }),
    onSuccess: (_, { complaintId }) => {
      qc.invalidateQueries({ queryKey: complaintKeys.detail(complaintId) })
      qc.invalidateQueries({ queryKey: complaintKeys.all })
      qc.invalidateQueries({ queryKey: scheduleTaskKeys.all })
      invalidateData(DATA_SCOPES.COMPLAINTS)
      invalidateData(DATA_SCOPES.DASHBOARD)
    },
  })
}
