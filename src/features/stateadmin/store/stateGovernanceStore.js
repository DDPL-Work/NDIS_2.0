// Governance store — Government Orders & document repository.
// BACKEND GAP: no documented endpoint exists for government orders or the
// document register (backend_next_guide §29–§31 expose reports only).  The
// collections stay empty and every mutation throws BackendCapabilityError so
// the screens surface the honest gap instead of simulating records.
import { create } from 'zustand'
import { BackendCapabilityError } from '../../../api/apiClient'

export const useGovernanceStore = create(() => ({
  orders: [],
  documents: [],

  publishOrder() { throw new BackendCapabilityError('government orders register') },
  updateOrderStatus() { throw new BackendCapabilityError('government orders register') },
  updateDocumentVersion() { throw new BackendCapabilityError('government document register') },
  toggleVerification() { throw new BackendCapabilityError('government document register') },
}))

export const governanceSelectors = {
  ordersByType: (type) => (state) => (type === 'all' ? state.orders : state.orders.filter((o) => o.type === type)),
  documentsByType: (type) => (state) => (type === 'all' ? state.documents : state.documents.filter((d) => d.type === type)),
}
