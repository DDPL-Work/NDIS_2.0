import { useState, useMemo } from 'react'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Select from '../../components/ui/Select'
import { useAsync } from '../../hooks/useAsync'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/ui/Pagination'
import { workflowApi } from '../../services/api'
import { useDepartments } from '../../hooks/useDepartments'
import { DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'
import { formatDate, daysUntil } from '../../utils/format'

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'inspection_started', label: 'Inspection' },
  { value: 'resolved', label: 'Resolved' },
]

export default function GrievanceOversight() {
  const [tab, setTab] = useState('escalated')
  const [deptFilter, setDeptFilter] = useState('all')

  // Backend /api/departments/ (numeric ids) when available so the filter
  // sends real pks; the legacy slug constants only fill in while loading.
  const { data: departmentsData } = useDepartments()
  const departments = departmentsData && departmentsData.length ? departmentsData : DEPARTMENTS

  const { data: grievances, loading } = useAsync(
    () => workflowApi.listGrievances({ state: tab === 'all' || tab === 'resolved' ? undefined : tab, departmentId: deptFilter === 'all' ? undefined : deptFilter }),
    [tab, deptFilter, departmentsData]
  )

  // A closed complaint means the citizen closed it after verifying the fix —
  // i.e. it HAS been resolved.  The backend only supports a single exact
  // status filter, so resolved + closed are merged here (resolved is the
  // department's resolution pending citizen verification; closed is the
  // citizen-confirmed resolution).
  const rows = useMemo(() => {
    if (tab !== 'resolved' || !grievances) return grievances
    return grievances.filter((g) => g.state === 'resolved' || g.state === 'closed')
  }, [grievances, tab])

  const { page, setPage, pageEntries, pageCount, pageSize, total } = usePagination(rows || [], 10)

  const columns = [
    { key: 'id', label: 'Tracking Code', render: (r) => <span className="kbd-mono text-[12px]">{r.trackingCode}</span> },
    { key: 'title', label: 'Issue', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dept', label: 'Department', render: (r) => r.departmentName || DEPARTMENT_MAP[r.departmentId]?.label || '—' },
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
            options={[{ value: 'all', label: 'All departments' }, ...departments.map((d) => ({ value: String(d.id), label: d.name || d.label || d.name }))]}
          />
        }
      />
      <div className="px-6"><Tabs tabs={TABS} active={tab} onChange={setTab} /></div>
      <div className="p-6">
        <div className="card">
          {loading ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={columns} rows={pageEntries} />}
          {!loading && <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onChange={setPage} />}
        </div>
      </div>
    </div>
  )
}
