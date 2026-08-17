// Workflow & Authority workspace — delegation of financial powers.
//   Financial Authority → editable authority matrix (limits enforced by authorityService)
//   Workflow Definitions → configurable approval workflow steps (evaluated by approvalService)
// Governs the numbers elsewhere: reductions/C4 all pass authority checks server-side (mock).
import { useState } from 'react'
import { ShieldCheck, Workflow, Pencil, AlertTriangle, Plus, Trash2, ArrowRight } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Tabs from '../../../components/ui/Tabs'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStatePermission } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, SelectField, TextAreaField, SummaryPill } from '../components/StateUI'
import { APPROVAL_ACTION_LABELS } from '../../../config/stateConstants'

const ROLE_OPTIONS = [
  { value: 'dm', label: 'District Magistrate' },
  { value: 'commissioner', label: 'Commissioner / Divisional' },
  { value: 'state_dept_admin', label: 'State Department (Sec/HoD)' },
  { value: 'state_finance_admin', label: 'Finance Authority' },
  { value: 'state_admin', label: 'State Admin' },
  { value: 'state_monitoring_officer', label: 'Monitoring Officer' },
  { value: 'state_gis_admin', label: 'GIS Admin' },
]

const AUTHORITY_TYPES = [
  { value: 'administrative', label: 'Administrative' },
  { value: 'department', label: 'Department' },
  { value: 'finance', label: 'Finance' },
  { value: 'state', label: 'State' },
]

const LIMIT_FIELDS = [
  { key: 'maxFinancialLimit', label: 'Max Financial Limit' },
  { key: 'projectApprovalLimit', label: 'Project Approval Limit' },
  { key: 'sanctionLimit', label: 'Sanction Limit' },
  { key: 'releaseLimit', label: 'Release Limit' },
  { key: 'reappropriationLimit', label: 'Re-appropriation Limit' },
]

export default function StateAuthorityWorkspace() {
  const [tab, setTab] = useState('authority')
  return (
    <div className="px-6 pb-10">
      <PageHeader eyebrow="STATE ADMIN · WORKFLOW & AUTHORITY" title="Workflow & Authority" description="Delegation of financial powers and configurable approval workflows that sit behind every sanction, release and proposal." />
      <Tabs tabs={[{ value: 'authority', label: 'Financial Authority' }, { value: 'workflows', label: 'Workflow Definitions' }]} active={tab} onChange={setTab} />
      {tab === 'authority' ? <AuthorityMatrix /> : <WorkflowList />}
    </div>
  )
}

