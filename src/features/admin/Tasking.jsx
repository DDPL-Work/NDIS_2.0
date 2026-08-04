import { useState } from 'react'
import { Send } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import { useAsync } from '../../hooks/useAsync'
import { workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatCurrencyINR, formatDate } from '../../utils/format'

export default function Tasking() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const [busyId, setBusyId] = useState(null)

  const { data: approved, loading: l1, refetch: r1 } = useAsync(() => workflowApi.listProposals({ districtId: user?.districtId, state: 'approved' }), [user?.districtId])
  const { data: budgetApproved, loading: l2, refetch: r2 } = useAsync(() => workflowApi.listProposals({ districtId: user?.districtId, state: 'budget_approved' }), [user?.districtId])
  const { data: tasked, loading: l3 } = useAsync(() => workflowApi.listProposals({ districtId: user?.districtId, state: 'tasked' }), [user?.districtId])

  async function approveBudget(id) {
    setBusyId(id)
    try {
      await workflowApi.transitionProposal(id, 'budget_approved')
      pushToast('Budget approved.', 'success')
      r1()
    } finally {
      setBusyId(null)
    }
  }

  async function issueTasking(id) {
    setBusyId(id)
    try {
      await workflowApi.transitionProposal(id, 'tasked')
      pushToast('Directive issued to line department.', 'success')
      r2()
    } finally {
      setBusyId(null)
    }
  }

  const budgetColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.id}</span> },
    { key: 'title', label: 'Proposal' },
    { key: 'dept', label: 'Department', render: (r) => DEPARTMENT_MAP[r.departmentId]?.label },
    { key: 'requestedAmount', label: 'Requested', render: (r) => formatCurrencyINR(r.requestedAmount) },
    { key: 'action', label: '', render: (r) => (
      <Button size="sm" variant="positive" loading={busyId === r.id} onClick={(e) => { e.stopPropagation(); approveBudget(r.id) }}>Approve budget</Button>
    ) },
  ]

  const taskColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.id}</span> },
    { key: 'title', label: 'Proposal' },
    { key: 'dept', label: 'Department', render: (r) => DEPARTMENT_MAP[r.departmentId]?.label },
    { key: 'approvedAmount', label: 'Approved amount', render: (r) => formatCurrencyINR(r.approvedAmount) },
    { key: 'action', label: '', render: (r) => (
      <Button size="sm" icon={Send} loading={busyId === r.id} onClick={(e) => { e.stopPropagation(); issueTasking(r.id) }}>Issue directive</Button>
    ) },
  ]

  const taskedColumns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.id}</span> },
    { key: 'title', label: 'Proposal' },
    { key: 'dept', label: 'Department', render: (r) => DEPARTMENT_MAP[r.departmentId]?.label },
    { key: 'submittedBy', label: 'Submitted by' },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
    { key: 'when', label: 'Tasked', render: (r) => formatDate(r.slaDueAt) },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · FR-AP-04"
        title="Tasking"
        description="Confirm budget for approved proposals, then issue formal directives to the relevant line department."
      />
      <div className="px-6 pb-8 space-y-6">
        <div className="card">
          <div className="px-5 py-3.5 border-b border-ink-100">
            <h3 className="text-[13.5px] font-semibold text-ink-950">Awaiting budget confirmation</h3>
            <p className="text-[12px] text-ink-500">Approved by ADM/DM — approved_amount must be within delegated approval limit.</p>
          </div>
          {l1 ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={budgetColumns} rows={approved} emptyLabel="Nothing awaiting budget confirmation" />}
        </div>

        <div className="card">
          <div className="px-5 py-3.5 border-b border-ink-100">
            <h3 className="text-[13.5px] font-semibold text-ink-950">Ready for tasking</h3>
            <p className="text-[12px] text-ink-500">Budget confirmed — issue a formal directive to the department officer.</p>
          </div>
          {l2 ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={taskColumns} rows={budgetApproved} emptyLabel="Nothing ready for tasking" />}
        </div>

        <div className="card">
          <div className="px-5 py-3.5 border-b border-ink-100">
            <h3 className="text-[13.5px] font-semibold text-ink-950">Recently tasked</h3>
          </div>
          {l3 ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={taskedColumns} rows={tasked} emptyLabel="No directives issued yet" />}
        </div>
      </div>
    </div>
  )
}
