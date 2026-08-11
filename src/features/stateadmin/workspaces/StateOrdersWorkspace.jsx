// Government Orders & Document Repository workspace.
//   all / circulars / notifications / financial / administrative → order registers
//   documents → document repository with versioning + verification
// Orders are published, versioned and verified through the governance store;
// every action lands in the immutable audit trail.
import { useMemo, useState } from 'react'
import { FileSignature, ScrollText, MailWarning, Megaphone, Banknote, Briefcase, FileText, Plus, Eye, CheckCircle2, RotateCcw, Send, Upload } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { useGovernanceStore } from '../store/stateGovernanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, SelectField, TextAreaField, formatAmount, FilterStrip, SummaryPill } from '../components/StateUI'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, FINANCIAL_YEARS } from '../../../config/stateConstants'

const META = {
  all: { title: 'Government Orders', eyebrow: 'STATE ADMIN · GOVERNMENT ORDERS · REGISTER', icon: ScrollText, description: 'Central register of Government Orders, sanctions, approvals, circulars and notifications.' },
  circulars: { title: 'Circulars', eyebrow: 'STATE ADMIN · GOVERNMENT ORDERS · CIRCULARS', icon: MailWarning, description: 'Circulars issued by departments to field formations.' },
  notifications: { title: 'Notifications', eyebrow: 'STATE ADMIN · GOVERNMENT ORDERS · NOTIFICATIONS', icon: Megaphone, description: 'Gazette-style notifications, delegation of powers and administrative notices.' },
  financial: { title: 'Financial Orders', eyebrow: 'STATE ADMIN · GOVERNMENT ORDERS · FINANCIAL', icon: Banknote, description: 'Budget, sanction, release and re-appropriation orders that back every financial number.' },
  administrative: { title: 'Administrative Orders', eyebrow: 'STATE ADMIN · GOVERNMENT ORDERS · ADMINISTRATIVE', icon: Briefcase, description: 'Administrative approvals, department orders and policy documents.' },
  documents: { title: 'Document Repository', eyebrow: 'STATE ADMIN · GOVERNMENT ORDERS · DOCUMENTS', icon: FileText, description: 'Versioned document repository with digital signature and verification status.' },
}

const FILTER_TYPES = {
  all: null,
  circulars: ['circular'],
  notifications: ['notification'],
  financial: ['state_budget', 'financial_sanction', 'fund_release_order', 'reappropriation_order'],
  administrative: ['administrative_approval', 'government_order', 'department_order', 'policy'],
}

export default function StateOrdersWorkspace({ mode = 'all' }) {
  const meta = META[mode]
  return (
    <div className="px-6 pb-10">
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />
      <OrdersView mode={mode} />
    </div>
  )
}

function OrdersView({ mode }) {
  if (mode === 'documents') return <DocumentsView />
  return <OrderRegisterView mode={mode} />
}