function AuthorityMatrix() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const pushToast = useUiStore((s) => s.pushToast)
  const canManage = useStatePermission('authority.manage')
  const [editFor, setEditFor] = useState(null)
  const [form, setForm] = useState(null)

  const fmtCr = (n) => `${(Number(n) / 10000000).toFixed(2)} Cr`
  const deptName = (id) => (id ? master.departments.find((d) => d.id === id)?.name || id : 'All Departments')
  const placeholders = store.authorityMatrix.filter((a) => a.isPlaceholder)

  const openEdit = (row) => {
    setEditFor(row)
    setForm({
      authorityId: row.authorityId, authorityType: row.authorityType, role: row.role, title: row.title,
      departmentId: row.departmentId || '', effectiveFrom: row.effectiveFrom, effectiveTo: row.effectiveTo || '',
      escalationAuthority: row.escalationAuthority || '', supportingOrder: row.supportingOrder || '',
      status: row.status, isPlaceholder: !!row.isPlaceholder, placeholderNote: row.placeholderNote || '',
      maxFinancialLimit: (row.maxFinancialLimit || 0) / 10000000, projectApprovalLimit: (row.projectApprovalLimit || 0) / 10000000,
      sanctionLimit: (row.sanctionLimit || 0) / 10000000, releaseLimit: (row.releaseLimit || 0) / 10000000,
      reappropriationLimit: (row.reappropriationLimit || 0) / 10000000,
    })
  }

  const save = () => {
    if (!form.authorityId || !form.title) throw new Error('Authority ID and title are required.')
    const toCr = (v) => Math.round(Number(v) * 10000000)
    store.upsertAuthority({
      authorityId: form.authorityId, authorityType: form.authorityType || 'administrative', role: form.role || 'state_admin',
      title: form.title, departmentId: form.departmentId || null,
      maxFinancialLimit: toCr(form.maxFinancialLimit), projectApprovalLimit: toCr(form.projectApprovalLimit),
      sanctionLimit: toCr(form.sanctionLimit), releaseLimit: toCr(form.releaseLimit), reappropriationLimit: toCr(form.reappropriationLimit),
      effectiveFrom: form.effectiveFrom || new Date().toISOString().slice(0, 10), effectiveTo: form.effectiveTo || null,
      applicableSchemeIds: [], applicableDistrictIds: [], escalationAuthority: form.escalationAuthority || 'State Cabinet',
      status: form.status || 'active', supportingOrder: form.supportingOrder || null,
      isPlaceholder: form.isPlaceholder, placeholderNote: form.isPlaceholder ? form.placeholderNote || 'Configurable placeholder.' : null,
    })
    pushToast(`Authority ${form.authorityId} saved.`, 'success')
    setEditFor(null)
  }

  return (
    <>
      {placeholders.length > 0 && (
        <div className="mb-5 flex gap-2.5 items-start rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>{placeholders.length} authority record(s) are <b>configurable placeholders</b> — illustrative limits for UI/testing, not derived from any government document. Edit and publish the supported GO to make them operative.</p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Authority Records" value={store.authorityMatrix.length} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Active" value={store.authorityMatrix.filter((a) => a.status === 'active').length} tone="leaf" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Placeholder" value={placeholders.length} tone="saffron" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Delegation of Financial Powers" subtitle="Enforced by authorityService on every sanction · release · re-appropriation · project" icon={ShieldCheck} />
        <CardBody className="p-0">
          {store.authorityMatrix.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No authority records" />
          ) : (
            <DataTable
              columns={[
                { key: 'authorityId', label: 'Authority', render: (r) => <span className="font-mono text-[11.5px]">{r.authorityId}</span> },
                { key: 'title', label: 'Title / Role', render: (r) => <span className="text-[12.5px] font-medium">{r.title}</span> },
                { key: 'authorityType', label: 'Type', render: (r) => <Badge tone={r.authorityType === 'finance' ? 'positive' : 'neutral'}>{r.authorityType}</Badge> },
                { key: 'departmentId', label: 'Scope', render: (r) => <span className="text-[12px]">{deptName(r.departmentId)}</span>, hideOn: 'md' },
                { key: 'sanctionLimit', label: 'Sanction', render: (r) => fmtCr(r.sanctionLimit) },
                { key: 'releaseLimit', label: 'Release', render: (r) => fmtCr(r.releaseLimit) },
                { key: 'reappropriationLimit', label: 'Re-App', render: (r) => fmtCr(r.reappropriationLimit) },
                { key: 'escalationAuthority', label: 'Escalates To', render: (r) => <span className="text-[12px]">{r.escalationAuthority || '—'}</span>, hideOn: 'md' },
                { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'warning'}>{r.status}</Badge> },
                { key: '_', label: '', render: (r) => canManage && (
                  <span className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(r)}>Edit</Button>
                  </span>
                ) },
              ]}
              rows={store.authorityMatrix}
              keyField="authorityId"
            />
          )}
        </CardBody>
      </Card>

      {editFor && form && (
        <Modal open onClose={() => setEditFor(null)} width="max-w-3xl" title={`Edit Authority — ${editFor.authorityId}`} footer={
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditFor(null)}>Cancel</Button>
            <Button onClick={save}>Save Authority</Button>
          </div>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Authority ID" value={form.authorityId} onChange={(e) => setForm((f) => ({ ...f, authorityId: e.target.value }))} />
            <Field label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <SelectField label="Authority Type" value={form.authorityType} onChange={(v) => setForm((f) => ({ ...f, authorityType: v }))} options={AUTHORITY_TYPES} />
            <SelectField label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} options={ROLE_OPTIONS} />
            <SelectField label="Department Scope" value={form.departmentId} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={[{ value: '', label: 'All Departments' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
            <Field label="Effective From" type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} />
            <Field label="Effective To (optional)" type="date" value={form.effectiveTo} onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))} />
            <Field label="Escalation Authority" value={form.escalationAuthority} onChange={(e) => setForm((f) => ({ ...f, escalationAuthority: e.target.value }))} />
            <Field label="Supporting Order / GO" value={form.supportingOrder} onChange={(e) => setForm((f) => ({ ...f, supportingOrder: e.target.value }))} />
            <SelectField label="Status" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={[{ value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} />
          </div>
          <h3 className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Limits (₹ Crore)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {LIMIT_FIELDS.map((l) => (
              <Field key={l.key} label={l.label} type="number" step="0.01" min="0" value={form[l.key]} onChange={(e) => setForm((f) => ({ ...f, [l.key]: e.target.value }))} />
            ))}
          </div>
          <label className="mt-5 flex items-center gap-2 text-[13px] text-ink-700">
            <input type="checkbox" className="accent-ink-900" checked={form.isPlaceholder} onChange={(e) => setForm((f) => ({ ...f, isPlaceholder: e.target.checked }))} />
            Mark as configurable placeholder
          </label>
          {form.isPlaceholder && <TextAreaField className="mt-3" label="Placeholder note" value={form.placeholderNote} onChange={(e) => setForm((f) => ({ ...f, placeholderNote: e.target.value }))} />}
        </Modal>
      )}
    </>
  )
}

