import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Select from '../../components/ui/Select'
import { useAsync } from '../../hooks/useAsync'
import { workflowApi } from '../../services/api'
import { DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'
import { formatDate, daysUntil } from '../../utils/format'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function GrievanceOversight() {
  const [tab, setTab] = useState('escalated')
  const [deptFilter, setDeptFilter] = useState('all')

  const { data: grievances, loading } = useAsync(
    () => workflowApi.listGrievances({ state: tab === 'all' ? undefined : tab, departmentId: deptFilter === 'all' ? undefined : deptFilter }),
    [tab, deptFilter]
  )

  const columns = [
    { key: 'id', label: 'Tracking Code', render: (r) => <span className="kbd-mono text-[12px]">{r.trackingCode}</span> },
    { key: 'title', label: 'Issue', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department', render: (r) => DEPARTMENT_MAP[r.departmentId]?.label },
    { key: 'village', label: 'Location' },
    { key: 'submittedAt', label: 'Submitted', render: (r) => formatDate(r.submittedAt) },
    { key: 'sla', label: 'SLA', render: (r) => {
      const d = daysUntil(r.slaDueAt)
      return <span className={d < 0 ? 'text-alert-600 font-semibold' : 'text-ink-600'}>{d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}</span>
    } },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · FR-XC-02"
        title="Grievance oversight"
        description="Cross-department view of citizen complaints, with SLA breach escalations surfaced first."
        action={
          <Select
            value={deptFilter}
            onChange={setDeptFilter}
            options={[{ value: 'all', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))]}
          />
        }
      />
      <div className="px-6"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>
      <div className="p-6">
        <div className="card">
          {loading ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={columns} rows={grievances} />}
        </div>
      </div>
    </div>
  )
}
