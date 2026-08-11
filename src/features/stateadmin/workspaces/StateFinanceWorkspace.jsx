// Finance execution workspaces:
//   sanctions       → Sanctions Register (create / approve / escalate)
//   releases        → Fund Releases (against approved sanctions)
//   reappropriation → Re-appropriation between budget heads
//   ledger          → Financial Ledger (immutable transaction trail)
// Every mutation runs the pure finance rules + authority checks and appends
// ledger + audit records inside the finance store.
import { useMemo, useState } from 'react'
import { FileCheck2, HandCoins, ArrowLeftRight, BookOpenText, Plus, ShieldCheck, ArrowUpRight, Search } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { sanctionPositions, statePosition } from '../selectors/financeSelectors'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, SelectField, TextAreaField, formatAmount, FilterStrip, SummaryPill } from '../components/StateUI'
import { FINANCIAL_YEARS } from '../../../config/stateConstants'

const META = {
  sanctions: { title: 'Sanctions Register', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · SANCTIONS', icon: FileCheck2, description: 'Financial sanctions against authorized budgets. Every sanction is created within the sanctioned balance and approved under delegated financial powers.' },
  releases: { title: 'Fund Releases', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · FUND RELEASES', icon: HandCoins, description: 'Release of funds against approved sanctions. A release can never exceed the un-released balance of its sanction.' },
  reappropriation: { title: 'Re-appropriation', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · RE-APPROPRIATION', icon: ArrowLeftRight, description: 'Movement of budget between heads within a financial year, supported by an order and approved within re-appropriation limits.' },
  ledger: { title: 'Financial Ledger', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · FINANCIAL LEDGER', icon: BookOpenText, description: 'Append-only transaction trail. Every record is immutable; all balances shown across the panel are derived from this ledger.' },
}

export default function StateFinanceWorkspace({ mode = 'sanctions' }) {
  const meta = META[mode]
  const Icon = meta.icon
  return (
    <div className="px-6 pb-10">
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />
      <ViewForMode mode={mode} />
      {Icon && null}
    </div>
  )
}

function ViewForMode({ mode }) {
  if (mode === 'releases') return <FundReleaseView />
  if (mode === 'reappropriation') return <ReappropriationView />
  if (mode === 'ledger') return <LedgerView />
  return <SanctionRegisterView />
}

// ── Sanctions Register ──────────────────────────────────────────────────────
function SanctionRegisterView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canCreate = useStatePermission('sanction.create')
  const canApprove = useStatePermission('sanction.approve')
  const [fy, setFy] = useState('2026-27')
  const [status, setStatus] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [approveFor, setApproveFor] = useState(null)
  const [escalateFor, setEscalateFor] = useState(null)
  const [form, setForm] = useState({})

  const rows = useMemo(() => {
    const scoped = store.sanctions.filter((s) => s.fy === fy)
    return sanctionPositions(scoped, store.fundReleases, fy).filter((s) => status === 'all' || s.status === status)
  }, [fy, status, store.sanctions, store.fundReleases])

  const position = statePosition({ ...store, fy })
  const pendingCount = store.sanctions.filter((s) => s.fy === fy && s.status === 'drafted').length

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setCreateOpen(false); setApproveFor(null); setEscalateFor(null) } catch (e) { pushToast(e.message, 'error') }
  }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All Statuses' }, { value: 'drafted', label: 'Drafted / Pending' }, { value: 'approved', label: 'Approved' }, { value: 'escalated', label: 'Escalated' }]} />
        {canCreate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Sanction</Button>}
        <Badge tone="info">Sanctioned balance is derived — reports never accept hand-entered totals</Badge>
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Sanctioned (scope)" value={formatAmount(rows.filter((r) => r.status === 'approved').reduce((a, r) => a + r.amount, 0))} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Pending approval" value={pendingCount} tone="saffron" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Remaining to sanction" value={formatAmount(position.derived.remainToSanction)} tone="leaf" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Sanction Register" subtitle={`FY ${fy} · ${rows.length} sanctions`} icon={FileCheck2} />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'sanctionNo', label: 'Sanction No', render: (r) => <span className="font-mono text-[12px]">{r.sanctionNo}</span> },
              { key: 'departmentId', label: 'Department', render: (r) => master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId },
              { key: 'schemeId', label: 'Scheme', render: (r) => r.schemeId ? <span className="text-[12.5px]">{master.schemes.find((s) => s.id === r.schemeId)?.name || r.schemeId}</span> : '—' },
              { key: 'amount', label: 'Amount', render: (r) => <span className="font-medium text-ink-900">{formatAmount(r.amount)}</span> },
              { key: 'released', label: 'Released', render: (r) => <span className="text-saffron-700">{formatAmount(r.released)}</span> },
              { key: 'unreleased', label: 'Unreleased', render: (r) => <span className="text-leaf-700">{formatAmount(r.unreleased)}</span> },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'positive' : r.status === 'escalated' ? 'warning' : 'neutral'}>{r.status}</Badge> },
              { key: 'createdBy', label: 'Raised By' },
              { key: '_', label: '', render: (r) => (
                <span className="flex items-center gap-1.5">
                  {r.status === 'drafted' && canApprove && <Button variant="ghost" size="sm" icon={ShieldCheck} onClick={() => setApproveFor(r)}>Approve</Button>}
                  {r.status === 'drafted' && canApprove && <Button variant="ghost" size="sm" icon={ArrowUpRight} onClick={() => setEscalateFor(r)}>Escalate</Button>}
                </span>
              ) },
            ]}
            rows={rows}
            keyField="id"
          />
        </CardBody>
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} width="max-w-2xl" title="Create Financial Sanction" footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => run(() => {
          if (!form.departmentId || !form.budgetHeadId) throw new Error('Department and budget head are required.')
          if (!Number(form.amountCr) || Number(form.amountCr) <= 0) throw new Error('A positive amount is required.')
          store.createSanction({
            fy, departmentId: form.departmentId, districtId: form.districtId || null, schemeId: form.schemeId || null,
            budgetHeadId: form.budgetHeadId, projectId: form.projectId || null, description: form.description || 'Financial sanction',
            amount: crFromLakh(form.amountCr), goNumber: form.goNumber || '', actor,
          })
        }, 'Sanction drafted — now awaiting approval.')}>Create Sanction</Button></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Department" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v, budgetHeadId: '' }))} options={master.departments.map((d) => ({ value: d.id, label: d.name }))} />
            <SelectField label="Budget Head" value={form.budgetHeadId || ''} onChange={(v) => setForm((f) => ({ ...f, budgetHeadId: v }))} options={master.budgetHeads.map((h) => ({ value: h.id, label: `${h.label} (${h.code})` }))} />
            <SelectField label="Scheme (optional)" value={form.schemeId || ''} onChange={(v) => setForm((f) => ({ ...f, schemeId: v }))} options={[{ value: '', label: 'None' }, ...master.schemes.map((s) => ({ value: s.id, label: s.name }))]} />
            <SelectField label="District (optional)" value={form.districtId || ''} onChange={(v) => setForm((f) => ({ ...f, districtId: v }))} options={[{ value: '', label: 'All Districts' }, ...master.districts.map((d) => ({ value: d.id, label: d.name }))]} />
            <Field label="Amount (₹ Crore)" type="number" step="0.01" min="0" value={form.amountCr || ''} onChange={(e) => setForm((f) => ({ ...f, amountCr: e.target.value }))} placeholder="e.g. 12" />
            <Field label="Government Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} placeholder="GO-FS-2026-XXXX" />
          </div>
          <TextAreaField className="mt-3" label="Description / Purpose" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">The sanction amount is validated against the department's remaining authorized balance. Approval runs under delegated financial powers.</p>
        </Modal>
      )}

      {approveFor && (
        <Modal open onClose={() => setApproveFor(null)} title={`Approve Sanction — ${approveFor.sanctionNo}`} footer={<><Button variant="ghost" onClick={() => setApproveFor(null)}>Cancel</Button><Button icon={ShieldCheck} onClick={() => run(() => { store.approveSanction({ id: approveFor.id, actor, remarks: form.remarks || '' }) }, `Sanction ${approveFor.sanctionNo} approved.`)}>Approve</Button></>}>
          <div className="mb-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">
            {master.departments.find((d) => d.id === approveFor.departmentId)?.name} · <span className="font-mono">{formatAmount(approveFor.amount)}</span>
          </div>
          <div className="space-y-3">
            <TextAreaField label="Approval Remarks (recorded in the audit trail)" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">If the amount exceeds your delegated authority the approval is rejected and must be escalated to the competent authority.</p>
        </Modal>
      )}

      {escalateFor && (
        <Modal open onClose={() => setEscalateFor(null)} title={`Escalate — ${escalateFor.sanctionNo}`} footer={<><Button variant="ghost" onClick={() => setEscalateFor(null)}>Cancel</Button><Button icon={ArrowUpRight} onClick={() => run(() => { store.escalateSanction({ id: escalateFor.id, actor, remarks: form.remarks || '' }) }, `Sanction ${escalateFor.sanctionNo} escalated.`)}>Escalate</Button></>}>
          <div className="space-y-3">
            <TextAreaField label="Reason for Escalation (amount exceeds acting authority)" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
        </Modal>
      )}
    </>
  )
}

