import { useState, useMemo } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import StatusBadge from '../../../components/ui/StatusBadge'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import ComplaintDetailHub from '../../shared/ComplaintDetailHub'
import { useDepartment } from '../framework/DepartmentContext'
import { usePagination } from '../../../hooks/usePagination'
import Pagination from '../../../components/ui/Pagination'
import { formatDateTime } from '../../../utils/format'

export default function DepartmentWorkflowWorkspace() {
  const { dept, complaints } = useDepartment()

  const [activeStateTab, setActiveStateTab] = useState('all')
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  const filteredTickets = useMemo(() => {
    if (activeStateTab === 'all') return complaints
    if (activeStateTab === 'pending') return complaints.filter((c) => ['submitted', 'assigned', 'accepted'].includes(c.state))
    if (activeStateTab === 'in_progress') return complaints.filter((c) => ['inspection_started', 'evidence_uploaded'].includes(c.state))
    if (activeStateTab === 'escalated') return complaints.filter((c) => c.state === 'escalated')
    if (activeStateTab === 'completed') return complaints.filter((c) => ['resolved', 'closed'].includes(c.state))
    return complaints
  }, [complaints, activeStateTab])

  const { page, setPage, pageEntries, pageCount, pageSize, total } = usePagination(filteredTickets, 10)

  const columns = [
    { key: 'id', label: 'Ticket Code', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Complaint Title', render: (r) => <span className="font-semibold text-ink-900">{r.title}</span> },
    { key: 'village', label: 'Village', render: (r) => r.location?.village || '—' },
    { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'urgent' ? 'negative' : 'warning'}>{r.priority.toUpperCase()}</Badge> },
    { key: 'slaDueAt', label: 'SLA Due', render: (r) => <span className="font-mono text-[11.5px]">{formatDateTime(r.slaDueAt)}</span> },
    { key: 'state', label: 'Workflow State', render: (r) => <StatusBadge status={r.state} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Workflow Engine · ${dept.code}`}
        title={`${dept.label} Workflow Operations Queue`}
        description="Departmental workflow inbox, approvals, field tasking, and state transition machine."
      />

      <div className="px-6 space-y-4">
        {/* Filter State Tabs */}
        <div className="card p-1 flex gap-1 bg-ink-100 w-fit text-[12.5px] font-medium">
          <button
            onClick={() => setActiveStateTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${activeStateTab === 'all' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            All Queue ({complaints.length})
          </button>
          <button
            onClick={() => setActiveStateTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${activeStateTab === 'pending' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveStateTab('in_progress')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${activeStateTab === 'in_progress' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setActiveStateTab('escalated')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${activeStateTab === 'escalated' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            Escalated
          </button>
          <button
            onClick={() => setActiveStateTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${activeStateTab === 'completed' ? 'bg-white text-ink-950 font-semibold shadow-xs' : 'text-ink-600'}`}
          >
            Completed
          </button>
        </div>

        {/* Workflow Table */}
        <div className="card">
          <DataTable
            columns={columns}
            rows={pageEntries}
            onRowClick={(row) => setSelectedTicketId(row.id)}
          />
          <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onChange={setPage} />
        </div>
      </div>

      <Modal open={!!selectedTicketId} onClose={() => setSelectedTicketId(null)} width="max-w-4xl">
        {selectedTicketId && <ComplaintDetailHub complaintId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />}
      </Modal>
    </div>
  )
}
