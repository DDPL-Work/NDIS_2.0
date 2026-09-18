// Revenue & Property Intelligence — Properties Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propertyApi } from '../api'
import { propertyKeys } from '../constants/queryKeys'

export function useProperties(filters = {}) {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: () => propertyApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useProperty(id, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertyApi.get(id),
    enabled: enabled && !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertySearch(query, params = {}) {
  return useQuery({
    queryKey: propertyKeys.search(query),
    queryFn: () => propertyApi.search(query, params),
    enabled: !!query && query.length >= 2,
    staleTime: 15000,
    retry: 1,
  })
}

export function usePropertiesByLocation(blockId, wardId, villageId, params = {}) {
  return useQuery({
    queryKey: propertyKeys.byLocation(blockId, wardId, villageId),
    queryFn: () => propertyApi.getByLocation(blockId, wardId, villageId, params),
    enabled: !!blockId,
    staleTime: 30000,
    retry: 1,
  })
}

export function usePropertyGIS(filters = {}) {
  return useQuery({
    queryKey: propertyKeys.gis(filters),
    queryFn: () => propertyApi.getGisData(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyAssessment(propertyId) {
  return useQuery({
    queryKey: propertyKeys.assessment(propertyId),
    queryFn: () => propertyApi.getAssessment(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyTaxHistory(propertyId, params = {}) {
  return useQuery({
    queryKey: propertyKeys.taxHistory(propertyId),
    queryFn: () => propertyApi.getTaxHistory(propertyId, params),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyNotices(propertyId, params = {}) {
  return useQuery({
    queryKey: propertyKeys.notices(propertyId),
    queryFn: () => propertyApi.getNotices(propertyId, params),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyInspections(propertyId, params = {}) {
  return useQuery({
    queryKey: propertyKeys.inspections(propertyId),
    queryFn: () => propertyApi.getInspections(propertyId, params),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePropertyAudit(propertyId, params = {}) {
  return useQuery({
    queryKey: propertyKeys.audit(propertyId),
    queryFn: () => propertyApi.getAudit(propertyId, params),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

// Mutations
export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: propertyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => propertyApi.update(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.list() })
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: propertyApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function usePropertyDetail(propertyId) {
  const propQuery = useProperty(propertyId)
  const assessmentQuery = usePropertyAssessment(propertyId)
  const noticesQuery = usePropertyNotices(propertyId)
  const inspectionsQuery = usePropertyInspections(propertyId)
  const taxHistoryQuery = usePropertyTaxHistory(propertyId)

  return {
    property: propQuery.data,
    assessment: assessmentQuery.data,
    notices: noticesQuery.data || [],
    inspections: inspectionsQuery.data || [],
    taxHistory: taxHistoryQuery.data || [],
    isLoading: propQuery.isLoading || assessmentQuery.isLoading,
    isError: propQuery.isError,
    error: propQuery.error
  }
}