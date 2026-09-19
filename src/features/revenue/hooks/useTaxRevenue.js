// Tax & Revenue Hooks — TanStack Query server state management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taxRevenueApi } from '../api/taxRevenueApi'

export const TAX_REVENUE_QUERY_KEYS = {
  taxList: (params) => ['taxRevenue', 'taxList', params],
  cadastralResi: (params) => ['taxRevenue', 'cadastralResi', params],
  gisCatalog: () => ['taxRevenue', 'gisCatalog'],
  ddssDashboard: () => ['taxRevenue', 'ddssDashboard'],
  paymentVerification: (params) => ['taxRevenue', 'paymentVerification', params],
}

/**
 * Hook for Tax Assessment Register List
 * Supports status filter, search, pagination
 */
export function useTaxList(params = {}) {
  const queryKey = TAX_REVENUE_QUERY_KEYS.taxList(params)

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => taxRevenueApi.fetchTaxList(params),
    staleTime: 30000,
    gcTime: 60000,
    placeholderData: (previousData) => previousData,
    enabled: params.enabled !== false,
  })

  return {
    taxList: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    // Computed helpers
    results: data?.results || [],
    pagination: data?.pagination || { page: 1, page_size: 50, total_items: 0, total_pages: 0, has_next: false, has_previous: false },
    summary: data?.summary || { total_properties: 0, paid_count: 0, unpaid_count: 0, total_tax_collected: 0, collection_rate_pct: 0 },
    filterApplied: data?.filter_applied || params.status || 'all',
    searchQuery: data?.search_query || params.search || '',
  }
}

/**
 * Hook for Cadastral Residential GeoJSON Layer
 */
export function useCadastralResi(params = {}) {
  const queryKey = TAX_REVENUE_QUERY_KEYS.cadastralResi(params)

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => taxRevenueApi.fetchCadastralResi(params),
    staleTime: 60000,
    gcTime: 120000,
    placeholderData: (previousData) => previousData,
  })

  return {
    cadastralData: data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    features: data?.features || [],
    featureCount: data?.feature_count || data?.features?.length || 0,
    layerName: data?.layer_name || 'data_resi',
    geometryType: data?.geometry_type || 'MultiPolygon',
  }
}

/**
 * Hook for GIS Layer Catalog (sidebar accordion)
 */
export function useGisCatalog() {
  const queryKey = TAX_REVENUE_QUERY_KEYS.gisCatalog()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => taxRevenueApi.fetchGisCatalog(),
    staleTime: 120000,
    gcTime: 300000,
  })

  return {
    catalog: data,
    isLoading,
    isError,
    error,
    refetch,
    categories: data?.categories || {},
    totalLayers: data?.total_layers || 0,
  }
}

/**
 * Hook for DM Dashboard Data
 */
export function useDdssDashboard() {
  const queryKey = TAX_REVENUE_QUERY_KEYS.ddssDashboard()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => taxRevenueApi.fetchDdssDashboard(),
    staleTime: 60000,
    gcTime: 120000,
  })

  return {
    dashboard: data,
    isLoading,
    isError,
    error,
    refetch,
    kpis: data?.top_kpis || {},
    healthSnapshot: data?.health_snapshot || {},
    priorities: data?.priorities || [],
  }
}

/**
 * Mutation for Tax Payment
 */
export function useTaxPayment() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload) => taxRevenueApi.submitTaxPayment(payload),
    onSuccess: (response) => {
      // Invalidate and refetch tax list and cadastral data
      queryClient.invalidateQueries({ queryKey: ['taxRevenue', 'taxList'] })
      queryClient.invalidateQueries({ queryKey: ['taxRevenue', 'cadastralResi'] })
      return response
    },
    onError: (error) => {
      console.error('[TaxRevenue] Payment failed:', error)
    },
  })

  return {
    payTax: mutation.mutate,
    payTaxAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

/**
 * Mutation for Payment Verification
 */
export function usePaymentVerification() {
  const mutation = useMutation({
    mutationFn: (params) => taxRevenueApi.verifyTaxPayment(params),
  })

  return {
    verifyPayment: mutation.mutate,
    verifyPaymentAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

/**
 * Mutation for Spatial Query
 */
export function useSpatialQuery() {
  const mutation = useMutation({
    mutationFn: (payload) => taxRevenueApi.executeSpatialQuery(payload),
  })

  return {
    executeQuery: mutation.mutate,
    executeQueryAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

/**
 * Mutation for Geotag Verification
 */
export function useGeotagVerification() {
  const mutation = useMutation({
    mutationFn: (payload) => taxRevenueApi.verifyGeotag(payload),
  })

  return {
    verifyGeotag: mutation.mutate,
    verifyGeotagAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}

/**
 * Mutation for Citizen Feedback
 */
export function useCitizenFeedback() {
  const mutation = useMutation({
    mutationFn: (payload) => taxRevenueApi.submitFeedback(payload),
  })

  return {
    submitFeedback: mutation.mutate,
    submitFeedbackAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}
