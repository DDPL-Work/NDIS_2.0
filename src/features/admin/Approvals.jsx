// Approvals Page — Vol 3 §15.3 Workflow Approval Pipeline & Delegation Limits.
import { useState } from 'react'
import { AlertCircle, ShieldAlert, CheckCircle2, FileText, Info } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import WorkflowStepper from '../../components/ui/WorkflowStepper'
import ProposalTimeline from '../shared/ProposalTimeline'
import { useAsync } from '../../hooks/useAsync'
import { workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'
import { formatCurrencyINR, formatDate, formatNumber } from '../../utils/format'

const TABS = [
  { value: 'under_review', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All proposals' },
]

export default function Approvals() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const [tab, setTab] = useState('under_review')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: proposals, loading, refetch } = useAsync(
    () => workflowApi.listProposals({ districtId: user?.districtId, state: tab === 'all' ? undefined : tab, departmentId: deptFilter === 'all' ? undefined : deptFilter }),
    [tab, deptFilter, user?.districtId]
  )

  async function handleDecision(nextState) {
    setBusy(true)
    try {
      await workflowApi.transitionProposal(selected.id, nextState, remarks)
      pushToast(`Proposal ${selected.id} ${nextState === 'approved' ? 'approved' : 'rejected'}.`, nextState === 'approved' ? 'success' : 'warning')
      setSelected(null)
      setRemarks('')
      refetch()
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.id}</span> },
    { key: 'title', label: 'Proposal', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department', render: (r) => DEPARTMENT_MAP[r.departmentId]?.label },
    {
      key: 'amount',
      label: 'Requested',
      render: (r) => (
        <span className={r.requestedAmount > 5000000 ? 'text-saffron-700 font-semibold' : ''}>
          {formatCurrencyINR(r.requestedAmount)}
        </span>
      ),
    },
    {
      key: 'delegation',
      label: 'Authority',
      render: (r) => (
        <Badge tone={r.requestedAmount > 5000000 ? 'warning' : 'info'}>
          {r.requestedAmount > 5000000 ? 'State Govt' : 'DM Delegated'}
        </Badge>
      ),
    },
    { key: 'submittedAt', label: 'Submitted', render: (r) => formatDate(r.submittedAt) },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · FR-AP-03"
        title="Proposal approvals & delegation engine"
        description="Review, approve or reject line-department proposals. Delegation rules: DM approves ≤ ₹50 Lakhs; > ₹50 Lakhs flags State Govt escalation."
        action={
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            options={[{ value: 'all', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))]}
          />
        }
      />
      <div className="px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div className="p-6">
        <div className="card">
          {loading ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={columns} rows={proposals} onRowClick={setSelected} />}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setRemarks('') }}
        title={selected?.title}
        width="max-w-2xl"
        footer={
          selected?.state === 'under_review' ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button variant="danger" loading={busy} onClick={() => handleDecision('rejected')}>Reject</Button>
              <Button variant="positive" loading={busy} onClick={() => handleDecision('approved')}>Approve Proposal</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Visual Workflow Lifecycle Stepper */}
            <div className="p-3 bg-ink-50/50 rounded-xl border border-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Workflow Lifecycle Progress</p>
              <WorkflowStepper currentState={selected.state} history={selected.history} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.state} />
              <span className="text-[12px] text-ink-500 kbd-mono">{selected.id}</span>
            </div>

            {/* Delegation Limit Banner */}
            {selected.requestedAmount > 5000000 ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-saffron-50 border border-saffron-200 text-[12.5px] text-saffron-800">
                <ShieldAlert size={16} className="text-saffron-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">State Government Approval Flagged (&gt; ₹50 Lakhs)</span>
                  <p className="text-[11.5px] text-saffron-700 mt-0.5">
                    This proposal exceeds the District Magistrate delegated financial limit (₹50,00,000). DM approval will forward to State Secretariat for final sanction.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-leaf-50 border border-leaf-200 text-[12px] text-leaf-800">
                <CheckCircle2 size={15} className="text-leaf-600 shrink-0" />
                <span>DM Delegated Financial Authority (within ₹50 Lakhs limit). Direct approval allowed.</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px] p-3 bg-white border border-ink-100 rounded-xl">
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Department</p><p className="font-medium text-ink-900">{DEPARTMENT_MAP[selected.departmentId]?.label}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Village</p><p className="font-medium text-ink-900">{selected.village}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Requested Amount</p><p className="font-medium text-ink-900">{formatCurrencyINR(selected.requestedAmount)}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Submitted By</p><p className="font-medium text-ink-900">{selected.submittedBy}</p></div>
            </div>

            {selected.state === 'under_review' && (
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

            {selected.remarks && (
              <div className="rounded-lg bg-alert-50 border border-alert-200 p-3 text-[12.5px] text-alert-700">
                <strong className="block text-[11px] uppercase tracking-wide text-alert-800">Remarks History:</strong>
                {selected.remarks}
              </div>
            )}

            <div className="h-px bg-ink-100" />
            <h4 className="text-[12.5px] font-semibold text-ink-800">Audit History Log</h4>
            <ProposalTimeline history={selected.history} />
          </div>
        )}
      </Modal>
    </div>
  )
}
