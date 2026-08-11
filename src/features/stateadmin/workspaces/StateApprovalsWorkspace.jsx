// State Approvals workspace:
//   pending   → unified pending-approval inbox (sanctions, releases,
//               re-appropriations, project proposals)
//   escalated → matters escalated above delegated authority
//   history   → approval trail sourced from the audit log
// Actions run through the finance engine / proposal workflow which enforce
// the configured authority matrix and workflow steps.
import { useMemo, useState } from 'react'
import { Inbox, AlertOctagon, History as HistoryIcon, ShieldCheck, ArrowUpRight, Undo2, CircleAlert, FileQuestion } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateProjectStore } from '../store/stateProjectStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { SelectField, TextAreaField, Field, FilterStrip, formatAmount, SummaryPill } from '../components/StateUI'
import { APPROVAL_ACTION_LABELS, FINANCIAL_YEARS } from '../../../config/stateConstants'

const META = {
  pending: { title: 'Pending Approvals', eyebrow: 'STATE ADMIN · APPROVALS · PENDING', icon: Inbox, description: 'Unified approval inbox. Every action is checked against the configured Delegation of Financial Powers matrix before it is recorded.' },
  escalated: { title: 'Escalated Approvals', eyebrow: 'STATE ADMIN · APPROVALS · ESCALATED', icon: AlertOctagon, description: 'Matters above the acting authority — resolved by the competent authority or referred back.' },
  history: { title: 'Approval History', eyebrow: 'STATE ADMIN · APPROVALS · HISTORY', icon: HistoryIcon, description: 'Complete approval trail derived from the immutable audit log.' },
}

// Actions the configured stores can execute per entity kind.
const ALLOWED_ACTIONS = {
  sanction: ['approve', 'escalate'],
  release: ['approve'],
  reappropriation: ['approve'],
  proposal: ['approve', 'reject', 'return', 'clarify', 'escalate'],
}

const KIND_LABEL = { sanction: 'Sanction', release: 'Fund Release', reappropriation: 'Re-appropriation', proposal: 'Project Proposal' }

export default function StateApprovalsWorkspace({ mode = 'pending' }) {
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
  if (mode === 'escalated') return <EscalatedView />
  if (mode === 'history') return <ApprovalHistoryView />
  return <PendingView />
}

