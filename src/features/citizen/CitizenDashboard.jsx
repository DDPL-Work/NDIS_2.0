import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, CheckCircle2, Clock, Droplets, FileText,
  GraduationCap, HeartPulse, MapPin, PlusCircle, RefreshCw, Search,
  SearchCheck, TriangleAlert,
} from 'lucide-react'
import clsx from 'clsx'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import CitizenComplaintDetail from './CitizenComplaintDetail'
import ComplaintStatusStepper, { complaintStateLabel } from './ComplaintStatusStepper'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useAsync } from '../../hooks/useAsync'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/ui/Pagination'
import { analyticsApi } from '../../services/api'
import { useI18n } from '../../i18n/i18n'

const value = (data, keys) => keys.reduce((found, key) => found ?? data?.[key], undefined) ?? 0

// Quick actions — every card is a real navigation, never a placeholder.
const QUICK_ACTIONS = [
  { icon: MapPin, title: 'Find Nearby', text: 'Facilities around you', to: '/citizen/map?near=1', tour: 'citizen-quick-nearby' },
  { icon: TriangleAlert, title: 'Report a Problem', text: 'Register a complaint', to: '/citizen/register', tour: 'citizen-quick-report' },
  { icon: SearchCheck, title: 'Track a Request', text: 'Follow your complaint', to: '/citizen/track', tour: 'citizen-quick-track' },
  { icon: HeartPulse, title: 'Find Healthcare', text: 'Hospitals and PHCs', to: '/citizen/map?dept=health' },
  { icon: GraduationCap, title: 'Find a School', text: 'Nearby schools', to: '/citizen/map?dept=education' },
  { icon: Droplets, title: 'Find Water Facility', text: 'Water points near you', to: '/citizen/map?dept=water' },
]

