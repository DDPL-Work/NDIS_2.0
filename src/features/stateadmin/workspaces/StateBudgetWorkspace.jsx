// Budget & Finance workspaces:
//   state        → State Budget (provision, revisions, supplementary)
//   departments  → Department Budgets (authorized amounts with GO backing)
//   districts    → District Allocations (over-allocation rejected)
//   history      → Budget History (revisions + versions retained)
//   scheme-mapping → Scheme Budget Mapping
import { useMemo, useState } from 'react'
import { Landmark, Building2, MapPin, History as HistoryIcon, Link2, Plus, PencilLine, ShieldAlert } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Tabs from '../../../components/ui/Tabs'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { departmentPositions, districtPositions, schemePositions, statePosition } from '../selectors/financeSelectors'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, SelectField, TextAreaField, formatAmount, FilterStrip, SummaryPill } from '../components/StateUI'
import { FUND_SOURCES, FINANCIAL_YEARS } from '../../../config/stateConstants'
import { PREVIOUS_YEAR } from '../store/seed/stateSeedData'

const META = {
  state: { title: 'State Budget', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · STATE BUDGET', icon: Landmark, description: 'Annual budget provision with full revision history. Original values are never overwritten.' },
  departments: { title: 'Department Budgets', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · DEPARTMENT BUDGETS', icon: Building2, description: 'Source of department-level budget authority in NDISP. Authorized Amount is GO-backed and drives all downstream numbers.' },
  districts: { title: 'District Allocations', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · DISTRICT ALLOCATIONS', icon: MapPin, description: 'State-level authorized budget assigned to districts. Over-allocation is rejected by the finance rules.' },
  history: { title: 'Budget History', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · BUDGET HISTORY', icon: HistoryIcon, description: 'Every revision and version retained — original, revision and current are all auditable.' },
  'scheme-mapping': { title: 'Scheme Budget Mapping', eyebrow: 'STATE ADMIN · BUDGET & FINANCE · SCHEME MAPPING', icon: Link2, description: 'Budget flow into schemes — sanctioned, released and utilized per scheme.' },
}

export default function StateBudgetWorkspace({ mode = 'state' }) {
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
  if (mode === 'state') return <StateBudgetView />
  if (mode === 'departments') return <DepartmentBudgetView />
  if (mode === 'districts') return <DistrictAllocationView />
  if (mode === 'history') return <BudgetHistoryView />
  if (mode === 'scheme-mapping') return <SchemeMappingView />
  return <StateBudgetView />
}

// ── State Budget ────────────────────────────────────────────────────────────
function StateBudgetView() {
  const store = useStateFinanceStore()
  const canCreate = useStatePermission('budget.create')
  const canRevise = useStatePermission('budget.revise')
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const [fy, setFy] = useState('2026-27')
  const [createOpen, setCreateOpen] = useState(false)
  const [reviseOpen, setReviseOpen] = useState(false)
  const [form, setForm] = useState({})

  const budget = store.stateBudgets.find((b) => b.fy === fy)
  const run = (fn, ok) => { try { fn(); pushToast(ok, 'success'); setCreateOpen(false); setReviseOpen(false) } catch (e) { pushToast(e.message, 'error') } }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        {!budget && canCreate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create State Budget</Button>}
        {budget && canRevise && <Button icon={PencilLine} onClick={() => setReviseOpen(true)}>Record Revision</Button>}
      </FilterStrip>

      {budget ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader title={`State Budget — FY ${fy}`} subtitle="Budget provision (original + revisions retained)" icon={Landmark} />
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <SummaryPill label="Original Provision" value={formatAmount(budget.provisionOriginal)} />
                <SummaryPill label="Current Provision" value={formatAmount(budget.provisionCurrent)} tone="leaf" />
                <SummaryPill label="Total Revision" value={formatAmount((budget.provisionCurrent || 0) - (budget.provisionOriginal || 0))} tone="saffron" />
                <SummaryPill label="Status" value={<Badge tone={budget.status === 'approved' ? 'positive' : 'warning'}>{budget.status}</Badge>} />
              </div>
              {budget.documentId && <p className="mt-4 text-[12.5px] text-ink-500">Supporting document: <span className="font-mono text-[12px] text-ink-700">{budget.documentId}</span></p>}
              <div className="mt-4">
                <p className="eyebrow mb-2">Revision History</p>
                <DataTable
                  columns={[
                    { key: 'revisionNo', label: 'Revision' },
                    { key: 'delta', label: 'Delta', render: (r) => <span className={r.delta >= 0 ? 'text-leaf-600' : 'text-alert-600'}>{r.delta >= 0 ? '+' : ''}{formatAmount(r.delta)}</span> },
                    { key: 'reason', label: 'Reason', hideOn: 'sm' },
                    { key: 'goNumber', label: 'Government Order', hideOn: 'md' },
                    { key: 'date', label: 'Date' },
                  ]}
                  rows={budget.revisions}
                />
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Delegation Note" icon={ShieldAlert} />
            <CardBody className="text-[12.5px] leading-relaxed text-ink-600">
              <p>State budget provision is the single upstream record. Every downstream number (authorized, sanctioned, released, utilized) is derived from transaction records — the Reports module reads this source of truth and never accepts hand-entered totals.</p>
              <p className="mt-3">Supplementary budgets and reductions are recorded as revisions; the original value is retained forever.</p>
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card><CardBody className="text-[13px] text-ink-500">No state budget recorded for FY {fy}. Create one to begin the financial lifecycle.</CardBody></Card>
      )}

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} title={`Create State Budget — FY ${fy}`} footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => run(() => { store.createStateBudget({ fy, provision: crFromLakh(form.provisionCr), documentId: form.documentId || null, remarks: form.remarks, actor }) }, 'State budget created.')}>Create</Button></>}>
          <div className="space-y-3">
            <Field label="Provision (₹ Crore)" type="number" min="0" step="0.01" value={form.provisionCr || ''} onChange={(e) => setForm((f) => ({ ...f, provisionCr: e.target.value }))} placeholder="e.g. 5000" />
            <Field label="Supporting Document ID" value={form.documentId || ''} onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))} placeholder="DOC-SB-YYYY" />
            <TextAreaField label="Remarks" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
        </Modal>
      )}

      {reviseOpen && (
        <Modal open onClose={() => setReviseOpen(false)} title={`Record Revision — FY ${fy}`} footer={<><Button variant="ghost" onClick={() => setReviseOpen(false)}>Cancel</Button><Button onClick={() => run(() => { store.reviseStateBudget({ fy, delta: crFromLakh(form.deltaCr), reason: form.reason, goNumber: form.goNumber, actor }) }, 'Budget revision recorded.')}>Record Revision</Button></>}>
          <div className="space-y-3">
            <Field label="Delta (₹ Crore, +/−)" type="number" step="0.01" value={form.deltaCr || ''} onChange={(e) => setForm((f) => ({ ...f, deltaCr: e.target.value }))} placeholder="e.g. +200 or -50" />
            <Field label="Government Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} placeholder="GO-SUP-2026002" />
            <TextAreaField label="Reason" value={form.reason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
        </Modal>
      )}
    </>
  )
}