function useApprovalData() {
  const finance = useStateFinanceStore()
  const projects = useStateProjectStore()
  const master = useStateMasterStore()

  const pending = useMemo(() => {
    const list = []
    finance.sanctions.filter((s) => s.status === 'drafted').forEach((s) =>
      list.push({ kind: 'sanction', id: s.id, ref: s.sanctionNo, departmentId: s.departmentId, schemeId: s.schemeId, amount: s.amount, createdAt: s.createdAt, status: s.status, data: s }))
    finance.fundReleases.filter((r) => r.status === 'drafted').forEach((r) =>
      list.push({ kind: 'release', id: r.id, ref: r.releaseNo, departmentId: r.departmentId, schemeId: r.schemeId, amount: r.amount, createdAt: r.createdAt, status: r.status, data: r }))
    finance.reappropriations.filter((r) => r.status === 'drafted').forEach((r) =>
      list.push({ kind: 'reappropriation', id: r.id, ref: r.raNo, departmentId: r.sourceDepartmentId, schemeId: null, amount: r.amount, createdAt: r.createdAt, status: r.status, data: r }))
    projects.proposals.filter((p) => ['submitted', 'recommended', 'under_review', 'clarification_required'].includes(p.status)).forEach((p) =>
      list.push({ kind: 'proposal', id: p.id, ref: p.id, departmentId: p.departmentId, schemeId: p.schemeId, amount: p.estimatedCost, createdAt: p.createdAt, status: p.status, data: p }))
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [finance.sanctions, finance.fundReleases, finance.reappropriations, projects.proposals])

  const escalated = useMemo(() => {
    const list = []
    finance.sanctions.filter((s) => s.status === 'escalated').forEach((s) =>
      list.push({ kind: 'sanction', id: s.id, ref: s.sanctionNo, departmentId: s.departmentId, schemeId: s.schemeId, amount: s.amount, createdAt: s.createdAt, status: s.status, data: s }))
    projects.proposals.filter((p) => p.status === 'escalated').forEach((p) =>
      list.push({ kind: 'proposal', id: p.id, ref: p.id, departmentId: p.departmentId, schemeId: p.schemeId, amount: p.estimatedCost, createdAt: p.createdAt, status: p.status, data: p }))
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [finance.sanctions, projects.proposals])

  const history = useMemo(() => {
    const pattern = /^(SANCTION|PROPOSAL|FUND|RELEASE|REAPPROPRIATION|BUDGET_APPROVED|DISTRICT_ALLOCATION)/
    return finance.auditLogs
      .filter((a) => pattern.test(a.action))
      .map((a) => ({
        id: a.id, action: a.action, actor: a.actor, role: a.role,
        entity: a.entity, entityId: a.entityId,
        detail: a.oldValue && a.newValue ? `${String(a.oldValue)} → ${String(a.newValue)}` : `${String(a.newValue ?? '')}`,
        reason: a.reason, timestamp: a.timestamp,
      }))
  }, [finance.auditLogs])

  const deptName = (id) => master.departments.find((d) => d.id === id)?.name || id || '—'
  const schemeName = (id) => (id ? master.schemes.find((s) => s.id === id)?.name || id : '—')
  return { finance, projects, pending, escalated, history, deptName, schemeName }
}

const ACTION_ICON = { approve: ShieldCheck, escalate: ArrowUpRight, return: Undo2, reject: CircleAlert, clarify: FileQuestion }

function PendingView() {
  const { finance, projects, pending, deptName, schemeName } = useApprovalData()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const [fy, setFy] = useState('2026-27')
  const [kind, setKind] = useState('all')
  const [actFor, setActFor] = useState(null)
  const [form, setForm] = useState({})

  const rows = pending.filter((i) => (kind === 'all' || i.kind === kind))

  const counts = useMemo(() => {
    const c = { sanction: 0, release: 0, reappropriation: 0, proposal: 0 }
    pending.forEach((i) => { c[i.kind] += 1 })
    return c
  }, [pending])

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setActFor(null); setForm({}) } catch (e) { pushToast(e.message, 'error') }
  }

  const submit = () => {
    const { kind: k, id } = actFor
    const action = form.action || 'approve'
    run(() => {
      if (k === 'sanction') {
        if (action === 'approve') finance.approveSanction({ id, actor, remarks: form.remarks || '' })
        else finance.escalateSanction({ id, actor, remarks: form.remarks || '' })
      } else if (k === 'release') {
        finance.approveRelease({ id, actor, remarks: form.remarks || '', goNumber: form.goNumber || '' })
      } else if (k === 'reappropriation') {
        finance.approveReappropriation({ id, actor, remarks: form.remarks || '' })
      } else {
        projects.actOnProposal({ id, action, actor, remarks: form.remarks || '' })
      }
    }, `${KIND_LABEL[k]} ${actFor.ref} — ${APPROVAL_ACTION_LABELS[action] || action} recorded.`)
  }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Financial Year" value={fy} onChange={setFy} options={FINANCIAL_YEARS.map((f) => ({ value: f.code, label: f.label }))} />
        <SelectField label="Entity Type" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All Types' }, { value: 'sanction', label: 'Sanctions' }, { value: 'release', label: 'Fund Releases' }, { value: 'reappropriation', label: 'Re-appropriations' }, { value: 'proposal', label: 'Project Proposals' }]} />
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card><CardBody><SummaryPill label="Sanctions" value={counts.sanction} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Fund Releases" value={counts.release} tone="saffron" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Re-appropriations" value={counts.reappropriation} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Proposals" value={counts.proposal} tone="leaf" /></CardBody></Card>
      </div>

      <Card>
        <CardHeader title="Pending Approval Inbox" subtitle={`${rows.length} items awaiting action`} icon={Inbox} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending approvals" description="Every submitted matter has been decided. Draft new sanctions or releases to create new approvals." />
          ) : (
            <DataTable
              columns={[
                { key: 'kind', label: 'Type', render: (r) => <Badge tone={r.kind === 'proposal' ? 'positive' : r.kind === 'release' ? 'saffron' : r.kind === 'reappropriation' ? 'warning' : 'info'}>{KIND_LABEL[r.kind]}</Badge> },
                { key: 'ref', label: 'Reference', render: (r) => <span className="font-mono text-[12px]">{r.ref}</span> },
                { key: 'departmentId', label: 'Department', render: (r) => deptName(r.departmentId) },
                { key: 'schemeId', label: 'Scheme', render: (r) => <span className="text-[12.5px]">{schemeName(r.schemeId)}</span> },
                { key: 'amount', label: 'Amount', render: (r) => <span className="font-medium text-ink-900">{formatAmount(r.amount)}</span> },
                { key: 'status', label: 'Stage', render: (r) => <Badge tone="neutral">{r.status === 'drafted' ? 'drafted' : r.status}</Badge> },
                { key: 'createdAt', label: 'Raised', render: (r) => formatDateOnly(r.createdAt) },
                { key: '_', label: '', render: (r) => <Button size="sm" icon={ShieldCheck} onClick={() => setActFor(r)}>Act</Button> },
              ]}
              rows={rows}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>

      {actFor && (
        <Modal open onClose={() => setActFor(null)} title={`${KIND_LABEL[actFor.kind]} — ${actFor.ref}`} footer={<><Button variant="ghost" onClick={() => setActFor(null)}>Cancel</Button><Button icon={ShieldCheck} onClick={submit}>Submit Decision</Button></>}>
          <div className="mb-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">
            {deptName(actFor.departmentId)} · <span className="font-mono">{formatAmount(actFor.amount)}</span> · {KIND_LABEL[actFor.kind]}
          </div>
          <div className="space-y-3">
            <SelectField label="Decision" value={form.action || ''} onChange={(v) => setForm((f) => ({ ...f, action: v }))} options={ALLOWED_ACTIONS[actFor.kind].map((a) => ({ value: a, label: APPROVAL_ACTION_LABELS[a] }))} />
            {actFor.kind === 'release' && <Field label="Fund Release Order Number" value={form.goNumber || ''} onChange={(e) => setForm((f) => ({ ...f, goNumber: e.target.value }))} placeholder={`GO-FR-2026-${actFor.ref.split('-').pop()}`} />}
            <TextAreaField label="Remarks (recorded in audit trail)" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-500">Approval runs the configured workflow + financial authority checks. Amounts above your delegated limit are rejected and must be escalated to the competent authority.</p>
        </Modal>
      )}
    </>
  )
}

