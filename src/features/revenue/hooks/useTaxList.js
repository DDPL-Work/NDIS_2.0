// TanStack Query hook for GET /api/gis/tax-list/
import { useQuery } from '@tanstack/react-query'
import { propertyTaxApi } from '../api/propertyTaxApi.js'
import { taxKeys } from '../constants/queryKeys.js'

export function useTaxList(params = {}, options = {}) {
  return useQuery({
    queryKey: taxKeys.taxList(params),
    queryFn: () => propertyTaxApi.fetchTaxList(params),
    staleTime: 60 * 1000,
    keepPreviousData: true,
    ...options
  })
}

export function useTaxRecord(identifier, options = {}) {
  return useQuery({
    queryKey: taxKeys.taxRecord(identifier),
    queryFn: () => propertyTaxApi.fetchTaxRecord(identifier),
    enabled: Boolean(identifier),
    staleTime: 60 * 1000,
    ...options
  })
}