// ── Department Budgets ──────────────────────────────────────────────────────
function DepartmentBudgetView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const canCreate = useStatePermission('deptbudget.allocate')
  const pushToast = useUiStore((s) => s.pushToast)
  const [fy, setFy] = useState('2026-27')
  const [createOpen, setCreateOpen] = useState(false)
  const [reviseFor, setReviseFor] = useState(null)
  const [form, setForm] = useState({})

  const rows = store.departmentBudgets.filter((d) => d.fy === fy)
  const run = (fn, ok) => { try { fn(); pushToast(ok, 'success'); setCreateOpen(false); setReviseFor(null) } catch (e) { pushToast(e.message, 'error') } }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        {canCreate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create Department Budget</Button>}
        <Badge tone="info">Authorized Amount is GO-backed · reports read from these records</Badge>
      </FilterStrip>

      <Card>
        <CardHeader title="Department Budget Register" subtitle={`FY ${fy} · ${rows.length} departments`} icon={Building2} />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'departmentId', label: 'Department', render: (r) => master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId },
              { key: 'provision', label: 'Provision', render: (r) => formatAmount(r.provision) },
              { key: 'authorized', label: 'Authorized', render: (r) => <span className="text-ink-900 font-medium">{formatAmount(r.authorized)}</span> },
              { key: 'goNumber', label: 'Government Order', render: (r) => <span className="font-mono text-[12px]">{r.goNumber}</span> },
              { key: 'revisions', label: 'Revisions', render: (r) => r.revisions.length ? <Badge tone="warning">{r.revisions.length} rev</Badge> : <Badge tone="neutral">—</Badge> },
              { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'neutral'}>{r.status}</Badge> },
              { key: '_', label: '', render: (r) => canCreate && <Button variant="ghost" size="sm" icon={PencilLine} onClick={() => setReviseFor(r)}>Revise</Button> },
            ]}
            rows={rows}
            keyField="id"
          />
        </CardBody>
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} width="max-w-2xl" title="Create Department Budget" footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => submitDepartmentBudget(store, master, form, fy, actor, run)}>Create Department Budget</Button></>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Financial Year" value={fy} onChange={() => {}} options={[{ value: fy, label: fy }]} />
            <SelectField label="Department" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={master.departments.map((d) => ({ value: d.id, label: d.name }))} />
            <SelectField label="Budget Head" value={form.budgetHeadId || ''} onChange={(v) => setForm((f) => ({ ...f, budgetHeadId: v }))} options={master.budgetHeads.map((h) => ({ value: h.id, label: `${h.label} (${h.code})` }))} />
            <SelectField label="Scheme (optional)" value={form.schemeId || ''} onChange={(v) => setForm((f) => ({ ...f, schemeId: v }))} options={master.schemes.map((s) => ({ value: s.id, label: s.name }))} />
            <Field label="Budget Provision (₹ Crore)" type="number" step="0.01" value={form.provisionCr || ''} onChange={(e) => setForm((f) => ({ ...f, provisionCr: e.target.value }))} />
            <Field label="Authorized / Sanctioned Amount (₹ Crore)" type="number" step="0.01" value={form.authorizedCr || ''} onChange={(e) => setForm((f) => ({ ...f, authorizedCr: e.target.value }))} />
            <SelectField label="Source of Fund" value={form.fundSource || 'state_budget'} onChange={(v) => setForm((f) => ({ ...f, fundSource: v }))} options={FUND_SOURCES.map((s) => ({ value: s.value, label: s.label }))} />
            <Field label="Government Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} placeholder="GO-2026-XXXX" />
            <Field label="Government Order Date" type="date" value={form.goDate || ''} onChange={(e) => setForm((f) => ({ ...f, goDate: e.target.value }))} />
            <Field label="Effective Date" type="date" value={form.effectiveDate || ''} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
            <Field label="Supporting Document ID" value={form.documentId || ''} onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))} />
          </div>
          <TextAreaField className="mt-3" label="Remarks" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
        </Modal>
      )}

      {reviseFor && (
        <Modal open onClose={() => setReviseFor(null)} title={`Revise — ${master.departments.find((d) => d.id === reviseFor.departmentId)?.name || reviseFor.departmentId}`} footer={<><Button variant="ghost" onClick={() => setReviseFor(null)}>Cancel</Button><Button onClick={() => run(() => { store.reviseDepartmentBudget({ id: reviseFor.id, delta: crFromLakh(form.deltaCr), reason: form.reason, goNumber: form.goNumber, actor }) }, 'Department budget revised — original retained.')}>Record Revision</Button></>}>
          <div className="mb-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">
            Current authorized: <span className="font-mono">{formatAmount(reviseFor.authorized)}</span> · Provision {formatAmount(reviseFor.provision)}
          </div>
          <div className="space-y-3">
            <Field label="Delta (₹ Crore, +/−)" type="number" step="0.01" value={form.deltaCr || ''} onChange={(e) => setForm((f) => ({ ...f, deltaCr: e.target.value }))} />
            <Field label="Government Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} />
            <TextAreaField label="Reason" value={form.reason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
        </Modal>
      )}
    </>
  )
}

