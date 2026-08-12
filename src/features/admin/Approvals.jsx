// Approvals Page — Vol 3 §15.3 Workflow Approval Pipeline.
// Backend-driven: rows come from GET /api/proposals/ and decisions are the
// backend's own approve / reject / sanction actions (backend_guide2.1 §6.3).
import { useMemo, useState } from 'react'
import { CheckCircle2, Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import WorkflowStepper from '../../components/ui/WorkflowStepper'
import { useUiStore } from '../../app/store/uiStore'
import { useAsync } from '../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../app/store/dataVersionStore'
import { backendProposalApi } from '../../api/proposalApi'
import { backendDepartmentApi } from '../../api/departmentApi'
import { formatCurrencyINR, formatDate } from '../../utils/format'

const TABS = [
  { value: 'under_review', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All proposals' },
]

const TAB_STATUS = { under_review: 'PENDING_REVIEW', approved: 'APPROVED', rejected: 'REJECTED', all: null }

// Legacy 8-stage stepper vocabulary — presentation only, the backend status
// is never rewritten. Statuses without a sensible stepper stage hide it.
const STEPPER_STATE = {
  DRAFT_DPR: 'draft',
  PENDING_REVIEW: 'under_review',
  APPROVED: 'under_review',
  SANCTIONED: 'budget_approved',
  IN_EXECUTION: 'tasked',
}

export default function Approvals() {
  const pushToast = useUiStore((s) => s.pushToast)
  const [tab, setTab] = useState('under_review')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [sanctionOpen, setSanctionOpen] = useState(false)
  const [sanctionAmount, setSanctionAmount] = useState('')
  const [busyAction, setBusyAction] = useState(null)
  const [actionError, setActionError] = useState(null)
  const versions = useDataVersion((s) => (s.versions[DATA_SCOPES.PROPOSALS] || 0) + (s.versions[DATA_SCOPES.PLANNING] || 0))

  const { data: departments } = useAsync(() => backendDepartmentApi.list(), [])
  const deptOptions = useMemo(() => [{ value: 'all', label: 'All departments' }, ...(departments || []).map((d) => ({ value: d.id, label: d.name }))], [departments])

  const status = TAB_STATUS[tab]
  const deptPk = deptFilter === 'all' ? undefined : Number(deptFilter)
  const fetcher = useMemo(() => () => backendProposalApi.list({ ...(status ? { status } : {}), ...(deptPk ? { departmentId: deptPk } : {}) }), [status, deptPk])
  const { data: proposals, loading, error, refetch } = useAsync(fetcher, [tab, deptPk, versions])
  const rows = proposals || []

  async function runAction(action, fn, okMessage) {
    setBusyAction(action)
    setActionError(null)
    try {
      await fn()
      pushToast(okMessage, 'success')
      setSelected(null)
      setRemarks('')
      setSanctionOpen(false)
    } catch (e) { setActionError(e) } finally { setBusyAction(null) }
  }

  const approve = () => runAction('approve', () => backendProposalApi.approve(selected.id), `Proposal ${selected.proposalId} approved.`)
  const reject = () => {
    if (!remarks.trim()) { pushToast('Remarks are required to reject.', 'error'); return }
    runAction('reject', () => backendProposalApi.reject(selected.id, { review_notes: remarks.trim() }), `Proposal ${selected.proposalId} rejected.`)
  }
  const sanction = () => {
    const amount = Number(sanctionAmount)
    if (!Number.isFinite(amount) || amount <= 0) { pushToast('Enter a valid sanctioned amount.', 'error'); return }
    runAction('sanction', () => backendProposalApi.sanction(selected.id, { sanctioned_amount: amount }), `Proposal ${selected.proposalId} sanctioned.`)
  }

  const columns = [
    { key: 'proposalId', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.proposalId}</span> },
    { key: 'title', label: 'Proposal', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department', render: (r) => r.departmentName || '—' },
    { key: 'amount', label: 'Requested', render: (r) => formatCurrencyINR(r.estimatedCost) },
    { key: 'delegation', label: 'Authority', render: (r) => (r.delegatedPowerNote ? <Badge tone="info">{r.delegatedPowerNote}</Badge> : '—') },
    { key: 'submittedAt', label: 'Submitted', render: (r) => (r.createdAt ? formatDate(r.createdAt) : '—') },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const isPending = selected?.status === 'PENDING_REVIEW'
  const isApproved = selected?.status === 'APPROVED'

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · FR-AP-03"
        title="Proposal approvals & delegation engine"
        description="Review, approve, reject or sanction line-department DPR proposals prepared in the Development Planning ERP."
        action={
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            options={deptOptions}
          />
        }
      />
      <div className="px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div className="p-6">
        <div className="card">
          {error ? (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-red-700">{error.message}</p>
              <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
            </div>
          ) : loading && !rows.length ? (
            <p className="px-4 py-4 text-sm text-ink-500">Loading proposals…</p>
          ) : (
            <DataTable columns={columns} rows={rows} onRowClick={setSelected} emptyLabel="No proposals in this view" />
          )}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setRemarks(''); setActionError(null) }}
        title={selected?.title}
        width="max-w-2xl"
        footer={
          isPending ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button variant="danger" loading={busyAction === 'reject'} onClick={reject}>Reject</Button>
              <Button variant="positive" loading={busyAction === 'approve'} onClick={approve}>Approve Proposal</Button>
            </>
          ) : isApproved ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button variant="positive" loading={busyAction === 'sanction'} onClick={() => { setSanctionAmount(selected.estimatedCost ? String(selected.estimatedCost) : ''); setSanctionOpen(true) }}>Sanction Budget</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            {STEPPER_STATE[selected.status] && (
              <div className="p-3 bg-ink-50/50 rounded-xl border border-ink-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Workflow Lifecycle Progress</p>
                <WorkflowStepper currentState={STEPPER_STATE[selected.status]} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-[12px] text-ink-500 kbd-mono">{selected.proposalId}</span>
            </div>

            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>
            )}

            {/* Financial delegation note — issued by the backend */}
            {selected.delegatedPowerNote ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-leaf-50 border border-leaf-200 text-[12.5px] text-leaf-800">
                <CheckCircle2 size={16} className="text-leaf-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Financial delegation</span>
                  <p className="text-[11.5px] text-leaf-700 mt-0.5">{selected.delegatedPowerNote}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-ink-50 border border-ink-100 text-[12.5px] text-ink-600">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>The delegation note is issued by the backend once the DPR is costed.</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px] p-3 bg-white border border-ink-100 rounded-xl">
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Department</p><p className="font-medium text-ink-900">{selected.departmentName || '—'}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Village</p><p className="font-medium text-ink-900">{selected.village || '—'}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Block</p><p className="font-medium text-ink-900">{selected.block || '—'}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Submitted By</p><p className="font-medium text-ink-900">{selected.createdByName || '—'}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Estimated Cost</p><p className="font-medium text-ink-900">{selected.costFormatted || formatCurrencyINR(selected.estimatedCost)}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Stage</p><p className="font-medium text-ink-900">{selected.stageDisplay || selected.stage || '—'}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Linked Complaints</p><p className="font-medium text-ink-900">{selected.linkedComplaintIds.length}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Population Impact</p><p className="font-medium text-ink-900">{selected.populationImpact}</p></div>
            </div>

            {isPending && (
              <div>
                <label className="block text-[12px] font-medium text-ink-700 mb-1">Administrative Remarks (Mandatory to reject)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                  placeholder="Enter approval remarks or reason for rejection…"
                />
              </div>
            )}

            {(selected.reviewNotes || selected.reviewedByName || selected.approvedByName) && (
              <div>
                <div className="h-px bg-ink-100" />
                <h4 className="mt-2 text-[12.5px] font-semibold text-ink-800">Review Trail</h4>
                {selected.reviewNotes && (
                  <div className="mt-2 rounded-lg bg-alert-50 border border-alert-200 p-3 text-[12.5px] text-alert-700">
                    <strong className="block text-[11px] uppercase tracking-wide text-alert-800">Reviewer Note</strong>
                    {selected.reviewNotes}
                    {selected.reviewedByName && <span className="block mt-1 text-[11.5px] text-alert-600">— {selected.reviewedByName}{selected.reviewedAt ? `, ${formatDate(selected.reviewedAt)}` : ''}</span>}
                  </div>
                )}
                {selected.approvedByName && (
                  <div className="mt-2 rounded-lg bg-leaf-50 border border-leaf-200 p-3 text-[12.5px] text-leaf-800">
                    <strong className="block text-[11px] uppercase tracking-wide text-leaf-700">Approved</strong>
                    {selected.approvedByName}{selected.approvedAt ? `, ${formatDate(selected.approvedAt)}` : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={sanctionOpen}
        onClose={() => setSanctionOpen(false)}
        title={selected ? `Sanction budget — ${selected.proposalId}` : 'Sanction budget'}
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSanctionOpen(false)}>Cancel</Button>
            <Button variant="positive" loading={busyAction === 'sanction'} onClick={sanction}>Sanction</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">Sanctioned amount (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={sanctionAmount}
              onChange={(e) => setSanctionAmount(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="e.g. 12000000"
            />
          </div>
          <p className="text-[12px] text-ink-500">Issues the sanction order number and moves the proposal into execution on the backend.</p>
        </div>
      </Modal>
    </div>
  )
}
