import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Search, Map, FileText, CheckCircle2, Clock, Star, Eye, AlertTriangle, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ComplaintDetailHub from '../shared/ComplaintDetailHub'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useUiStore } from '../../app/store/uiStore'
import { formatDate } from '../../utils/format'

export default function CitizenDashboard() {
  const user = useAuthStore((s) => s.user)
  const complaints = useComplaintEngine((s) => s.complaints)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const pushToast = useUiStore((s) => s.pushToast)
  const navigate = useNavigate()

  const [selectedId, setSelectedId] = useState(null)
  const [csatRating, setCsatRating] = useState(5)

  // Filter complaints for citizen
  const myComplaints = useMemo(() => complaints, [complaints])

  const stats = useMemo(() => {
    return {
      total: myComplaints.length,
      pending: myComplaints.filter((c) => !['resolved', 'closed'].includes(c.state)).length,
      resolved: myComplaints.filter((c) => ['resolved', 'closed'].includes(c.state)).length,
    }
  }, [myComplaints])

  function handleCitizenRating(complaintId, rating) {
    transitionComplaintState(complaintId, 'closed', user, `Citizen confirmed resolution and rated CSAT ${rating}/5 stars.`, {
      citizenFeedback: { rating, submittedAt: new Date().toISOString() },
    })
    pushToast(`Thank you! Your CSAT rating (${rating}/5 ★) has been logged. Ticket closed.`, 'success')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      <PageHeader
        eyebrow="Citizen Portal · Part 13 Workflow View"
        title={`Welcome back, ${user?.name || 'Citizen'}`}
        description="Track your infrastructure grievances, verify inspector resolution photos, and explore district facility coverage."
        action={
          <Button icon={PlusCircle} onClick={() => navigate('/citizen/register')}>
            Register Complaint
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="My Total Complaints" value={stats.total} icon={FileText} tone="ink" />
        <StatCard label="In Progress / Pending" value={stats.pending} icon={Clock} tone="saffron" />
        <StatCard label="Resolved & Closed" value={stats.resolved} icon={CheckCircle2} tone="leaf" />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/citizen/register')}
          className="card p-4 text-left border border-ink-200 hover:border-saffron-500 hover:bg-saffron-50/30 transition-all flex items-center justify-between group"
        >
          <div>
            <span className="font-semibold text-ink-950 text-[13.5px] block">Register New Grievance</span>
            <span className="text-[11.5px] text-ink-500">5-Step Wizard with GIS Pin-Drop</span>
          </div>
          <ArrowRight size={16} className="text-saffron-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/citizen/track')}
          className="card p-4 text-left border border-ink-200 hover:border-leaf-500 hover:bg-leaf-50/30 transition-all flex items-center justify-between group"
        >
          <div>
            <span className="font-semibold text-ink-950 text-[13.5px] block">Track Complaint</span>
            <span className="text-[11.5px] text-ink-500">Enter Tracking Code or Ticket #</span>
          </div>
          <ArrowRight size={16} className="text-leaf-500 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={() => navigate('/citizen/map')}
          className="card p-4 text-left border border-ink-200 hover:border-sky-500 hover:bg-sky-50/30 transition-all flex items-center justify-between group"
        >
          <div>
            <span className="font-semibold text-ink-950 text-[13.5px] block">Explore District Map</span>
            <span className="text-[11.5px] text-ink-500">View Nearest Facilities & Radius</span>
          </div>
          <ArrowRight size={16} className="text-sky-500 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* My Complaints List */}
      <div className="space-y-3">
        <h3 className="text-[14.5px] font-semibold text-ink-950">Recent Complaints & Resolution Status</h3>

        <div className="space-y-3">
          {myComplaints.map((c) => (
            <div key={c.id} className="card p-4 border border-ink-200 hover:border-ink-300 transition-colors space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{c.id}</span>
                    <StatusBadge status={c.state} />
                  </div>
                  <h4 className="text-[14px] font-semibold text-ink-950 mt-1">{c.title}</h4>
                </div>
                <Button size="sm" variant="outline" icon={Eye} onClick={() => setSelectedId(c.id)}>
                  View Details
                </Button>
              </div>

              <p className="text-[12.5px] text-ink-600 line-clamp-2">{c.description}</p>

              {/* Citizen CSAT Verification Panel when Resolved */}
              {c.state === 'resolved' && (
                <div className="p-3 rounded-xl bg-leaf-50 border border-leaf-200 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <span className="font-semibold text-leaf-900 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-leaf-600" /> Work Marked Resolved by Inspector. Please Confirm:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-leaf-200">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setCsatRating(star)}
                          className={`text-[14px] ${star <= csatRating ? 'text-saffron-500' : 'text-ink-200'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <Button size="sm" variant="positive" onClick={() => handleCitizenRating(c.id, csatRating)}>
                      Confirm & Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Complaint Detail Hub Modal */}
      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} width="max-w-4xl">
        {selectedId && <ComplaintDetailHub complaintId={selectedId} onClose={() => setSelectedId(null)} />}
      </Modal>
    </div>
  )
}
