import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, Eye, FileText, PlusCircle, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CitizenComplaintDetail from './CitizenComplaintDetail'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'

const citizenStatus = (state) => ({ assigned: 'Accepted', accepted: 'Accepted', inspection_scheduled: 'Inspection', inspection_completed: 'Inspection', work_started: 'Repair Started', work_completed: 'Repair Completed', verification_pending: 'Waiting for Your Review', resolved: 'Waiting for Your Review', closed: 'Closed', escalated: 'Escalated', reopened: 'Reopened' }[state] || 'Submitted')
const progressFor = (state) => ({ submitted: 10, assigned: 30, accepted: 30, inspection_scheduled: 50, inspection_completed: 50, work_started: 80, work_completed: 90, verification_pending: 95, resolved: 95, closed: 100, escalated: 40, reopened: 45 }[state] || 10)

export default function CitizenDashboard() {
  const user = useAuthStore((state) => state.user); const complaints = useComplaintEngine((state) => state.complaints)
  const [selectedId, setSelectedId] = useState(null)
  const myComplaints = useMemo(() => complaints.filter((item) => !item.citizen?.email || item.citizen?.email === user?.email || item.citizen?.name === user?.name), [complaints, user])
  const stats = useMemo(() => ({ active: myComplaints.filter((item) => !['verification_pending', 'resolved', 'closed'].includes(item.state)).length, review: myComplaints.filter((item) => ['verification_pending', 'resolved'].includes(item.state)).length, escalated: myComplaints.filter((item) => item.state === 'escalated').length, total: myComplaints.length }), [myComplaints])
  return <div className="space-y-6 max-w-5xl mx-auto p-6">
    <PageHeader eyebrow="Citizen Portal" title={`Welcome back, ${user?.name || 'Citizen'}`} description="Register, track, and verify your public-service complaints." action={<Button icon={PlusCircle} onClick={() => window.location.assign('/citizen/register')}>Register Complaint</Button>} />
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4"><StatCard label="Active Complaints" value={stats.active} icon={Clock} tone="saffron" /><StatCard label="Waiting for Review" value={stats.review} icon={CheckCircle2} tone="leaf" /><StatCard label="Escalated" value={stats.escalated} icon={AlertTriangle} tone="alert" /><StatCard label="Total Complaints" value={stats.total} icon={FileText} tone="ink" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><button onClick={() => window.location.assign('/citizen/register')} className="card p-4 text-left border hover:border-saffron-500 flex justify-between"><span><b className="block">Register Complaint</b><small>Tell us about the public-service issue.</small></span><ArrowRight /></button><button onClick={() => window.location.assign('/citizen/track')} className="card p-4 text-left border hover:border-leaf-500 flex justify-between"><span><b className="block">Track Complaint</b><small>Follow your updates using a tracking number.</small></span><ArrowRight /></button></div>
    <section className="space-y-3"><h3 className="font-semibold">Your complaints</h3>{myComplaints.map((complaint) => { const progress = progressFor(complaint.state); return <div key={complaint.id} className="card p-4 border space-y-3"><div className="flex justify-between gap-3"><div><span className="kbd-mono text-xs">{complaint.trackingCode}</span><h4 className="font-semibold mt-1">{complaint.title}</h4><p className="text-xs text-ink-500 mt-1">{complaint.location?.village}, {complaint.location?.ward} · {new Date(complaint.createdAt).toLocaleDateString()}</p></div><span className="rounded-full bg-ink-100 px-2 py-1 text-xs h-fit">{citizenStatus(complaint.state)}</span></div><p className="text-sm text-ink-600 line-clamp-2">{complaint.description}</p><div><div className="flex justify-between text-xs mb-1"><span className="font-semibold">{citizenStatus(complaint.state)}</span><span>{progress}%</span></div><div className="h-2 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-leaf-600 rounded-full" style={{ width: `${progress}%` }}/></div></div><div className="flex justify-between items-center text-xs text-ink-500"><span>Expected update: {new Date(complaint.slaDueAt).toLocaleDateString()}</span><Button size="sm" variant="outline" icon={Eye} onClick={() => setSelectedId(complaint.id)}>View details</Button></div></div> })}</section>
    <Modal open={!!selectedId} onClose={() => setSelectedId(null)} width="max-w-3xl">{selectedId && <CitizenComplaintDetail complaintId={selectedId} onClose={() => setSelectedId(null)} />}</Modal>
  </div>
}
