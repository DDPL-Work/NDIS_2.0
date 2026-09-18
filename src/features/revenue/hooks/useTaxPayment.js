// TanStack Query hook for POST /api/gis/pay-tax/ and GET /api/gis/pay-tax/
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { taxPaymentApi } from '../api/taxPaymentApi.js'
import { taxKeys } from '../constants/queryKeys.js'

export function useSubmitTaxPayment(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => taxPaymentApi.submitPayment(payload),
    onSuccess: (data, variables, context) => {
      // Invalidate tax list, cadastral map, and payment queries on successful payment
      queryClient.invalidateQueries({ queryKey: taxKeys.all })
      if (options.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    ...options
  })
}

export function useVerifyTaxPayment(params = {}, options = {}) {
  return useQuery({
    queryKey: taxKeys.paymentStatus(params),
    queryFn: () => taxPaymentApi.verifyPayment(params),
    enabled: Boolean(params.plot_id || params.transaction_id),
    ...options
  })
}