function OrderRegisterView({ mode }) {
  const store = useGovernanceStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canManage = useStatePermission('order.manage')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [publishOpen, setPublishOpen] = useState(false)
  const [viewFor, setViewFor] = useState(null)
  const [form, setForm] = useState({})

  const allowedTypes = FILTER_TYPES[mode]
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.orders.filter((o) => {
      if (allowedTypes && !allowedTypes.includes(o.type)) return false
      if (type !== 'all' && o.type !== type) return false
      if (q && !`${o.orderNumber} ${o.summary} ${o.docId}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [store.orders, allowedTypes, type, query])

  const deptName = (id) => (id ? master.departments.find((d) => d.id === id)?.name || id : '—')
  const schemeName = (id) => (id ? master.schemes.find((s) => s.id === id)?.name || id : '—')

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setPublishOpen(false) } catch (e) { pushToast(e.message, 'error') }
  }

  const typesInScope = DOCUMENT_TYPES.filter((t) => !allowedTypes || allowedTypes.includes(t.value))

  return (
    <>
      <FilterStrip className="mb-5">
        {!allowedTypes && (
          <SelectField label="Document Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All Types' }, ...DOCUMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
        )}
        <div className="relative">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order number / summary" className="input-field px-3 py-2 text-[13px]" />
        </div>
        {canManage && <Button icon={Plus} onClick={() => setPublishOpen(true)}>Register Order</Button>}
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Orders (scope)" value={rows.length} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Published" value={rows.filter((r) => r.status === 'published').length} tone="leaf" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Verified" value={rows.filter((r) => r.verificationStatus === 'verified').length} tone="saffron" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Order Register" subtitle={`${rows.length} records`} icon={FileSignature} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={FileSignature} title="No orders found" description="No orders match the current scope — register one to begin the register." />
          ) : (
            <DataTable
              columns={[
                { key: 'orderNumber', label: 'Order Number', render: (r) => <span className="font-mono text-[12px]">{r.orderNumber}</span> },
                { key: 'type', label: 'Type', render: (r) => <Badge tone="neutral">{DOCUMENT_TYPE_LABELS[r.type] || r.type}</Badge> },
                { key: 'orderDate', label: 'Order Date', render: (r) => formatDateOnly(r.orderDate) },
                { key: 'departmentId', label: 'Department', render: (r) => deptName(r.departmentId) },
                { key: 'schemeId', label: 'Scheme', render: (r) => <span className="text-[12.5px]">{schemeName(r.schemeId)}</span> },
                { key: 'amount', label: 'Amount', render: (r) => (r.amount ? formatAmount(r.amount) : '—') },
                { key: 'verificationStatus', label: 'Verification', render: (r) => <Badge tone={r.verificationStatus === 'verified' ? 'positive' : 'warning'}>{r.verificationStatus}</Badge> },
                { key: 'digitalSignatureStatus', label: 'Signature', render: (r) => <Badge tone={r.digitalSignatureStatus === 'signed' ? 'positive' : 'neutral'}>{r.digitalSignatureStatus}</Badge> },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'published' ? 'positive' : 'neutral'}>{r.status}</Badge> },
                { key: '_', label: '', render: (r) => (
                  <span className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" icon={Eye} onClick={() => setViewFor(r)}>View</Button>
                    {canManage && r.status === 'draft' && <Button variant="ghost" size="sm" icon={Send} onClick={() => run(() => store.updateOrderStatus(r.id, 'published', actor), `${r.orderNumber} published.`)}>Publish</Button>}
                  </span>
                ) },
              ]}
              rows={rows}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>

      {publishOpen && (
        <Modal open onClose={() => setPublishOpen(false)} width="max-w-2xl" title="Register Government Order" footer={<><Button variant="ghost" onClick={() => setPublishOpen(false)}>Cancel</Button><Button onClick={() => run(() => {
          if (!form.orderNumber) throw new Error('Order number is required.')
          store.publishOrder({
            type: form.type || 'government_order', orderNumber: form.orderNumber.trim(),
            orderDate: form.orderDate || new Date().toISOString().slice(0, 10), fy: form.fy || FINANCIAL_YEARS[2].code,
            departmentId: form.departmentId || null, districtId: form.districtId || null, schemeId: form.schemeId || null,
            amount: form.amountCr ? crFromLakh(form.amountCr) : null,
            issuedBy: form.issuedBy || 'State Administration', effectiveDate: form.effectiveDate || form.orderDate,
            summary: form.summary || '', fileName: form.fileName || null, actor,
          })
        }, `Order ${form.orderNumber} registered (draft).`)}>Register</Button></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Document Type" value={form.type || ''} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={typesInScope.map((t) => ({ value: t.value, label: t.label }))} />
            <Field label="Order Number" value={form.orderNumber || ''} onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))} placeholder="GO-2026-XXXX" />
            <Field label="Order Date" type="date" value={form.orderDate || ''} onChange={(e) => setForm((f) => ({ ...f, orderDate: e.target.value }))} />
            <Field label="Effective Date" type="date" value={form.effectiveDate || ''} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
            <SelectField label="Financial Year" value={form.fy || ''} onChange={(v) => setForm((f) => ({ ...f, fy: v }))} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
            <SelectField label="Department (optional)" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={[{ value: '', label: 'None' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
            <SelectField label="Scheme (optional)" value={form.schemeId || ''} onChange={(v) => setForm((f) => ({ ...f, schemeId: v }))} options={[{ value: '', label: 'None' }, ...master.schemes.map((s) => ({ value: s.id, label: s.name }))]} />
            <Field label="Amount (₹ Crore, optional)" type="number" step="0.01" min="0" value={form.amountCr || ''} onChange={(e) => setForm((f) => ({ ...f, amountCr: e.target.value }))} />
            <Field label="Issued By" value={form.issuedBy || ''} onChange={(e) => setForm((f) => ({ ...f, issuedBy: e.target.value }))} placeholder="Department of Finance" />
            <Field label="File Name (optional)" value={form.fileName || ''} onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))} placeholder="order.pdf" />
          </div>
          <TextAreaField className="mt-3" label="Summary" value={form.summary || ''} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
        </Modal>
      )}

      {viewFor && (
        <Modal open onClose={() => setViewFor(null)} width="max-w-xl" title={`${viewFor.orderNumber}`} footer={
          <div className="flex items-center gap-2 justify-end">
            {canManage && viewFor.status === 'draft' && <Button size="sm" icon={Send} onClick={async () => { store.updateOrderStatus(viewFor.id, 'published', actor); pushToast(`${viewFor.orderNumber} published.`, 'success'); setViewFor(null) }}>Publish</Button>}
            {canManage && viewFor.status === 'published' && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => { store.updateOrderStatus(viewFor.id, 'draft', actor); pushToast('Moved back to draft.', 'success'); setViewFor(null) }}>Unpublish</Button>}
            {canManage && <Button size="sm" variant="ghost" icon={CheckCircle2} onClick={() => { store.toggleVerification(viewFor.id, actor); pushToast(viewFor.verificationStatus === 'verified' ? 'Verification pending.' : 'Document verified.', 'success'); setViewFor(null) }}>{viewFor.verificationStatus === 'verified' ? 'Unverify' : 'Verify'}</Button>}
            <Button size="sm" icon={Upload} onClick={() => { store.updateDocumentVersion(viewFor.id, { summary: viewFor.summary, fileName: viewFor.file }, actor); pushToast('New version recorded.', 'success'); setViewFor(null) }}>New Version</Button>
            <Button size="sm" variant="ghost" onClick={() => setViewFor(null)}>Close</Button>
          </div>
        }>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Type</span>{DOCUMENT_TYPE_LABELS[viewFor.type] || viewFor.type}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Document ID</span><span className="font-mono">{viewFor.docId}</span></p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Issued By</span>{viewFor.issuedBy}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Order Date</span>{formatDateOnly(viewFor.orderDate)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Effective</span>{formatDateOnly(viewFor.effectiveDate)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Amount</span>{viewFor.amount ? formatAmount(viewFor.amount) : '—'}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Version</span>{viewFor.version}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">File</span>{viewFor.file ? <span className="font-mono text-[12px]">{viewFor.file}</span> : '—'}</p>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-700">{viewFor.summary}</p>
        </Modal>
      )}
    </>
  )
}

function DocumentsView() {
  const store = useGovernanceStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canManage = useStatePermission('order.manage')
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.documents.filter((d) => {
      if (type !== 'all' && d.type !== type) return false
      if (q && !`${d.docId} ${d.orderNumber} ${d.summary}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [store.documents, type, query])

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Document Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All Types' }, ...DOCUMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
        <div className="relative">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search document" className="input-field px-3 py-2 text-[13px]" />
        </div>
      </FilterStrip>
      <Card>
        <CardHeader title="Document Repository" subtitle={`${rows.length} documents · versioned & verifiable`} icon={FileText} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={FileText} title="No documents found" />
          ) : (
            <DataTable
              columns={[
                { key: 'docId', label: 'Document ID', render: (r) => <span className="font-mono text-[11.5px]">{r.docId}</span> },
                { key: 'orderNumber', label: 'Order Number', render: (r) => <span className="font-mono text-[12px]">{r.orderNumber}</span> },
                { key: 'type', label: 'Type', render: (r) => <Badge tone="neutral">{DOCUMENT_TYPE_LABELS[r.type] || r.type}</Badge> },
                { key: 'summary', label: 'Summary', render: (r) => <span className="text-[12.5px] text-ink-600 max-w-[320px] truncate block">{r.summary}</span> },
                { key: 'version', label: 'Version' },
                { key: 'verificationStatus', label: 'Verification', render: (r) => <Badge tone={r.verificationStatus === 'verified' ? 'positive' : 'warning'}>{r.verificationStatus}</Badge> },
                { key: 'digitalSignatureStatus', label: 'Signature', render: (r) => <Badge tone={r.digitalSignatureStatus === 'signed' ? 'positive' : 'neutral'}>{r.digitalSignatureStatus}</Badge> },
                { key: '_', label: '', render: (r) => canManage && (
                  <span className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" icon={CheckCircle2} onClick={() => { store.toggleVerification(r.id, actor); pushToast(r.verificationStatus === 'verified' ? 'Verification pending.' : 'Document verified.', 'success') }}>{r.verificationStatus === 'verified' ? 'Unverify' : 'Verify'}</Button>
                    <Button variant="ghost" size="sm" icon={Upload} onClick={() => { store.updateDocumentVersion(r.id, { summary: r.summary, fileName: r.file }, actor); pushToast('New version recorded.', 'success') }}>Version</Button>
                  </span>
                ) },
              ]}
              rows={rows}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>
    </>
  )
}

function crFromLakh(input) {
  const value = Number(input)
  if (!input || Number.isNaN(value)) return 0
  return Math.round(value * 10000000)
}

function formatDateOnly(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}