// ── Fund Releases ───────────────────────────────────────────────────────────
function FundReleaseView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canCreate = useStatePermission('release.create')
  const canApprove = useStatePermission('release.approve')
  const [fy, setFy] = useState('2026-27')
  const [status, setStatus] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [approveFor, setApproveFor] = useState(null)
  const [viewFor, setViewFor] = useState(null)
  const [form, setForm] = useState({})

  const rows = useMemo(() => {
    const scoped = store.fundReleases.filter((r) => r.fy === fy)
    return scoped.filter((r) => status === 'all' || r.status === status)
  }, [fy, status, store.fundReleases])

  const approvedSanctions = store.sanctions.filter((s) => s.fy === fy && s.status === 'approved')
  const releasedTotal = store.fundReleases.filter((r) => r.fy === fy && r.status === 'approved').reduce((a, r) => a + r.amount, 0)
  const sanctionedTotal = store.sanctions.filter((s) => s.fy === fy && s.status === 'approved').reduce((a, s) => a + s.amount, 0)

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setCreateOpen(false); setApproveFor(null) } catch (e) { pushToast(e.message, 'error') }
  }

  const sanctionRef = (r) => {
    const s = store.sanctions.find((x) => x.id === r.sanctionId)
    return s ? s.sanctionNo : r.sanctionId
  }
  const sanctionUnreleased = (id) => {
    const s = store.sanctions.find((x) => x.id === id)
    if (!s) return 0
    return s.amount - store.fundReleases.filter((r) => r.sanctionId === id && r.status === 'approved').reduce((a, r) => a + r.amount, 0)
  }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All Statuses' }, { value: 'drafted', label: 'Drafted / Pending' }, { value: 'approved', label: 'Approved' }]} />
        {canCreate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Issue Fund Release</Button>}
        <Badge tone="info">Only approved sanctions can be released</Badge>
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Sanctioned (approved)" value={formatAmount(sanctionedTotal)} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Released (approved)" value={formatAmount(releasedTotal)} tone="saffron" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Yet to release" value={formatAmount(sanctionedTotal - releasedTotal)} tone="leaf" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Fund Release Register" subtitle={`FY ${fy} · ${rows.length} releases`} icon={HandCoins} />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'releaseNo', label: 'Release No', render: (r) => <span className="font-mono text-[12px]">{r.releaseNo}</span> },
              { key: 'sanctionId', label: 'Sanction', render: (r) => <span className="font-mono text-[12px]">{sanctionRef(r)}</span> },
              { key: 'departmentId', label: 'Department', render: (r) => master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId },
              { key: 'amount', label: 'Amount', render: (r) => <span className="font-medium text-ink-900">{formatAmount(r.amount)}</span> },
              { key: 'releaseDate', label: 'Release Date', render: (r) => formatDateOnly(r.releaseDate) },
              { key: 'goNumber', label: 'Order', render: (r) => r.goNumber ? <span className="font-mono text-[12px]">{r.goNumber}</span> : '—' },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'positive' : 'neutral'}>{r.status}</Badge> },
              { key: '_', label: '', render: (r) => (
                <span className="flex items-center gap-1.5">
                  {r.status === 'drafted' && canApprove && <Button variant="ghost" size="sm" icon={ShieldCheck} onClick={() => setApproveFor(r)}>Approve</Button>}
                  <Button variant="ghost" size="sm" onClick={() => setViewFor(r)}>View</Button>
                </span>
              ) },
            ]}
            rows={rows}
            keyField="id"
          />
        </CardBody>
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} title="Issue Fund Release" footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => run(() => {
          if (!form.sanctionId) throw new Error('Select the sanction to release against.')
          if (!Number(form.amountCr) || Number(form.amountCr) <= 0) throw new Error('A positive amount is required.')
          store.createFundRelease({ sanctionId: form.sanctionId, fy, districtId: form.districtId || null, amount: crFromLakh(form.amountCr), releaseNotes: form.releaseNotes || '', actor })
        }, 'Fund release drafted for approval.')}>Draft Release</Button></>}>
          <div className="space-y-3">
            <SelectField label="Approved Sanction" value={form.sanctionId || ''} onChange={(v) => setForm((f) => ({ ...f, sanctionId: v }))} options={approvedSanctions.map((s) => ({ value: s.id, label: `${s.sanctionNo} — ${master.departments.find((d) => d.id === s.departmentId)?.name || s.departmentId} · ${formatAmount(s.amount)}` }))} />
            {form.sanctionId && <div className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">Unreleased balance of this sanction: <span className="font-mono font-medium">{formatAmount(sanctionUnreleased(form.sanctionId))}</span></div>}
            <Field label="Amount (₹ Crore)" type="number" step="0.01" min="0" value={form.amountCr || ''} onChange={(e) => setForm((f) => ({ ...f, amountCr: e.target.value }))} placeholder="e.g. 4" />
            <TextAreaField label="Release Notes" value={form.releaseNotes || ''} onChange={(e) => setForm((f) => ({ ...f, releaseNotes: e.target.value }))} />
          </div>
        </Modal>
      )}

      {approveFor && (
        <Modal open onClose={() => setApproveFor(null)} title={`Approve Release — ${approveFor.releaseNo}`} footer={<><Button variant="ghost" onClick={() => setApproveFor(null)}>Cancel</Button><Button icon={ShieldCheck} onClick={() => run(() => { store.approveRelease({ id: approveFor.id, actor, remarks: form.remarks || '', goNumber: form.goNumber || '' }) }, `Release ${approveFor.releaseNo} approved — funds drawn.`)}>Approve</Button></>}>
          <div className="mb-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">
            Against <span className="font-mono">{sanctionRef(approveFor)}</span> · <span className="font-mono">{formatAmount(approveFor.amount)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fund Release Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} placeholder={`GO-FR-2026-${approveFor.releaseNo.split('-').pop()}`} />
          </div>
          <TextAreaField className="mt-3" label="Approval Remarks" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
        </Modal>
      )}

      {viewFor && (
        <Modal open onClose={() => setViewFor(null)} title={`Release Detail — ${viewFor.releaseNo}`} footer={<Button variant="ghost" onClick={() => setViewFor(null)}>Close</Button>}>
          <div className="space-y-2 text-[13px] text-ink-700">
            <p><span className="text-ink-400">Parent sanction:</span> <span className="font-mono">{sanctionRef(viewFor)}</span></p>
            <p><span className="text-ink-400">Amount:</span> <span className="font-mono font-medium">{formatAmount(viewFor.amount)}</span></p>
            <p><span className="text-ink-400">Released on:</span> {formatDateOnly(viewFor.releaseDate)}</p>
            <p><span className="text-ink-400">Order:</span> {viewFor.goNumber ? <span className="font-mono">{viewFor.goNumber}</span> : 'Not yet assigned'}</p>
            <p><span className="text-ink-400">Approved by:</span> {viewFor.approvedBy || '—'}</p>
            {viewFor.remarks && <p><span className="text-ink-400">Notes:</span> {viewFor.remarks}</p>}
          </div>
        </Modal>
      )}
    </>
  )
}