function WorkflowList() {
  const store = useStateFinanceStore()
  const pushToast = useUiStore((s) => s.pushToast)
  const canManage = useStatePermission('authority.manage')
  const [editFor, setEditFor] = useState(null)
  const [steps, setSteps] = useState([])

  const openEdit = (w) => {
    setEditFor(w)
    setSteps((w.steps || []).map((s) => ({ ...s })))
  }

  const save = () => {
    if (!steps.length) throw new Error('At least one step is required.')
    store.upsertWorkflow({ ...editFor, steps: steps.map((s, i) => ({ ...s, step: i + 1 })) })
    pushToast(`Workflow ${editFor.name} updated.`, 'success')
    setEditFor(null)
  }

  const stepMeta = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label || role
  const actionMeta = (action) => APPROVAL_ACTION_LABELS[action] || action

  return (
    <Card>
      <CardHeader title="Workflow Definitions" subtitle="Ordered approval steps evaluated by approvalService for every entity" icon={Workflow} />
      <CardBody>
        {store.workflows.length === 0 ? (
          <EmptyState icon={Workflow} title="No workflow definitions" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {store.workflows.map((w) => (
              <div key={w.workflowId} className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-ink-900">{w.name}</p>
                    <p className="font-mono text-[11px] text-ink-400">{w.workflowId} · {w.entityType}</p>
                  </div>
                  <Badge tone={w.status === 'active' ? 'positive' : 'warning'}>{w.status}</Badge>
                </div>
                <p className="mb-3 text-[12px] leading-relaxed text-ink-600">{w.description}</p>
                <div className="mb-3 flex flex-wrap items-center gap-1">
                  {(w.steps || []).map((s) => (
                    <span key={s.step} className="flex items-center gap-1">
                      <span className="rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] text-ink-700">{s.label}</span>
                      {s.step < (w.steps || []).length && <ArrowRight size={12} className="text-ink-300" />}
                    </span>
                  ))}
                </div>
                {w.escaStep && (
                  <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
                    Escalation: {w.escaStep.condition} → <b>{w.escaStep.escalateTo}</b>
                  </p>
                )}
                {canManage && <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(w)}>Edit Steps</Button>}
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {editFor && (
        <Modal open onClose={() => setEditFor(null)} width="max-w-2xl" title={`Edit Workflow — ${editFor.name}`} footer={
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" onClick={() => setEditFor(null)}>Cancel</Button>
            <Button onClick={save}>Save Workflow</Button>
          </div>
        }>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-2 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                <span className="mt-2 h-5 w-5 shrink-0 rounded-full bg-ink-900 text-center text-[11px] font-semibold leading-5 text-white">{i + 1}</span>
                <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-2">
                  <SelectField label="Role" value={s.role || ''} onChange={(v) => setSteps((arr) => arr.map((x, xi) => (xi === i ? { ...x, role: v } : x)))} options={ROLE_OPTIONS} />
                  <SelectField label="Action" value={s.action || ''} onChange={(v) => setSteps((arr) => arr.map((x, xi) => (xi === i ? { ...x, action: v } : x)))} options={Object.entries(APPROVAL_ACTION_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                  <Field label="Step Label" value={s.label || ''} onChange={(e) => setSteps((arr) => arr.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)))} />
                </div>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setSteps((arr) => arr.filter((_, xi) => xi !== i))} className="!p-2 mt-6" aria-label="Remove step" />
              </div>
            ))}
            <Button variant="outline" size="sm" icon={Plus} onClick={() => setSteps((arr) => [...arr, { role: ROLE_OPTIONS[0].value, action: 'approve', label: `Step ${arr.length + 1}` }])}>Add Step</Button>
          </div>
        </Modal>
      )}
    </Card>
  )
}