const SEARCH_CHIPS = [
  { label: 'Find a hospital', query: 'hospital' },
  { label: 'Find a school', query: 'school' },
  { label: 'Report a road problem', action: '/citizen/register' },
  { label: 'Track my complaint', action: '/citizen/track' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
]

const isActive = (state) => !['closed', 'resolved', 'verification_pending', 'cancelled', 'rejected', 'draft'].includes(state)

export default function CitizenDashboard() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const { t } = useI18n()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  // Re-fetch the aggregate dashboard whenever the complaint engine invalidates
  // (after any feedback / close / reopen / escalation mutation).
  const dataVersion = useComplaintEngine((s) => s.dataVersion)
  const { data, loading, error, refetch } = useAsync(() => analyticsApi.getCitizenDashboard(), [dataVersion])
  const complaints = data?.myComplaints || data?.complaints || []

  const stats = complaints.length
    ? {
        active: complaints.filter((c) => isActive(c.state)).length,
        review: complaints.filter((c) => ['resolved', 'verification_pending'].includes(c.state)).length,
        escalated: complaints.filter((c) => c.state === 'escalated').length,
        total: complaints.length,
      }
    : {
        active: value(data, ['pending_complaints', 'active', 'active_count', 'pending']),
        review: value(data, ['resolved_complaints', 'awaiting_feedback', 'awaiting_verification', 'review']),
        escalated: value(data, ['escalated_complaints', 'escalated', 'escalated_count']),
        total: value(data, ['total_complaints', 'total', 'total_count', 'complaint_count']),
      }

  const visibleComplaints = complaints.filter((c) => {
    if (statusFilter === 'active') return isActive(c.state)
    if (statusFilter === 'resolved') return !isActive(c.state)
    return true
  })
  const { page, setPage, pageEntries, pageCount, pageSize, total } = usePagination(visibleComplaints, 5)
  const firstName = String(user?.name || '').split(' ')[0] || 'Citizen'
  const hour = new Date().getHours()

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6" data-tour="citizen-dashboard-main">
      {/* Greeting */}
      <div className="ndisp-sheet-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-saffron-600">Citizen Portal</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
            {t(hour < 12 ? 'dashboard.greetingMorning' : hour < 17 ? 'dashboard.greetingAfternoon' : 'dashboard.greetingEvening')}, {firstName}.
          </h1>
          <p className="mt-1 text-[14px] text-ink-500">How can we help you today?</p>
        </div>
        <Button icon={PlusCircle} onClick={() => navigate('/citizen/register')}>Register Complaint</Button>
      </div>

      {/* Hero search — runs the same spatial-query engine as Explore Map */}
      <section className="card border-saffron-200 p-4 sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (search.trim()) navigate(`/citizen/map?q=${encodeURIComponent(search.trim())}`)
          }}
          className="relative"
          role="search"
          aria-label="Search district services"
        >
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="What do you need help with?"
            aria-label="What do you need help with?"
            className="w-full rounded-xl2 border border-ink-200 bg-ink-50/40 py-4 pl-11 pr-28 text-[14.5px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-saffron-400 focus-visible:ring-2 focus-visible:ring-saffron-500/30"
          />
          <button
            type="submit"
            disabled={!search.trim()}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-ink-950 disabled:opacity-50"
          >
            Search
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Try these searches">
          <span className="text-[12px] font-medium text-ink-500">Try:</span>
          {SEARCH_CHIPS.map((chip) =>
            chip.query ? (
              <button
                key={chip.label}
                onClick={() => navigate(`/citizen/map?q=${encodeURIComponent(chip.query)}`)}
                className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 transition-colors hover:border-saffron-400 hover:bg-saffron-50 hover:text-saffron-800"
              >
                {chip.label}
              </button>
            ) : (
              <Link
                key={chip.label}
                to={chip.action}
                className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50 hover:text-leaf-700"
              >
                {chip.label}
              </Link>
            )
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                to={action.to}
                data-tour={action.tour}
                className={clsx(
                  'group flex min-h-[92px] flex-col rounded-xl2 border border-ink-100 bg-white p-3.5 shadow-card transition-all duration-200',
                  'hover:-translate-y-0.5 hover:border-saffron-300 hover:shadow-popover',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500/40'
                )}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-50 text-ink-700 transition-all duration-200 group-hover:bg-saffron-50 group-hover:text-saffron-700">
                  <Icon size={17} className="transition-transform duration-200 group-hover:scale-110" />
                </span>
                <span className="mt-2.5 text-[12.5px] font-semibold leading-tight text-ink-900">{action.title}</span>
                <span className="mt-0.5 text-[10.5px] leading-snug text-ink-500">{action.text}</span>
                <ArrowRight size={12} className="mt-2 self-start text-saffron-600 opacity-0 transition-all duration-200 group-hover:opacity-100" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-tour="citizen-complaints-stats">
        <StatCard label="Active Complaints" value={loading ? '—' : stats.active} icon={Clock} tone="saffron" />
        <StatCard label="Waiting for Review" value={loading ? '—' : stats.review} icon={CheckCircle2} tone="leaf" />
        <StatCard label="Escalated" value={loading ? '—' : stats.escalated} icon={AlertTriangle} tone="alert" />
        <StatCard label="Total Complaints" value={loading ? '—' : stats.total} icon={FileText} tone="ink" />
      </div>

      {/* Recent requests */}
      <section className="space-y-3" data-tour="citizen-complaints-list">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink-950">Your recent requests</h2>
          <div className="flex gap-1.5" role="group" aria-label="Filter complaints">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => { setStatusFilter(filter.value); setPage(1) }}
                aria-pressed={statusFilter === filter.value}
                className={clsx(
                  'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
                  statusFilter === filter.value
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}
        {error && (
          <div className="card flex items-center justify-between gap-3 p-4 text-[13px] text-alert-700">
            <span>Something went wrong while loading this information.</span>
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={refetch}>Try Again</Button>
          </div>
        )}
        {!loading && !error && complaints.length === 0 && (
          <EmptyState
            icon={FileText}
            title="You haven't reported an issue yet"
            description="Have something that needs attention? Tell us about it and track it until it's resolved."
            action={<Button icon={PlusCircle} onClick={() => navigate('/citizen/register')}>Report a Problem</Button>}
          />
        )}
        {!loading && !error && complaints.length > 0 && visibleComplaints.length === 0 && (
          <EmptyState
            icon={FileText}
            title="No complaints in this view"
            description="Try a different filter to see your other requests."
          />
        )}
        {!loading && !error && pageEntries.map((complaint) => (
          <div key={complaint.id} className="card border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="kbd-mono text-[11px] text-ink-400">{complaint.trackingCode || complaint.id}</span>
                <h3 className="mt-0.5 text-[14.5px] font-semibold text-ink-950">{complaint.title}</h3>
                <p className="mt-0.5 text-[11.5px] text-ink-500">
                  {complaint.location?.village || '—'}
                  {complaint.location?.block ? ` · ${complaint.location.block}` : ''}
                  {' · '}
                  {complaint.updatedAt || complaint.createdAt ? new Date(complaint.updatedAt || complaint.createdAt).toLocaleString() : '—'}
                </p>
              </div>
              <span className="h-fit rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
                {complaintStateLabel(complaint.state)}
              </span>
            </div>
            {complaint.description && (
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600 line-clamp-2">{complaint.description}</p>
            )}
            <div className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
              <ComplaintStatusStepper state={complaint.state} size="compact" />
              <div className="flex items-center gap-2">
                {complaint.slaDueAt && (
                  <span className="mr-1 hidden text-[11px] text-ink-500 md:inline">Expected update: {new Date(complaint.slaDueAt).toLocaleDateString()}</span>
                )}
                <Button size="sm" variant="outline" icon={SearchCheck} onClick={() => navigate(`/citizen/track?code=${encodeURIComponent(complaint.trackingCode || complaint.id)}`)}>Track</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedId(complaint.id)}>View Details</Button>
              </div>
            </div>
          </div>
        ))}
        {!loading && !error && <Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onChange={setPage} />}
      </section>

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} width="max-w-3xl">
        {selectedId && <CitizenComplaintDetail complaintId={selectedId} onClose={() => setSelectedId(null)} />}
      </Modal>
    </div>
  )
}