// ── Re-appropriation ────────────────────────────────────────────────────────
function ReappropriationView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const canCreate = useStatePermission('reappropriate')
  const canApprove = useStatePermission('approval.handle')
  const [fy, setFy] = useState('2026-27')
  const [status, setStatus] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [approveFor, setApproveFor] = useState(null)
  const [form, setForm] = useState({})

  const rows = useMemo(() => {
    const scoped = store.reappropriations.filter((r) => r.fy === fy)
    return scoped.filter((r) => status === 'all' || r.status === status)
  }, [fy, status, store.reappropriations])

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setCreateOpen(false); setApproveFor(null) } catch (e) { pushToast(e.message, 'error') }
  }

  const headId = (id) => master.budgetHeads.find((h) => h.id === id)
  const headLabel = (id) => { const h = headId(id); return h ? `${h.label}` : id }
  const deptName = (id) => master.departments.find((d) => d.id === id)?.name || id

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <SelectField label="Status" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All Statuses' }, { value: 'drafted', label: 'Drafted / Pending' }, { value: 'approved', label: 'Approved' }]} />
        {canCreate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Re-appropriation</Button>}
        <Badge tone="alert" dot>Source head must hold sufficient available balance</Badge>
      </FilterStrip>

      <Card>
        <CardHeader title="Re-appropriation Register" subtitle={`FY ${fy} · ${rows.length} movements`} icon={ArrowLeftRight} />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'raNo', label: 'Order No', render: (r) => <span className="font-mono text-[12px]">{r.raNo}</span> },
              { key: 'sourceBudgetHeadId', label: 'From Head', render: (r) => <span className="text-[12.5px]">{headLabel(r.sourceBudgetHeadId)} <span className="text-ink-400">({deptName(r.sourceDepartmentId)})</span></span> },
              { key: 'destinationBudgetHeadId', label: 'To Head', render: (r) => <span className="text-[12.5px]">{headLabel(r.destinationBudgetHeadId)} <span className="text-ink-400">({deptName(r.destinationDepartmentId)})</span></span> },
              { key: 'amount', label: 'Amount', render: (r) => <span className="font-medium text-ink-900">{formatAmount(r.amount)}</span> },
              { key: 'supportingOrder', label: 'Supporting Order', render: (r) => <span className="font-mono text-[12px]">{r.supportingOrder}</span> },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'approved' ? 'positive' : 'neutral'}>{r.status}</Badge> },
              { key: 'approvedBy', label: 'Approved By' },
              { key: '_', label: '', render: (r) => r.status === 'drafted' && canApprove && <Button variant="ghost" size="sm" icon={ShieldCheck} onClick={() => setApproveFor(r)}>Approve</Button> },
            ]}
            rows={rows}
            keyField="id"
          />
        </CardBody>
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} width="max-w-2xl" title="Create Re-appropriation" footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => run(() => {
          if (!form.sourceBudgetHeadId || !form.destinationBudgetHeadId) throw new Error('Source and destination budget heads are required.')
          if (!Number(form.amountCr) || Number(form.amountCr) <= 0) throw new Error('A positive amount is required.')
          store.createReappropriation({
            fy, sourceDepartmentId: form.sourceDepartmentId || master.departments[0]?.id,
            sourceBudgetHeadId: form.sourceBudgetHeadId, sourceSchemeId: form.sourceSchemeId || null,
            destinationDepartmentId: form.destinationDepartmentId || form.sourceDepartmentId || master.departments[0]?.id,
            destinationBudgetHeadId: form.destinationBudgetHeadId, destinationSchemeId: form.destinationSchemeId || null,
            amount: crFromLakh(form.amountCr), reason: form.reason || '', supportingOrder: form.supportingOrder || '', actor,
          })
        }, 'Re-appropriation drafted for approval.')}>Draft Re-appropriation</Button></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Department" value={form.sourceDepartmentId || ''} onChange={(v) => setForm((f) => ({ ...f, sourceDepartmentId: v, destinationDepartmentId: v }))} options={master.departments.map((d) => ({ value: d.id, label: d.name }))} />
            <div className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-600">Cross-department re-appropriation requires a higher approving authority — the workflow configuration governs this case.</div>
            <SelectField label="Source Budget Head" value={form.sourceBudgetHeadId || ''} onChange={(v) => setForm((f) => ({ ...f, sourceBudgetHeadId: v }))} options={master.budgetHeads.map((h) => ({ value: h.id, label: `${h.label} (${h.code})` }))} />
            <SelectField label="Destination Budget Head" value={form.destinationBudgetHeadId || ''} onChange={(v) => setForm((f) => ({ ...f, destinationBudgetHeadId: v }))} options={master.budgetHeads.map((h) => ({ value: h.id, label: `${h.label} (${h.code})` }))} />
            <Field label="Amount (₹ Crore)" type="number" step="0.01" min="0" value={form.amountCr || ''} onChange={(e) => setForm((f) => ({ ...f, amountCr: e.target.value }))} placeholder="e.g. 0.75" />
            <Field label="Supporting Order Number" value={form.supportingOrder || ''} onChange={(e) => setForm((f) => ({ ...f, supportingOrder: e.target.value }))} placeholder="GO-RA-2026-XXXX" />
          </div>
          <TextAreaField className="mt-3" label="Reason for Re-appropriation" value={form.reason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
        </Modal>
      )}

      {approveFor && (
        <Modal open onClose={() => setApproveFor(null)} title={`Approve — ${approveFor.raNo}`} footer={<><Button variant="ghost" onClick={() => setApproveFor(null)}>Cancel</Button><Button icon={ShieldCheck} onClick={() => run(() => { store.approveReappropriation({ id: approveFor.id, actor, remarks: form.remarks || '' }) }, `Re-appropriation ${approveFor.raNo} approved — ledger updated.`)}>Approve</Button></>}>
          <div className="mb-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">
            {headLabel(approveFor.sourceBudgetHeadId)} <span className="text-ink-400">→</span> {headLabel(approveFor.destinationBudgetHeadId)} · <span className="font-mono">{formatAmount(approveFor.amount)}</span>
          </div>
          <TextAreaField label="Approval Remarks" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
        </Modal>
      )}
    </>
  )
}