function EscalatedView() {
  const { finance, projects, escalated, deptName, schemeName } = useApprovalData()
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const [actFor, setActFor] = useState(null)
  const [form, setForm] = useState({})
  const [kind, setKind] = useState('all')

  const rows = escalated.filter((i) => kind === 'all' || i.kind === kind)

  const run = (fn, ok) => {
    try { fn(); pushToast(ok, 'success'); setActFor(null); setForm({}) } catch (e) { pushToast(e.message, 'error') }
  }

  const submit = () => {
    const action = form.action || 'approve'
    run(() => {
      if (actFor.kind === 'sanction') {
        finance.approveSanction({ id: actFor.id, actor, remarks: form.remarks || '' })
      } else {
        projects.actOnProposal({ id: actFor.id, action, actor, remarks: form.remarks || '' })
      }
    }, `Escalated matter ${actFor.ref} — ${APPROVAL_ACTION_LABELS[action] || action} recorded.`)
  }

  return (
    <>
      <FilterStrip className="mb-5">
        <SelectField label="Entity Type" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All Types' }, { value: 'sanction', label: 'Sanctions' }, { value: 'proposal', label: 'Proposals' }]} />
        <Badge tone="warning" dot>Escalated above delegated authority — competent authority decides</Badge>
      </FilterStrip>

      <Card>
        <CardHeader title="Escalated Matters" subtitle={`${rows.length} items`} icon={AlertOctagon} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={AlertOctagon} title="No escalated matters" description="Nothing is currently escalated above delegated authority." />
          ) : (
            <DataTable
              columns={[
                { key: 'kind', label: 'Type', render: (r) => <Badge tone={r.kind === 'sanction' ? 'info' : 'positive'}>{KIND_LABEL[r.kind]}</Badge> },
                { key: 'ref', label: 'Reference', render: (r) => <span className="font-mono text-[12px]">{r.ref}</span> },
                { key: 'departmentId', label: 'Department', render: (r) => deptName(r.departmentId) },
                { key: 'schemeId', label: 'Scheme', render: (r) => <span className="text-[12.5px]">{schemeName(r.schemeId)}</span> },
                { key: 'amount', label: 'Amount', render: (r) => <span className="font-medium text-ink-900">{formatAmount(r.amount)}</span> },
                { key: '_', label: '', render: (r) => (
                  <span className="flex gap-1.5">
                    <Button size="sm" icon={ShieldCheck} onClick={() => setActFor(r)}>Approve</Button>
                    {r.kind === 'proposal' && <Button size="sm" variant="ghost" icon={Undo2} onClick={() => setActFor({ ...r, forceReturn: true })}>Return</Button>}
                  </span>
                ) },
              ]}
              rows={rows}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>

      {actFor && (
        <Modal open onClose={() => setActFor(null)} title={`${KIND_LABEL[actFor.kind]} — ${actFor.ref}`} footer={<><Button variant="ghost" onClick={() => setActFor(null)}>Cancel</Button><Button icon={ShieldCheck} onClick={submit}>Submit Decision</Button></>}>
          <div className="mb-3 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-[12.5px] text-ink-700">
            Escalated · {deptName(actFor.departmentId)} · <span className="font-mono">{formatAmount(actFor.amount)}</span>
          </div>
          {!actFor.forceReturn && actFor.kind === 'sanction' && (
            <p className="mb-3 rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2 text-[12px] text-saffron-800">Approving this sanction records the competent authority on the approval — the audit trail will carry the authority reference.</p>
          )}
          <div className="space-y-3">
            {actFor.kind === 'proposal' && (
              <SelectField label="Decision" value={form.action || ''} onChange={(v) => setForm((f) => ({ ...f, action: v }))} options={[{ value: 'approve', label: 'Approve (sanction project)' }, { value: 'return', label: 'Return to department' }, { value: 'reject', label: 'Reject' }]} />
            )}
            <TextAreaField label="Remarks" value={form.remarks || ''} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
        </Modal>
      )}
    </>
  )
}

