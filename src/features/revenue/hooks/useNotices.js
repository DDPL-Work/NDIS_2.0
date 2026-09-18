// Revenue & Property Intelligence — Notices Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noticeApi } from '../api'
import { noticeKeys, propertyKeys } from '../constants/queryKeys'

export function useNotices(filters = {}) {
  return useQuery({
    queryKey: noticeKeys.list(filters),
    queryFn: () => noticeApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function useNotice(id) {
  return useQuery({
    queryKey: noticeKeys.detail(id),
    queryFn: () => noticeApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function useNoticesByProperty(propertyId) {
  return useQuery({
    queryKey: noticeKeys.byProperty(propertyId),
    queryFn: () => noticeApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

// Mutations
export function useIssueNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: noticeApi.issue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useMarkNoticeServed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, servedBy, servedDate }) => noticeApi.markServed(id, servedBy, servedDate),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: noticeKeys.list() })
    },
  })
}

export function useRecordNoticeResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, responseDetails }) => noticeApi.recordResponse(id, responseDetails),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: noticeKeys.list() })
    },
  })
}