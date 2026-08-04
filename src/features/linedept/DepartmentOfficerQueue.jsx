import { useState, useMemo } from 'react'
import {
  Inbox, CheckCircle2, AlertTriangle, Clock, MapPin, Search, Filter, Layers,
  ChevronRight, Building2, User, Flame, ArrowRight
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import MapView from '../../components/map/MapView'
import Modal from '../../components/ui/Modal'
import ComplaintDetailHub from '../shared/ComplaintDetailHub'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { DEPARTMENT_MAP, DEPARTMENTS } from '../../config/constants'
import { formatDate, formatDateTime } from '../../utils/format'

export default function DepartmentOfficerQueue() {
  const user = useAuthStore((s) => s.user)
  const deptId = user?.departmentId || 'water'
  const dept = DEPARTMENT_MAP[deptId] || DEPARTMENT_MAP.water

  const complaints = useComplaintEngine((s) => s.complaints)

  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  const [viewMode, setViewMode] = useState('queue') // 'queue' | 'gis'

  // Filter department complaints
  const deptComplaints = useMemo(() => {
    return complaints.filter((c) => c.departmentId === deptId || user?.role === 'dm' || user?.role === 'district_collector')
  }, [complaints, deptId, user?.role])

  const filtered = useMemo(() => {
    return deptComplaints.filter((c) => {
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
      if (stateFilter !== 'all' && c.state !== stateFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          c.title.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.location.village.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [deptComplaints, priorityFilter, stateFilter, query])

  // KPIs
  const stats = useMemo(() => {
    const now = Date.now()
    return {
      assignedToday: deptComplaints.filter((c) => new Date(c.createdAt).getTime() > now - 24 * 3600 * 1000).length,
      pending: deptComplaints.filter((c) => ['submitted', 'assigned', 'accepted'].includes(c.state)).length,
      inProgress: deptComplaints.filter((c) => ['inspection_scheduled', 'inspection_completed', 'work_started'].includes(c.state)).length,
      resolved: deptComplaints.filter((c) => ['resolved', 'closed'].includes(c.state)).length,
      escalated: deptComplaints.filter((c) => c.state === 'escalated').length,
      slaBreached: deptComplaints.filter((c) => new Date(c.slaDueAt).getTime() < now && !['resolved', 'closed'].includes(c.state)).length,
    }
  }, [deptComplaints])

  const columns = [
    { key: 'id', label: 'Ticket ID', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Complaint Title', render: (r) => <span className="font-semibold text-ink-900">{r.title}</span> },
    { key: 'village', label: 'Location', render: (r) => `${r.location.village}, ${r.location.ward}` },
    { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'urgent' || r.priority === 'high' ? 'warning' : 'info'}>{r.priority.toUpperCase()}</Badge> },
    { key: 'sla', label: 'SLA Due', render: (r) => <span className="font-mono text-[11.5px]">{formatDateTime(r.slaDueAt)}</span> },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  // Map view points
  const mapFacilities = useMemo(() => {
    return filtered.map((c) => ({
      id: c.id,
      name: c.title,
      departmentId: c.departmentId,
      categoryLabel: c.categoryName,
      status: c.state === 'resolved' || c.state === 'closed' ? 'active' : 'inactive',
      gapScore: c.priority === 'urgent' ? 0.9 : c.priority === 'high' ? 0.7 : 0.4,
      position: c.location.position,
    }))
  }, [filtered])

  return (
    <div>
      <PageHeader
        eyebrow={`Department Officer Workspace · ${dept.label}`}
        title="Assigned Complaints Queue & Workflows"
        description={`Manage, accept, assign field inspectors, and resolve citizen grievances for ${dept.label}.`}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'queue' ? 'saffron' : 'outline'}
              icon={Inbox}
              onClick={() => setViewMode('queue')}
            >
              Queue View
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'gis' ? 'saffron' : 'outline'}
              icon={MapPin}
              onClick={() => setViewMode('gis')}
            >
              GIS Spatial View
            </Button>
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Assigned Today" value={stats.assignedToday} icon={Inbox} tone="ink" />
        <StatCard label="Pending Queue" value={stats.pending} icon={Clock} tone="saffron" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Building2} tone="sky" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="leaf" />
        <StatCard label="Escalated" value={stats.escalated} icon={AlertTriangle} tone="alert" />
        <StatCard label="SLA Breached" value={stats.slaBreached} icon={Flame} tone="alert" sub="Attention Needed" />
      </div>

      {/* Queue & Filters Bar */}
      <div className="p-6 space-y-4">
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ticket ID, title, or village…"
              className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-1.5 text-[12.5px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              small
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />

            <Select
              small
              value={stateFilter}
              onChange={setStateFilter}
              options={[
                { value: 'all', label: 'All States' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'work_started', label: 'Work Started' },
                { value: 'escalated', label: 'Escalated' },
                { value: 'resolved', label: 'Resolved' },
              ]}
            />
          </div>
        </div>

        {/* View Mode 1: Table Queue */}
        {viewMode === 'queue' && (
          <div className="card">
            <DataTable
              columns={columns}
              rows={filtered}
              onRowClick={(row) => setSelectedComplaintId(row.id)}
            />
          </div>
        )}

        {/* View Mode 2: GIS Map */}
        {viewMode === 'gis' && (
          <div className="h-[480px] rounded-2xl overflow-hidden card relative">
            <MapView
              center={[85.4434, 25.1372]}
              zoom={11}
              facilities={mapFacilities}
              colorBy="gap"
              onFacilityClick={(id) => setSelectedComplaintId(id)}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Complaint Detail Hub Modal */}
      <Modal
        open={!!selectedComplaintId}
        onClose={() => setSelectedComplaintId(null)}
        width="max-w-4xl"
      >
        {selectedComplaintId && (
          <ComplaintDetailHub
            complaintId={selectedComplaintId}
            onClose={() => setSelectedComplaintId(null)}
          />
        )}
      </Modal>
    </div>
  )
}
