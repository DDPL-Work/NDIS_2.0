// TanStack Query hook for GET /api/gis/layers/data_resi/
import { useQuery } from '@tanstack/react-query'
import { cadastralGisApi } from '../api/cadastralGisApi.js'
import { taxKeys } from '../constants/queryKeys.js'

export function useCadastralMap(params = {}, options = {}) {
  return useQuery({
    queryKey: taxKeys.cadastral(params),
    queryFn: () => cadastralGisApi.fetchCadastralLayer(params),
    staleTime: 5 * 60 * 1000, // 5 minutes cache for GIS layers
    cacheTime: 10 * 60 * 1000,
    ...options
  })
}
