// Governance store — Government Orders & document repository.
// One-directional dependency: this store may push notifications and audit
// records into the finance store (never the reverse), avoiding cycles.
import { create } from 'zustand'
import { useStateFinanceStore } from './stateFinanceStore'
import { SEED_GOVERNMENT_ORDERS, SEED_DOLOCS } from './seed/stateSeedData'
import { DOCUMENT_TYPE_LABELS } from '../../../config/stateConstants'

export const useGovernanceStore = create((set, get) => ({
  orders: SEED_GOVERNMENT_ORDERS,
  documents: SEED_DOLOCS,

  publishOrder({ type, orderNumber, orderDate, fy, departmentId = null, districtId = null, schemeId = null, amount = null, issuedBy, effectiveDate, summary, fileName = null, actor = {} }) {
    if (!orderNumber) throw new Error('Order number is required.')
    if (get().orders.some((o) => o.orderNumber === orderNumber)) throw new Error(`Order ${orderNumber} already registered.`)
    const now = new Date().toISOString()
    const order = {
      id: `GO-REG-${Date.now().toString(36)}`,
      docId: `DOC-GO-${Date.now().toString(36).toUpperCase()}`,
      type, orderNumber, orderDate, fy, departmentId, districtId, schemeId, amount,
      issuedBy: issuedBy || 'State Administration',
      effectiveDate: effectiveDate || orderDate,
      summary,
      file: fileName,
      verificationStatus: 'pending',
      digitalSignatureStatus: 'unsigned',
      version: 1,
      status: 'draft',
      createdBy: actor.name || actor.role || 'Unknown',
      createdAt: now,
    }
    set((s) => ({ orders: [order, ...s.orders], documents: [{ ...order, id: order.id }, ...s.documents] }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'ORDER_REGISTERED', entity: 'government_order', entityId: order.orderNumber, newValue: order, reason: summary })
    return order
  },

  updateOrderStatus(id, status, actor = {}) {
    const order = get().orders.find((o) => o.id === id)
    if (!order) throw new Error('Order not found.')
    const updated = { ...order, status, verificationStatus: status === 'published' ? 'verified' : order.verificationStatus }
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
      documents: s.documents.map((d) => (d.id === id ? updated : d)),
    }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'ORDER_STATUS_CHANGED', entity: 'government_order', entityId: order.orderNumber, oldValue: order.status, newValue: status })
    if (status === 'published') {
      useStateFinanceStore.getState().addNotification({ type: 'order_published', message: `${DOCUMENT_TYPE_LABELS[order.type] || 'Order'} ${order.orderNumber} published.`, departmentId: order.departmentId })
    }
  },

  updateDocumentVersion(id, { summary, fileName }, actor = {}) {
    const doc = get().documents.find((d) => d.id === id)
    if (!doc) throw new Error('Document not found.')
    const updated = { ...doc, summary: summary || doc.summary, file: fileName || doc.file, version: doc.version + 1, verificationStatus: 'pending' }
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? updated : d)), orders: s.orders.map((o) => (o.id === id ? updated : o)) }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'DOCUMENT_VERSIONED', entity: 'document', entityId: doc.docId, oldValue: doc.version, newValue: updated.version })
  },

  toggleVerification(id, actor = {}) {
    const doc = get().documents.find((d) => d.id === id)
    if (!doc) throw new Error('Document not found.')
    const status = doc.verificationStatus === 'verified' ? 'pending' : 'verified'
    const updated = { ...doc, verificationStatus: status }
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? updated : d)), orders: s.orders.map((o) => (o.id === id ? updated : o)) }))
    useStateFinanceStore.getState().writeAudit({ actor, action: 'DOCUMENT_VERIFICATION', entity: 'document', entityId: doc.docId, oldValue: doc.verificationStatus, newValue: status })
  },
}))

export const governanceSelectors = {
  ordersByType: (type) => (state) => (type === 'all' ? state.orders : state.orders.filter((o) => o.type === type)),
  documentsByType: (type) => (state) => (type === 'all' ? state.documents : state.documents.filter((d) => d.type === type)),
}