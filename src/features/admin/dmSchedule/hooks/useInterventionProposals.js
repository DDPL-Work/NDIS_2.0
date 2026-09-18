import { useQuery } from '@tanstack/react-query'
import { backendInterventionApi } from '../../../../api/interventionApi'
import { interventionKeys } from '../../../../config/queryKeys'

export function useInterventionProposals(filters = {}) {
  return useQuery({
    queryKey: interventionKeys.list(filters),
    queryFn: () => backendInterventionApi.list(filters),
    staleTime: 30_000,
  })
}

export function useInterventionProposal(id) {
  return useQuery({
    queryKey: interventionKeys.detail(id),
    queryFn: () => backendInterventionApi.get(id),
    enabled: !!id,
  })
}
