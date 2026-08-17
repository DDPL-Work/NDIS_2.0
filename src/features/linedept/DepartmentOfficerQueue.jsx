import { useState, useMemo, useEffect } from 'react'
import {
  Inbox, CheckCircle2, AlertTriangle, Clock, MapPin, Search,
  Building2, Flame, RefreshCw
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
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/ui/Pagination'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatDateTime } from '../../utils/format'

export default function DepartmentOfficerQueue() {
  const user = useAuthStore((s) => s.user)
  const deptId = user?.departmentId || 'water'
  const dept = DEPARTMENT_MAP[deptId] || DEPARTMENT_MAP.water

  const complaints = useComplaintEngine((s) => s.complaints)
  const hydrationStatus = useComplaintEngine((s) => s.hydrationStatus)
  const hydrate = useComplaintEngine((s) => s.hydrate)
  const refresh = useComplaintEngine((s) => s.refresh)

  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [selectedComplaintId, setSelectedComplaintId] = useState(null)
  const [viewMode, setViewMode] = useState('queue') // 'queue' | 'gis'

  // Re-hydrate whenever the signed-in user becomes available so the role-scoped
  // backend list (GET /api/complaints/) populates the queue after login.
  useEffect(() => {
    if (user && hydrationStatus === 'error') hydrate()
  }, [user, hydrationStatus, hydrate])

  // Backend already returns exactly the complaints visible to the logged-in
  // role (Department Head / Department Officer / Executive Engineer).  We must
  // NOT filter by department client-side — doing so would empty the queue for
  // roles whose department slug resolution differs from the backend's.
  const deptComplaints = complaints

  const filtered = useMemo(() => {
    return deptComplaints.filter((c) => {
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
      if (stateFilter !== 'all' && c.state !== stateFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return (
          c.title.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.trackingCode?.toLowerCase().includes(q) ||
          c.location.village.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [deptComplaints, priorityFilter, stateFilter, query])

  const { page, setPage, pageEntries, pageCount, pageSize, total } = usePagination(filtered, 10)

  // KPIs
  const stats = useMemo(() => {
    const now = Date.now()
    return {
      assignedToday: deptComplaints.filter((c) => new Date(c.createdAt).getTime() > now - 24 * 3600 * 1000).length,
      pending: deptComplaints.filter((c) => ['submitted', 'assigned', 'accepted', 'reopened', 'transferred'].includes(c.state)).length,
      inProgress: deptComplaints.filter((c) => ['inspection_started', 'evidence_uploaded'].includes(c.state)).length,
      resolved: deptComplaints.filter((c) => ['resolved', 'closed'].includes(c.state)).length,
      escalated: deptComplaints.filter((c) => c.state === 'escalated').length,
      slaBreached: deptComplaints.filter((c) => c.slaDueAt && new Date(c.slaDueAt).getTime() < now && !['resolved', 'closed'].includes(c.state)).length,
    }
  }, [deptComplaints])

  const columns = [
    { key: 'id', label: 'Ticket ID', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span>, hideOn: 'sm' },
    { key: 'title', label: 'Complaint Title', render: (r) => <span className="font-semibold text-ink-900">{r.title}</span> },
    { key: 'village', label: 'Location', render: (r) => `${r.location.village}, ${r.location.ward}`, hideOn: 'md' },
    { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'urgent' || r.priority === 'high' ? 'warning' : 'info'}>{r.priority.toUpperCase()}</Badge> },
    { key: 'sla', label: 'SLA Due', render: (r) => <span className="font-mono text-[11.5px]">{r.slaDueAt ? formatDateTime(r.slaDueAt) : '—'}</span> },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  // Map view points
  const mapFacilities = useMemo(() => {
    return filtered
      .filter((c) => Array.isArray(c.location?.position) && c.location.position.length >= 2)
      .map((c) => ({
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
                { value: 'accepted', label: 'Accepted' },
                { value: 'inspection_started', label: 'Inspection Started' },
                { value: 'evidence_uploaded', label: 'Evidence Uploaded' },
                { value: 'escalated', label: 'Escalated' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />

            <Button
              size="sm"
              variant="outline"
              icon={RefreshCw}
              onClick={() => refresh()}
              title="Reload from backend"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* View Mode 1: Table Queue */}
        {viewMode === 'queue' && (
          <div className="card">
            {hydrationStatus === 'loading' && (
              <div className="p-6 space-y-3">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="h-11 rounded-lg bg-ink-100 animate-pulse" />
                ))}
              </div>
            )}
            {hydrationStatus === 'error' && (
              <div className="p-6 text-center text-[12.5px] text-alert-600">
                Unable to load complaints. Check the backend connection and refresh.
              </div>
            )}
            {hydrationStatus !== 'loading' && hydrationStatus !== 'error' && filtered.length === 0 && (
              <div className="p-10 text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-ink-100 text-ink-400 mb-3">
                  <Inbox size={20} />
                </div>
                <p className="text-[13px] font-semibold text-ink-800">No complaints in your queue</p>
                <p className="text-[12px] text-ink-500 mt-1 max-w-md mx-auto">
                  {hydrationStatus === 'ready' && complaints.length === 0
                    ? 'The backend returned no visible complaints for your role. If you expect records, verify your JWT session is active.'
                    : 'No records match the current filters.'}
                </p>
              </div>
            )}
            {hydrationStatus !== 'loading' && hydrationStatus !== 'error' && filtered.length > 0 && (
              <>
                <DataTable
                  columns={columns}
                  rows={pageEntries}
                  onRowClick={(row) => setSelectedComplaintId(row.id)}
                />
                <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onChange={setPage} />
              </>
            )}
          </div>
        )}

        {/* View Mode 2: GIS Map */}
        {viewMode === 'gis' && (
          <div className="h-[clamp(300px,42vh,480px)] rounded-2xl overflow-hidden card relative">
            <MapView
              center={[85.4434, 25.1372]}
              zoom={11}
              facilities={mapFacilities}
              colorBy="gap"
              onFacilityClick={(facility) => setSelectedComplaintId(facility.id)}
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
