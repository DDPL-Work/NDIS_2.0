// Revenue & Property Intelligence — Payments Hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from '../api'
import { paymentKeys, demandKeys, propertyKeys } from '../constants/queryKeys'

export function usePayments(filters = {}) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentApi.list(filters),
    staleTime: 30000,
    retry: 1,
  })
}

export function usePayment(id) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentApi.get(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePaymentsByProperty(propertyId) {
  return useQuery({
    queryKey: paymentKeys.byProperty(propertyId),
    queryFn: () => paymentApi.getByProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePaymentsByDemand(demandId) {
  return useQuery({
    queryKey: paymentKeys.byDemand(demandId),
    queryFn: () => paymentApi.getByDemand(demandId),
    enabled: !!demandId,
    staleTime: 60000,
    retry: 1,
  })
}

export function usePaymentHistory(filters = {}) {
  return useQuery({
    queryKey: paymentKeys.history(filters),
    queryFn: () => paymentApi.getHistory(filters),
    staleTime: 60000,
    retry: 1,
  })
}

export function useReceipt(paymentId) {
  return useQuery({
    queryKey: paymentKeys.receipt(paymentId),
    queryFn: () => paymentApi.getReceipt(paymentId),
    enabled: !!paymentId,
    staleTime: 60000,
    retry: 1,
  })
}

export function useReceiptByNumber(receiptNumber) {
  return useQuery({
    queryKey: ['revenue', 'receipts', 'number', receiptNumber],
    queryFn: () => paymentApi.getReceiptByNumber(receiptNumber),
    enabled: !!receiptNumber,
    staleTime: 60000,
    retry: 1,
  })
}

// Mutations
export function useInitiatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: paymentApi.initiate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: demandKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useConfirmPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: paymentApi.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: demandKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useVerifyPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: paymentApi.verify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: demandKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, reason }) => paymentApi.refund(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
      queryClient.invalidateQueries({ queryKey: demandKeys.all })
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}

export function useGenerateReceipt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: paymentApi.generateReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}

export function useDownloadReceiptPdf() {
  return useMutation({
    mutationFn: paymentApi.downloadReceiptPdf,
  })
}