function submitDepartmentBudget(store, master, form, fy, actor, run) {
  run(() => {
    if (!form.departmentId) throw new Error('Department is required.')
    const authorized = crFromLakh(form.authorizedCr)
    const provision = crFromLakh(form.provisionCr)
    if (authorized > provision) throw new Error('Authorized Amount cannot exceed Budget Provision.')
    store.createDepartmentBudget({
      fy, departmentId: form.departmentId, budgetHeadId: form.budgetHeadId || master.budgetHeads[0]?.id,
      schemeId: form.schemeId || null, provision, authorized, fundSource: form.fundSource || 'state_budget',
      goNumber: form.goNumber || `GO-DB-${fy.replace('-', '')}-${form.departmentId.toUpperCase()}`,
      goDate: form.goDate, effectiveDate: form.effectiveDate || form.goDate, documentId: form.documentId || null,
      remarks: form.remarks || '', actor,
    })
  }, 'Department budget created — numbers now flow to reports.')
}

// ── District Allocations ─────────────────────────────────────────────────────
function DistrictAllocationView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const [fy, setFy] = useState('2026-27')
  const [tab, setTab] = useState('allocations')
  const [departmentId, setDepartmentId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({})

  const canAllocate = useStatePermission('district.allocate')
  const allocations = store.districtAllocations.filter((a) => a.fy === fy && (!departmentId || a.departmentId === departmentId))
  const districtRows = districtPositions({ fy, districts: master.districts, departmentId: departmentId || null, ...store })
  const departmentRows = departmentPositions({ fy, departments: master.departments, ...store })

  const run = (fn, ok) => { try { fn(); pushToast(ok, 'success'); setCreateOpen(false) } catch (e) { pushToast(e.message, 'error') } }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <SelectField label="Department" value={departmentId} onChange={setDepartmentId} options={[{ value: '', label: 'All Departments' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
        {canAllocate && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Create District Allocation</Button>}
        <Badge tone="alert" dot>Validation: total district allocation ≤ available authorized budget</Badge>
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Authorized (scope)" value={formatAmount(departmentRows.filter((r) => !departmentId || r.departmentId === departmentId).reduce((a, r) => a + r.authorized, 0))} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Allocated (scope)" value={formatAmount(allocations.reduce((a, r) => a + r.amount, 0))} tone="saffron" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Unallocated (scope)" value={formatAmount(departmentRows.filter((r) => !departmentId || r.departmentId === departmentId).reduce((a, r) => a + r.unallocated, 0))} tone="leaf" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="District Allocations" subtitle={`FY ${fy}`} action={
          <Tabs tabs={[{ value: 'allocations', label: 'Allocations' }, { value: 'rollup', label: 'District Budget Rollup' }]} active={tab} onChange={setTab} />
        } />
        <CardBody className="p-0">
          {tab === 'allocations' ? (
            <DataTable
              columns={[
                { key: 'departmentId', label: 'Department', render: (r) => master.departments.find((d) => d.id === r.departmentId)?.name || r.departmentId },
                { key: 'districtId', label: 'District', render: (r) => master.districts.find((d) => d.id === r.districtId)?.name || r.districtId },
                { key: 'schemeId', label: 'Scheme', render: (r) => r.schemeId ? master.schemes.find((s) => s.id === r.schemeId)?.name || r.schemeId : '—' },
                { key: 'amount', label: 'Allocated', render: (r) => <span className="font-medium text-ink-900">{formatAmount(r.amount)}</span> },
                { key: 'goNumber', label: 'Order', render: (r) => <span className="font-mono text-[12px]">{r.goNumber}</span> },
                { key: 'approvedBy', label: 'Approved By' },
              ]}
              rows={allocations}
              keyField="id"
            />
          ) : (
            <DataTable
              columns={[
                { key: 'districtName', label: 'District' },
                { key: 'allocated', label: 'Allocated', render: (r) => formatAmount(r.allocated) },
                { key: 'released', label: 'Released', render: (r) => <span className="text-saffron-700">{formatAmount(r.released)}</span> },
                { key: 'utilized', label: 'Utilized', render: (r) => <span className="text-leaf-700">{formatAmount(r.utilized)}</span> },
                { key: 'utilizedPct', label: 'Utilization', render: (r) => <Badge tone={r.utilizedPct >= 60 ? 'positive' : r.utilizedPct >= 30 ? 'warning' : 'negative'}>{r.utilizedPct === null ? '—' : `${r.utilizedPct}%`}</Badge> },
              ]}
              rows={districtRows}
              keyField="districtId"
            />
          )}
        </CardBody>
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} title="Create District Allocation" footer={<><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={() => run(() => { store.allocateDistrict({ fy, departmentId: form.departmentId, districtId: form.districtId, budgetHeadId: form.budgetHeadId || null, schemeId: form.schemeId || null, amount: crFromLakh(form.amountCr), goNumber: form.goNumber || '', idempotencyKey: form.idempotencyKey || undefined, actor }) }, 'District allocation recorded.')}>Allocate</Button></>}>
          <div className="space-y-3">
            <SelectField label="Department" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={master.departments.map((d) => ({ value: d.id, label: d.name }))} />
            <SelectField label="District" value={form.districtId || ''} onChange={(v) => setForm((f) => ({ ...f, districtId: v }))} options={master.districts.map((d) => ({ value: d.id, label: d.name }))} />
            <Field label="Amount (₹ Crore)" type="number" step="0.01" value={form.amountCr || ''} onChange={(e) => setForm((f) => ({ ...f, amountCr: e.target.value }))} placeholder="e.g. 18" />
            <Field label="Government Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} />
            <SummaryPill label="Available authorized (selected dept)" value={formatAmount(scopedRemaining(store, master, fy, form.departmentId))} tone="leaf" />
            <p className="text-[11.5px] leading-relaxed text-ink-500">Attempting more than the available authorized budget shows: <span className="font-mono text-alert-600">"Allocation exceeds available authorized budget."</span></p>
          </div>
        </Modal>
      )}
    </>
  )
}