function ApprovalHistoryView() {
  const { history } = useApprovalData()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return history.slice(0, 300)
    return history.filter((h) => `${h.actor} ${h.action} ${h.entity} ${h.entityId} ${h.reason}`.toLowerCase().includes(q)).slice(0, 300)
  }, [history, query])

  return (
    <>
      <FilterStrip className="mb-5">
        <div className="relative">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor / action / reference" className="input-field px-3 py-2 text-[13px]" />
        </div>
        <Badge tone="info">Sourced from the immutable audit log — approvals are never rewritten</Badge>
      </FilterStrip>
      <Card>
        <CardHeader title="Approval History" subtitle={`${rows.length} records`} icon={HistoryIcon} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={HistoryIcon} title="No approval records found" />
          ) : (
            <DataTable
              columns={[
                { key: 'timestamp', label: 'Timestamp', render: (r) => <span className="font-mono text-[11.5px]">{new Date(r.timestamp).toLocaleString('en-IN')}</span> },
                { key: 'actor', label: 'User', render: (r) => <span>{r.actor}<span className="block text-[10.5px] text-ink-400">{r.role}</span></span> },
                { key: 'action', label: 'Action', render: (r) => <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-800">{r.action}</code> },
                { key: 'entity', label: 'Entity', render: (r) => <span className="text-[12.5px]">{r.entity}</span> },
                { key: 'entityId', label: 'Reference', render: (r) => <span className="font-mono text-[11.5px]">{r.entityId}</span> },
                { key: 'detail', label: 'Transition', render: (r) => <span className="text-[12.5px] text-ink-600">{r.detail}</span> },
                { key: 'reason', label: 'Remarks', render: (r) => <span className="text-[12.5px] text-ink-500">{r.reason || '—'}</span> },
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

function formatDateOnly(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}