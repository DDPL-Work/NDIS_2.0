// TanStack Query hook for GET /tax-slip/
import { useQuery } from '@tanstack/react-query'
import { taxSlipApi } from '../api/taxSlipApi.js'
import { taxKeys } from '../constants/queryKeys.js'

export function useTaxSlip(params = {}, options = {}) {
  const plotId = params.plot_id || params.plotId || params.property_id
  return useQuery({
    queryKey: taxKeys.taxSlip(params),
    queryFn: () => taxSlipApi.fetchTaxSlip(params),
    enabled: Boolean(plotId) && (options.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options
  })
}