function scopedRemaining(store, master, fy, departmentId) {
  if (!departmentId) return null
  const db = store.departmentBudgets.find((d) => d.fy === fy && d.departmentId === departmentId)
  if (!db) return null
  const allocated = store.districtAllocations.filter((a) => a.fy === fy && a.departmentId === departmentId).reduce((acc, a) => acc + a.amount, 0)
  return db.authorized - allocated
}

// ── Budget History ──────────────────────────────────────────────────────────
function BudgetHistoryView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const [fy, setFy] = useState('2026-27')
  const rows = store.departmentBudgets.filter((d) => d.fy === fy)
  const current = departmentPositions({ fy, departments: master.departments, ...store })
  const previous = departmentPositions({ fy: PREVIOUS_YEAR.fy, departments: master.departments,
    departmentBudgets: Object.entries(PREVIOUS_YEAR.authorizedByDept).map(([departmentId, authorized]) => ({ fy: PREVIOUS_YEAR.fy, departmentId, authorized: authorized, provision: 0, budgetHeadId: 'bh-continuing' })),
    districtAllocations: [], sanctions: [], fundReleases: [], commitments: [],
    expenditures: Object.entries(PREVIOUS_YEAR.utilizedByDept).map(([departmentId, amount]) => ({ fy: PREVIOUS_YEAR.fy, departmentId, amount })),
  })
  const series = current.map((r) => ({
    name: r.departmentName.split(' ')[0],
    currentAuth: r.authorized / 10000000,
    previousAuth: previous.find((p) => p.departmentId === r.departmentId)?.authorized / 10000000 || 0,
    currentUtil: r.utilized / 10000000,
    previousUtil: previous.find((p) => p.departmentId === r.departmentId)?.utilized / 10000000 || 0,
  }))

  const events = rows.flatMap((db) => [
    { id: `${db.id}-create`, entity: db.departmentId, text: `Budget created — provision ${formatAmount(db.provision)}, authorized ${formatAmount(db.authorized)}`, date: db.createdAt, tone: 'positive' },
    ...db.revisions.map((rev, i) => ({ id: `${db.id}-rev-${i}`, entity: db.departmentId, text: `${rev.revisionNo}: ${rev.reason} (${formatAmount(rev.delta)})`, date: rev.date, tone: 'warning' })),
  ]).sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <Badge tone="info">Original values are never overwritten — every change is a versioned transaction</Badge>
      </FilterStrip>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Year-over-Year Comparison" subtitle={`FY ${PREVIOUS_YEAR.fy} vs FY ${fy} (₹ Cr)`} icon={HistoryIcon} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e8ed" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}Cr`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="previousAuth" name={`Auth ${PREVIOUS_YEAR.fy}`} fill="#c9d2dc" radius={[3, 3, 0, 0]} />
                <Bar dataKey="currentAuth" name={`Auth ${fy}`} fill="#0b3558" radius={[3, 3, 0, 0]} />
                <Bar dataKey="currentUtil" name={`Util ${fy}`} fill="#1f7a54" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Version & Revision Trail" subtitle="Latest first" icon={HistoryIcon} />
          <CardBody className="p-0">
            {events.slice(0, 20).map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 border-b border-ink-50 px-5 py-2.5 last:border-0">
                <div>
                  <p className="text-[13px] text-ink-800">{e.text.replace(`${e.entity.toUpperCase()}`, `${master.departments.find((d) => d.id === e.entity)?.name || e.entity}`)}</p>
                  <p className="text-[11px] text-ink-400">{formatDateOnly(e.date)} · {e.entity}</p>
                </div>
                <Badge tone={e.tone === 'positive' ? 'positive' : 'warning'}>{e.tone === 'positive' ? 'created' : 'revised'}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  )
}

// ── Scheme Budget Mapping ────────────────────────────────────────────────────
function SchemeMappingView() {
  const store = useStateFinanceStore()
  const master = useStateMasterStore()
  const [fy, setFy] = useState('2026-27')
  const schemeRows = useMemo(() => schemePositions({ fy, schemes: master.schemes, ...store }), [fy, master.schemes, store])
  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <Badge tone="info">Budget mapped to schemes via sanction records</Badge>
      </FilterStrip>
      <Card>
        <CardHeader title="Scheme-wise Budget Position" subtitle={`FY ${fy}`} icon={Link2} />
        <CardBody className="p-0">
          <DataTable
            columns={[
              { key: 'schemeName', label: 'Scheme' },
              { key: 'sanctioned', label: 'Sanctioned', render: (r) => formatAmount(r.sanctioned) },
              { key: 'released', label: 'Released', render: (r) => formatAmount(r.released) },
              { key: 'utilized', label: 'Utilized', render: (r) => formatAmount(r.utilized) },
              { key: 'releasePct', label: 'Release %', render: (r) => <Badge tone={r.releasePct >= 80 ? 'positive' : r.releasePct >= 50 ? 'warning' : 'negative'}>{r.releasePct ?? '—'}%</Badge> },
              { key: 'utilizationPct', label: 'Utilization %', render: (r) => <Badge tone={r.utilizationPct >= 60 ? 'positive' : r.utilizationPct >= 30 ? 'warning' : 'negative'}>{r.utilizationPct ?? '—'}%</Badge> },
            ]}
            rows={schemeRows}
            keyField="schemeId"
          />
        </CardBody>
      </Card>
    </>
  )
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