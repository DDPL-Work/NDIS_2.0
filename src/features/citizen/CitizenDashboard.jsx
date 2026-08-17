import { useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, Eye, FileText, PlusCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CitizenComplaintDetail from './CitizenComplaintDetail'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useAsync } from '../../hooks/useAsync'
import { usePagination } from '../../hooks/usePagination'
import Pagination from '../../components/ui/Pagination'
import { analyticsApi } from '../../services/api'

const citizenStatus = (state) => ({ assigned: 'Accepted', accepted: 'Accepted', inspection_started: 'Inspection', evidence_uploaded: 'Evidence uploaded', resolved: 'Waiting for Your Review', citizen_verification: 'Waiting for Your Review', closed: 'Closed', escalated: 'Escalated', reopened: 'Reopened' }[state] || 'Submitted')
const progressFor = (state) => ({ submitted: 10, assigned: 30, accepted: 40, inspection_started: 55, evidence_uploaded: 70, resolved: 90, citizen_verification: 95, closed: 100, escalated: 40, reopened: 45 }[state] || 10)
const value = (data, keys) => keys.reduce((found, key) => found ?? data?.[key], undefined) ?? 0

export default function CitizenDashboard() {
  const user = useAuthStore((state) => state.user)
  const [selectedId, setSelectedId] = useState(null)
  // Re-fetch the aggregate dashboard whenever the complaint engine invalidates
  // (after any feedback / close / reopen / escalation mutation).
  const dataVersion = useComplaintEngine((s) => s.dataVersion)
  const { data, loading, error, refetch } = useAsync(() => analyticsApi.getCitizenDashboard(), [dataVersion])
  const complaints = data?.myComplaints || data?.complaints || []
  // Backend summary keys (total_complaints / pending_complaints / …) are used
  // when no complaint rows are embedded; otherwise the cards are computed from
  // the listed complaints so the numbers always match the list below.
  const stats = complaints.length
    ? {
        active: complaints.filter((c) => !['closed', 'resolved', 'verification_pending', 'cancelled', 'rejected', 'draft'].includes(c.state)).length,
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
  const { page, setPage, pageEntries, pageCount, pageSize, total } = usePagination(complaints, 5)
  return <div className="space-y-6 max-w-5xl mx-auto p-6" data-tour="citizen-dashboard-main">
    <PageHeader eyebrow="Citizen Portal" title={`Welcome back, ${user?.name || 'Citizen'}`} description="Register, track, and verify your public-service complaints." action={<Button icon={PlusCircle} onClick={() => window.location.assign('/citizen/register')}>Register Complaint</Button>} />
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" data-tour="citizen-complaints-stats"><StatCard label="Active Complaints" value={loading ? '—' : stats.active} icon={Clock} tone="saffron" /><StatCard label="Waiting for Review" value={loading ? '—' : stats.review} icon={CheckCircle2} tone="leaf" /><StatCard label="Escalated" value={loading ? '—' : stats.escalated} icon={AlertTriangle} tone="alert" /><StatCard label="Total Complaints" value={loading ? '—' : stats.total} icon={FileText} tone="ink" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button onClick={() => window.location.assign('/citizen/register')} className="card p-4 text-left border hover:border-saffron-500 flex justify-between"><span><b className="block">Register Complaint</b><small>Tell us about the public-service issue.</small></span><ArrowRight /></button><button onClick={() => window.location.assign('/citizen/track')} className="card p-4 text-left border hover:border-leaf-500 flex justify-between"><span><b className="block">Track Complaint</b><small>Follow your updates using a tracking number.</small></span><ArrowRight /></button></div>
    <section className="space-y-3" data-tour="citizen-complaints-list"><h3 className="font-semibold">Your complaints</h3>{loading && <p className="card p-4 text-sm text-ink-500">Loading your complaints…</p>}{error && <div className="card p-4 text-sm text-alert-700 flex justify-between gap-3"><span>{error.message || 'Unable to load complaints.'}</span><Button size="sm" variant="outline" icon={RefreshCw} onClick={refetch}>Retry</Button></div>}{!loading && !error && complaints.length === 0 && <p className="card p-4 text-sm text-ink-500">No complaints found.</p>}{pageEntries.map((complaint) => { const progress = progressFor(complaint.state); return <div key={complaint.id} className="card p-4 border space-y-3"><div className="flex justify-between gap-3"><div><span className="kbd-mono text-xs">{complaint.trackingCode || complaint.id}</span><h4 className="font-semibold mt-1">{complaint.title}</h4><p className="text-xs text-ink-500 mt-1">{complaint.location?.village || '—'} · {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '—'}</p></div><span className="rounded-full bg-ink-100 px-2 py-1 text-xs h-fit">{citizenStatus(complaint.state)}</span></div><p className="text-sm text-ink-600 line-clamp-2">{complaint.description}</p><div><div className="flex justify-between text-xs mb-1"><span className="font-semibold">{citizenStatus(complaint.state)}</span><span>{progress}%</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-leaf-600 rounded-full" style={{ width: `${progress}%` }}/></div></div><div className="flex justify-between items-center text-xs text-ink-500"><span>Expected update: {complaint.slaDueAt ? new Date(complaint.slaDueAt).toLocaleDateString() : '—'}</span><Button size="sm" variant="outline" icon={Eye} onClick={() => setSelectedId(complaint.id)}>View details</Button></div></div> })}<Pagination page={page} pageCount={pageCount} pageSize={pageSize} total={total} onChange={setPage} /></section>
    <Modal open={!!selectedId} onClose={() => setSelectedId(null)} width="max-w-3xl">{selectedId && <CitizenComplaintDetail complaintId={selectedId} onClose={() => setSelectedId(null)} />}</Modal>
  </div>
}
