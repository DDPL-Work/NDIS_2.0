import { useState, useMemo } from 'react'
import {
  CheckCircle2, AlertTriangle, ShieldCheck, Clock, MapPin, FileText, Camera,
  User, Send, MessageSquare, History, Activity, Wrench, RefreshCw, X, Play, RotateCcw,
  Check, ArrowRight, CornerDownRight, Download, Navigation, ShieldAlert, Building2
} from 'lucide-react'
import MapView from '../../components/map/MapView'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import WorkflowStepper from '../../components/ui/WorkflowStepper'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useUiStore } from '../../app/store/uiStore'
import { DEPARTMENT_MAP, COMPLAINT_STATE_LABELS, PRIORITY_CONFIG } from '../../config/constants'
import { formatDate, formatDateTime, timeAgo } from '../../utils/format'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'citizen', label: 'Citizen Info' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'workflow', label: 'Workflow State' },
  { id: 'gis', label: 'GIS & Routing' },
  { id: 'evidence', label: 'Documents & Photos' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'comments', label: 'Communication' },
]

export default function ComplaintDetailHub({ complaintId, onClose }) {
  const user = useAuthStore((s) => s.user)
  const complaints = useComplaintEngine((s) => s.complaints)
  const auditLogs = useComplaintEngine((s) => s.auditLogs)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const pushToast = useUiStore((s) => s.pushToast)

  const [activeTab, setActiveTab] = useState('overview')
  const [actionModal, setActionModal] = useState(null) // 'schedule' | 'reject' | 'resolve' | 'reopen'
  const [remarksInput, setRemarksInput] = useState('')
  const [commentInput, setCommentInput] = useState('')
  const [commentsList, setCommentsList] = useState([
    { id: 1, sender: 'Anil Mehta (Officer)', role: 'dept_officer', text: 'Inspected category queue. Assigned Junior Engineer Manoj Singh for site audit.', time: '2 hours ago' },
    { id: 2, sender: 'Manoj Singh (Engineer)', role: 'field_inspector', text: 'Material requisition created for submersible motor replacement.', time: '1 hour ago' },
  ])

  const complaint = useMemo(() => complaints.find((c) => c.id === complaintId) || complaints[0], [complaints, complaintId])
  const relatedAudits = useMemo(() => auditLogs.filter((a) => a.complaintId === complaint.id), [auditLogs, complaint.id])

  if (!complaint) return null

  const dept = DEPARTMENT_MAP[complaint.departmentId]
  const priorityInfo = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.medium

  function handleExecuteAction(nextState, remarksText) {
    transitionComplaintState(complaint.id, nextState, user, remarksText || remarksInput)
    pushToast(`Action Executed: Ticket ${complaint.id} transitioned to "${COMPLAINT_STATE_LABELS[nextState]}".`, 'success')
    setActionModal(null)
    setRemarksInput('')
  }

  function handleAddComment() {
    if (!commentInput.trim()) return
    setCommentsList((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: user?.name || 'Authorized User',
        role: user?.role || 'user',
        text: commentInput,
        time: 'Just now',
      },
    ])
    setCommentInput('')
    pushToast('Comment added to communication log.', 'info')
  }

  return (
    <div className="card shadow-popover bg-white border border-ink-200 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header Bar */}
      <div className="p-4 border-b border-ink-100 bg-ink-950 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept?.color || '#546882' }}>
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-[15px] truncate">{complaint.title}</span>
              <StatusBadge status={complaint.state} />
            </div>
            <p className="text-[11.5px] text-ink-300 font-mono mt-0.5 truncate">
              {complaint.id} · {complaint.trackingCode} · SLA Due: {formatDateTime(complaint.slaDueAt)}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-300 hover:text-white hover:bg-white/10">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Tabs Header */}
      <div className="px-4 bg-ink-50 border-b border-ink-100 flex gap-1 overflow-x-auto shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2.5 text-[12px] font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === t.id ? 'border-saffron-500 text-saffron-600 bg-white' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Tab Contents */}
      <div className="p-5 overflow-y-auto flex-1 space-y-4">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* SLA Gauge Banner */}
            <div className="p-3.5 rounded-xl border border-ink-200 bg-ink-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-saffron-600" />
                <div>
                  <span className="font-semibold text-[13px] text-ink-900">SLA Resolution Target</span>
                  <p className="text-[11.5px] text-ink-500">Target Time: {complaint.slaHours}h · Due Date: {formatDateTime(complaint.slaDueAt)}</p>
                </div>
              </div>
              <Badge tone={priorityInfo.tone}>{priorityInfo.label} Priority</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px] p-4 bg-white border border-ink-100 rounded-xl">
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Department</span>
                <p className="font-medium text-ink-900 mt-0.5">{dept?.label}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Village / Ward</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.location.village}, {complaint.location.ward}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Assigned Officer</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.assignedOfficer?.name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Field Inspector</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.assignedInspector?.name || 'Unassigned'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[12.5px] font-semibold text-ink-800 mb-1">Description</h4>
              <p className="text-[13px] text-ink-700 leading-relaxed p-3 bg-ink-50/50 border border-ink-100 rounded-xl">
                {complaint.description}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CITIZEN INFO */}
        {activeTab === 'citizen' && (
          <div className="space-y-4 animate-fade-in text-[12.5px]">
            <div className="p-4 bg-white border border-ink-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-900 text-[13.5px] flex items-center gap-2">
                  <User size={16} className="text-saffron-600" /> {complaint.citizen.name}
                </span>
                {complaint.citizen.isMasked && <Badge tone="warning">Identity Masked on Public Portal</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Verified Phone</span>
                  <p className="font-mono text-ink-800 mt-0.5">{complaint.citizen.phone}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Email</span>
                  <p className="font-mono text-ink-800 mt-0.5">{complaint.citizen.email}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Alternate Contact</span>
                  <p className="font-mono text-ink-800 mt-0.5">{complaint.citizen.altPhone || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Location Address</span>
                  <p className="text-ink-800 mt-0.5">{complaint.location.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 animate-fade-in">
            {relatedAudits.map((a, idx) => (
              <div key={a.id} className="flex gap-3 text-[12.5px]">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-saffron-100 text-saffron-700 grid place-items-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  {idx < relatedAudits.length - 1 && <div className="w-0.5 flex-1 bg-ink-100 my-1" />}
                </div>
                <div className="flex-1 card p-3 border border-ink-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900">{a.action.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] font-mono text-ink-400">{formatDateTime(a.timestamp)}</span>
                  </div>
                  <p className="text-[11.5px] text-ink-600 mt-1">
                    Actor: <strong className="text-ink-800">{a.actorName}</strong> ({a.actorRole}) · {a.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: WORKFLOW STATE GRAPH */}
        {activeTab === 'workflow' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 card border border-ink-200">
              <span className="text-[12px] font-semibold text-ink-800 block mb-2">11-Stage Workflow Engine Progress</span>
              <WorkflowStepper currentState={complaint.state} />
            </div>
          </div>
        )}

        {/* TAB 5: GIS & ROUTING */}
        {activeTab === 'gis' && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-72 rounded-xl overflow-hidden card border border-ink-200 relative">
              <MapView center={complaint.location.position} zoom={15} activeTool="radius" radiusCenter={complaint.location.position} radiusKm={0.5} className="h-full" />
            </div>
            <div className="p-3 card border border-ink-100 text-[12px] flex items-center justify-between">
              <div>
                <span className="font-semibold text-ink-900">Nearest Sector Facility:</span>
                <span className="text-ink-600 ml-1.5">{complaint.location.nearestFacility}</span>
              </div>
              <Button size="sm" variant="outline" icon={Navigation} onClick={() => pushToast('Simulating Turn-by-Turn Inspector Routing…', 'info')}>
                Route to Site
              </Button>
            </div>
          </div>
        )}

        {/* TAB 6: DOCUMENTS & EVIDENCE */}
        {activeTab === 'evidence' && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-[12.5px] font-semibold text-ink-800 mb-2">Citizen Submission Photo</h4>
                {complaint.attachments?.[0] ? (
                  <div className="card p-2 border border-ink-200">
                    <img src={complaint.attachments[0].url} alt="Submission Evidence" className="h-44 w-full object-cover rounded-lg" />
                    <div className="p-2 text-[11px] text-ink-500 flex justify-between">
                      <span>Geotag Validated</span>
                      <span className="font-mono">{formatDate(complaint.createdAt)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-ink-400 bg-ink-50 rounded-xl text-[12px]">No initial photo attached</div>
                )}
              </div>

              <div>
                <h4 className="text-[12.5px] font-semibold text-ink-800 mb-2">Inspection / Resolution Evidence</h4>
                {complaint.inspectionDetails?.afterPhoto ? (
                  <div className="card p-2 border border-ink-200">
                    <img src={complaint.inspectionDetails.afterPhoto} alt="Resolution Evidence" className="h-44 w-full object-cover rounded-lg" />
                    <div className="p-2 text-[11px] text-leaf-700 font-semibold flex justify-between">
                      <span>Verified Completion Photo</span>
                      <span className="font-mono">Inspector Geotag OK</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-ink-400 bg-ink-50 rounded-xl text-[12px]">Work completion photo pending inspector upload</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-2 animate-fade-in text-[12px]">
            {relatedAudits.map((a) => (
              <div key={a.id} className="p-3 bg-white border border-ink-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-saffron-700 font-semibold">{a.id}</span>
                  <p className="font-medium text-ink-900 mt-0.5">{a.action} by {a.actorName} ({a.actorRole})</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">{a.location} · Device: {a.device}</p>
                </div>
                <span className="text-[11px] font-mono text-ink-400">{formatDateTime(a.timestamp)}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: COMMUNICATION LOG */}
        {activeTab === 'comments' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2.5">
              {commentsList.map((c) => (
                <div key={c.id} className="p-3 card border border-ink-100 bg-ink-50/50 text-[12.5px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-ink-900">{c.sender}</span>
                    <span className="text-[11px] text-ink-400">{c.time}</span>
                  </div>
                  <p className="text-ink-700">{c.text}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Type inter-departmental instruction or citizen remark…"
                className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-[12.5px]"
              />
              <Button icon={Send} onClick={handleAddComment}>Post</Button>
            </div>
          </div>
        )}
      </div>

      {/* Role Action Bar (Part 6 Requirement) */}
      <div className="p-4 border-t border-ink-100 bg-ink-50/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] font-semibold text-ink-700">Officer Actions:</span>
          {complaint.state === 'submitted' && (
            <Button size="sm" variant="positive" onClick={() => handleExecuteAction('assigned', 'Officer accepted and assigned ticket.')}>
              Accept & Route
            </Button>
          )}
          {['assigned', 'accepted'].includes(complaint.state) && (
            <Button size="sm" variant="saffron" onClick={() => setActionModal('schedule')}>
              Schedule Inspection
            </Button>
          )}
          {['inspection_completed', 'work_completed'].includes(complaint.state) && (
            <Button size="sm" variant="positive" onClick={() => handleExecuteAction('resolved', 'Work inspected and approved.')}>
              Resolve Complaint
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {['submitted', 'assigned', 'in_progress'].includes(complaint.state) && (
            <Button size="sm" variant="danger" onClick={() => handleExecuteAction('escalated', 'SLA breach or urgent priority escalation.')}>
              Escalate
            </Button>
          )}
          {complaint.state === 'resolved' && (
            <Button size="sm" variant="outline" onClick={() => handleExecuteAction('closed', 'Citizen confirmed resolution.')}>
              Confirm & Close
            </Button>
          )}
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title="Execute Workflow State Action"
        footer={
          <>
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            <Button variant="positive" onClick={() => handleExecuteAction('inspection_scheduled', remarksInput)}>
              Confirm Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-[12px] font-semibold text-ink-700">Inspection & Assignment Remarks</label>
          <textarea
            rows={3}
            value={remarksInput}
            onChange={(e) => setRemarksInput(e.target.value)}
            placeholder="Specify field inspector instructions or site details…"
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"
          />
        </div>
      </Modal>
    </div>
  )
}