// ── Financial Ledger ────────────────────────────────────────────────────────
function LedgerView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const [fy, setFy] = useState('2026-27')
  const [type, setType] = useState('all')
  const [departmentId, setDepartmentId] = useState('')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.ledger.filter((e) => {
      if (e.fy !== fy) return false
      if (type !== 'all' && e.type !== type) return false
      if (departmentId && e.departmentId !== departmentId) return false
      if (q && !(`${e.referenceNo} ${e.referenceType} ${e.typeLabel} ${e.txId}`.toLowerCase().includes(q))) return false
      return true
    }).slice(0, 200)
  }, [fy, type, departmentId, query, store.ledger])

  const types = useMemo(() => {
    const seen = new Set(store.ledger.filter((e) => e.fy === fy).map((e) => e.type))
    return Array.from(seen)
  }, [fy, store.ledger])

  const totalIn = store.ledger.filter((e) => e.fy === fy && e.sign > 0).reduce((a, e) => a + e.amount, 0)
  const totalOut = store.ledger.filter((e) => e.fy === fy && e.sign < 0).reduce((a, e) => a + e.amount, 0)

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <SelectField label="Transaction Type" value={type} onChange={setType} options={[{ value: 'all', label: 'All Types' }, ...types.map((t) => ({ value: t, label: t }))]} />
        <SelectField label="Department" value={departmentId} onChange={setDepartmentId} options={[{ value: '', label: 'All Departments' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference / tx id" className="input-field pl-8 py-2 text-[13px]" />
        </div>
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Transactions (FY)" value={store.ledger.filter((e) => e.fy === fy).length} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Total Debits / Out" value={formatAmount(totalOut)} tone="saffron" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Total Credits / In" value={formatAmount(totalIn)} tone="leaf" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Ledger Entries" subtitle={`Append-only · latest first · ${rows.length} shown`} icon={BookOpenText} />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'txId', label: 'Tx ID', render: (r) => <span className="font-mono text-[11.5px]">{r.txId}</span> },
              { key: 'typeLabel', label: 'Type', render: (r) => <Badge tone={typeTone(r.type)}>{r.typeLabel}</Badge> },
              { key: 'departmentId', label: 'Department', render: (r) => r.departmentId ? (master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId) : 'State' },
              { key: 'amount', label: 'Amount', render: (r) => <span className={`font-medium ${r.sign > 0 ? 'text-leaf-700' : 'text-saffron-700'}`}>{r.sign > 0 ? '+' : '−'}{formatAmount(r.amount)}</span> },
              { key: 'referenceNo', label: 'Reference', render: (r) => <span className="font-mono text-[11.5px]">{r.referenceNo}</span> },
              { key: 'createdBy', label: 'Recorded By' },
              { key: 'timestamp', label: 'Timestamp', render: (r) => formatDateOnly(r.timestamp) },
            ]}
            rows={rows}
            keyField="id"
          />
        </CardBody>
      </Card>
    </>
  )
}

function typeTone(type) {
  if (['BUDGET_CREATED', 'DISTRICT_ALLOCATION', 'REAPPROPRIATION_IN'].includes(type)) return 'positive'
  if (['EXPENDITURE', 'REAPPROPRIATION_OUT'].includes(type)) return 'saffron'
  if (['COMMITMENT'].includes(type)) return 'warning'
  if (['REVERSAL', 'ADJUSTMENT'].includes(type)) return 'negative'
  return 'info'
}

export function crFromLakh(input) {
  const value = Number(input)
  if (!input || Number.isNaN(value)) return 0
  return Math.round(value * 10000000)
}

function formatDateOnly(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}