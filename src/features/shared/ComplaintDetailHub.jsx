import { useState, useMemo, useEffect } from 'react'
import { Clock, FileText, User, Download, RefreshCw, X, Building2, Upload } from 'lucide-react'
import MapView from '../../components/map/MapView'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useUiStore } from '../../app/store/uiStore'
import { useAsync } from '../../hooks/useAsync'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { DepartmentRepository } from '../../gis/repositories/DepartmentRepository'
import { DEPARTMENT_MAP, COMPLAINT_STATE_LABELS, PRIORITY_CONFIG } from '../../config/constants'
import { formatDate, formatDateTime } from '../../utils/format'

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

// Backend workflow statuses in lifecycle order (backend_guide.md §10.4).
const BACKEND_FLOW = ['submitted', 'assigned', 'accepted', 'inspection_started', 'evidence_uploaded', 'resolved', 'closed']

export default function ComplaintDetailHub({ complaintId, onClose }) {
  const user = useAuthStore((s) => s.user)
  const refreshComplaint = useComplaintEngine((s) => s.refreshComplaint)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const pushToast = useUiStore((s) => s.pushToast)

  const [activeTab, setActiveTab] = useState('overview')
  const [actionModal, setActionModal] = useState(null) // 'assign' | 'accept' | 'inspection' | 'resolve' | 'transfer' | 'escalate' | 'reject'
  const [remarksInput, setRemarksInput] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [targetDeptId, setTargetDeptId] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [busy, setBusy] = useState(false)

  // Every detail render comes straight from the backend: GET /api/complaints/{id}/
  // and GET /api/complaints/{id}/timeline/.  No local lifecycle inference.
  const detailRequest = useAsync(() => (complaintId ? ComplaintRepository.detail(complaintId) : Promise.resolve(null)), [complaintId])
  const timelineRequest = useAsync(() => (complaintId ? ComplaintRepository.timeline(complaintId) : Promise.resolve([])), [complaintId])

  const complaint = detailRequest.data

  // Assign / start-inspection candidates come from the department roster
  // (GET /api/department/{id}/users/) so target_user_id is always real.
  const departmentId = complaint?.departmentId || ''
  const assigneeRequest = useAsync(
    () => (actionModal === 'assign' || actionModal === 'inspection') && departmentId ? DepartmentRepository.users(departmentId) : Promise.resolve([]),
    [actionModal, departmentId]
  )
  // Transfer targets are the department list (numeric primary keys).
  const departmentsRequest = useAsync(
    () => (actionModal === 'transfer' ? DepartmentRepository.list() : Promise.resolve([])),
    [actionModal]
  )

  const assignees = useMemo(() => {
    const rows = Array.isArray(assigneeRequest.data) ? assigneeRequest.data : []
    const normalizeRole = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
    const loggedInId = String(user?.id ?? '')
    // Only roles that can never take a complaint assignment are excluded.
    // DEPARTMENT_OFFICER / FIELD_INSPECTOR / DEPARTMENT_HEAD all remain.
    const UNSUPPORTED_ASSIGNEE_ROLES = new Set(['citizen', 'admin', 'superuser', 'super_admin', 'state_admin'])
    const filtered = rows.filter((item) => {
      if (!item.id) return false
      if (String(item.id) === loggedInId) return false
      const roleCode = normalizeRole(item.roleCode || item.role)
      return !UNSUPPORTED_ASSIGNEE_ROLES.has(roleCode)
    })
    return filtered.map((item) => ({
      value: String(item.id),
      label: [item.name, item.designation || item.roleName || item.roleCode].filter(Boolean).join(' · ') || `User #${item.id}`,
    }))
  }, [assigneeRequest.data, user?.id])

  const transferDepartments = useMemo(() => {
    const rows = Array.isArray(departmentsRequest.data) ? departmentsRequest.data : []
    return rows
      .filter((item) => String(item.id) !== String(departmentId))
      .map((item) => ({ value: String(item.id), label: item.name }))
  }, [departmentsRequest.data, departmentId])
  const timelineEvents = useMemo(() => {
    const rows = Array.isArray(timelineRequest.data) ? timelineRequest.data : []
    return [...rows].sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
  }, [timelineRequest.data])

  // Keep the shared engine registry (and therefore list cards / counters) in
  // sync with the backend whenever the modal opens.
  useEffect(() => {
    if (complaintId) refreshComplaint(complaintId)
  }, [complaintId, refreshComplaint])

  if (detailRequest.loading) {
    return <div className="card p-6 text-sm text-ink-500">Loading complaint details from the backend…</div>
  }
  if (detailRequest.error || !complaint) {
    return (
      <div className="card p-6 text-sm text-alert-700 flex justify-between gap-3">
        <span>{detailRequest.error?.message || 'Complaint not found.'}</span>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={detailRequest.refetch}>Retry</Button>
      </div>
    )
  }

  const dept = DEPARTMENT_MAP[complaint.departmentSlug] || {}
  const priorityInfo = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.medium
  const isHead = user?.role === 'dept_head'
  const isOfficer = ['dept_officer', 'engineer', 'field_inspector'].includes(user?.role)

  async function dispatch(nextState, remarks) {
    const extraData = actionModal === 'assign' || actionModal === 'inspection'
      ? (targetUserId ? { target_user_id: Number(targetUserId) } : {})
      : actionModal === 'transfer'
        ? (targetDeptId ? { target_department_id: Number(targetDeptId) } : {})
        : {}
    setBusy(true)
    const ok = await transitionComplaintState(complaint.id, nextState, user, remarks || remarksInput, extraData)
    if (ok) {
      pushToast(`Action executed: Ticket ${complaint.id} ${COMPLAINT_STATE_LABELS[nextState] || nextState}.`, 'success')
      await Promise.all([detailRequest.refetch(), timelineRequest.refetch()])
      setActionModal(null)
      setRemarksInput('')
      setTargetUserId('')
      setTargetDeptId('')
    }
    setBusy(false)
  }

  async function handleEvidenceUpload(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setUploadingEvidence(true)
    try {
      await ComplaintRepository.uploadEvidence(complaint.id, files)
      pushToast(`Evidence uploaded for ticket ${complaint.id}.`, 'success')
      event.target.value = ''
      await Promise.all([detailRequest.refetch(), timelineRequest.refetch(), refreshComplaint(complaint.id)])
    } catch (error) {
      pushToast(`Evidence upload failed: ${error?.message || 'Unknown error'}`, 'error')
    } finally {
      setUploadingEvidence(false)
    }
  }

  const actionLabel = (key) => ({ assign: 'Assign', accept: 'Accept', inspection: 'Start Inspection', resolve: 'Resolve', transfer: 'Transfer', escalate: 'Escalate', reject: 'Reject' }[key])

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
              <span className="font-display font-semibold text-[15px] truncate" title={complaint.title}>{complaint.title}</span>
              <StatusBadge status={complaint.state} />
            </div>
            <p className="text-[11.5px] text-ink-300 font-mono mt-0.5 truncate">
              #{complaint.trackingCode || complaint.id} · SLA Due: {complaint.slaDueAt ? formatDateTime(complaint.slaDueAt) : '—'}
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
                  <p className="text-[11.5px] text-ink-500">Target Time: {complaint.slaTargetHours ?? '—'}h · Due Date: {complaint.slaDueAt ? formatDateTime(complaint.slaDueAt) : '—'}</p>
                </div>
              </div>
              <Badge tone={priorityInfo.tone}>{priorityInfo.label} Priority</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px] p-4 bg-white border border-ink-100 rounded-xl">
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Department</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.departmentName || dept?.label || '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">District</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.location?.districtName || complaint.location?.block || '—'}</p>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px] p-4 bg-white border border-ink-100 rounded-xl">
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Submitted</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.createdAt ? formatDateTime(complaint.createdAt) : '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Nearest Facility</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.location?.nearestFacility || '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Category</span>
                <p className="font-medium text-ink-900 mt-0.5">{complaint.categoryName || '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-semibold text-ink-400 uppercase">Coordinates</span>
                <p className="font-medium text-ink-900 mt-0.5 font-mono">
                  {Array.isArray(complaint.location?.position) && complaint.location.position.length >= 2
                    ? `${complaint.location.position[1].toFixed(5)}, ${complaint.location.position[0].toFixed(5)}`
                    : '—'}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-[12.5px] font-semibold text-ink-800 mb-1">Description</h4>
              <p className="text-[13px] text-ink-700 leading-relaxed p-3 bg-ink-50/50 border border-ink-100 rounded-xl">
                {complaint.description}
              </p>
            </div>

            {complaint.resolutionSummary && (
              <div className="p-3.5 rounded-xl border border-leaf-200 bg-leaf-50">
                <span className="text-[10.5px] font-semibold text-leaf-700 uppercase">Resolution Summary</span>
                <p className="text-[12.5px] text-ink-800 mt-1">{complaint.resolutionSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CITIZEN INFO */}
        {activeTab === 'citizen' && (
          <div className="space-y-4 animate-fade-in text-[12.5px]">
            <div className="p-4 bg-white border border-ink-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-900 text-[13.5px] flex items-center gap-2">
                  <User size={16} className="text-saffron-600" /> {complaint.citizen?.name || 'Citizen'}
                </span>
                {complaint.citizen?.isMasked && <Badge tone="warning">Identity Masked on Public Portal</Badge>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Verified Phone</span>
                  <p className="font-mono text-ink-800 mt-0.5">{complaint.citizen?.phone || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Email</span>
                  <p className="font-mono text-ink-800 mt-0.5">{complaint.citizen?.email || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Village / Ward</span>
                  <p className="font-mono text-ink-800 mt-0.5">{[complaint.location?.village, complaint.location?.ward].filter(Boolean).join(', ') || '—'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Location Address</span>
                  <p className="text-ink-800 mt-0.5">{complaint.location?.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 animate-fade-in">
            {timelineRequest.loading && <p className="text-[12.5px] text-ink-400">Loading timeline…</p>}
            {timelineRequest.error && <p className="text-[12.5px] text-alert-600">Unable to load the timeline.</p>}
            {!timelineRequest.loading && !timelineRequest.error && timelineEvents.length === 0 && (
              <p className="text-[12.5px] text-ink-400 p-6 text-center">No timeline events recorded yet.</p>
            )}
            {timelineEvents.map((a, idx) => (
              <div key={a.id || `${a.timestamp}-${idx}`} className="flex gap-3 text-[12.5px]">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-saffron-100 text-saffron-700 grid place-items-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  {idx < timelineEvents.length - 1 && <div className="w-0.5 flex-1 bg-ink-100 my-1" />}
                </div>
                <div className="flex-1 card p-3 border border-ink-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900">{a.actionLabel || a.action?.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] font-mono text-ink-400">{a.timestamp ? formatDateTime(a.timestamp) : '—'}</span>
                  </div>
                  <p className="text-[11.5px] text-ink-600 mt-1">
                    Actor: <strong className="text-ink-800">{a.actorName || 'System'}</strong> ({a.actorRole || 'user'})
                    {a.fromStatus && a.toStatus ? <> · {a.fromStatus} → {a.toStatus}</> : null}
                  </p>
                  {a.remarks && <p className="text-[11.5px] text-ink-700 mt-1 bg-ink-50 border border-ink-100 rounded-lg p-2">{a.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: WORKFLOW STATE GRAPH */}
        {activeTab === 'workflow' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 card border border-ink-200">
              <span className="text-[12px] font-semibold text-ink-800 block mb-2">Complaint Lifecycle Progress</span>
              <div className="flex items-center">
                {BACKEND_FLOW.map((step, i) => {
                  const currentIdx = BACKEND_FLOW.indexOf(complaint.state) >= 0 ? BACKEND_FLOW.indexOf(complaint.state) : -1
                  const done = currentIdx >= 0 && i <= currentIdx
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-6 w-6 rounded-full grid place-items-center text-[10.5px] font-semibold ${done ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400'}`}>
                          {i + 1}
                        </div>
                        <span className={`text-[10.5px] font-medium text-center w-16 ${done ? 'text-ink-800' : 'text-ink-400'}`}>
                          {COMPLAINT_STATE_LABELS[step] || step}
                        </span>
                      </div>
                      {i < BACKEND_FLOW.length - 1 && <div className={`h-px flex-1 mx-1 ${i < currentIdx ? 'bg-ink-900' : 'bg-ink-100'}`} />}
                    </div>
                  )
                })}
              </div>
              {['escalated', 'rejected', 'reopened', 'transferred'].includes(complaint.state) && (
                <div className="mt-4 rounded-lg bg-saffron-50 border border-saffron-200 px-3 py-2 text-[12px] text-saffron-800 font-medium">
                  Current backend status: {COMPLAINT_STATE_LABELS[complaint.state] || complaint.state} — the complaint left the linear lifecycle and is awaiting the next department/citizen action.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: GIS & ROUTING */}
        {activeTab === 'gis' && (
          <div className="space-y-4 animate-fade-in">
            {Array.isArray(complaint.location?.position) && complaint.location.position.length >= 2 ? (
              <>
                <div className="h-[clamp(200px,28vh,288px)] rounded-xl overflow-hidden card border border-ink-200 relative">
                  <MapView center={complaint.location.position} zoom={15} activeTool="radius" radiusCenter={complaint.location.position} radiusKm={0.5} className="h-full" />
                </div>
                <div className="p-3 card border border-ink-100 text-[12px] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-ink-900">Nearest Sector Facility:</span>
                    <span className="text-ink-600 ml-1.5">{complaint.location.nearestFacility || '—'}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[12.5px] text-ink-400 p-6 text-center">No coordinates recorded for this complaint.</p>
            )}
          </div>
        )}

        {/* TAB 6: DOCUMENTS & EVIDENCE */}
        {activeTab === 'evidence' && (
          <div className="space-y-4 animate-fade-in">
            {isOfficer && (
              <div className="p-3.5 rounded-xl border border-saffron-200 bg-saffron-50/60 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[12px] text-ink-700">
                  <span className="font-semibold text-saffron-800">Upload geotagged evidence</span>
                  <p className="text-[11px] text-ink-500 mt-0.5">Photos, videos or PDFs — the backend verifies EXIF coordinates against the complaint pin ({'≤100m required to pass'} geotag verification).</p>
                </div>
                <label className="flex items-center gap-1.5 rounded-lg bg-saffron-600 text-white px-3 py-1.5 text-[12px] font-semibold cursor-pointer hover:bg-saffron-700">
                  <Upload size={14} />
                  {uploadingEvidence ? 'Uploading…' : 'Upload'}
                  <input type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={handleEvidenceUpload} disabled={uploadingEvidence} />
                </label>
              </div>
            )}
            {Array.isArray(complaint.evidences) && complaint.evidences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaint.evidences.map((evidence) => (
                  <div key={evidence.id || evidence.url} className="card p-2 border border-ink-200">
                    {/IMAGE|JPEG|JPG|PNG|WEBP|GIF/.test(evidence.type || '') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(evidence.url || '') ? (
                      <a href={evidence.url} target="_blank" rel="noreferrer">
                        <img src={evidence.url} alt={evidence.name || 'Evidence'} className="h-44 w-full object-cover rounded-lg" />
                      </a>
                    ) : (
                      <a href={evidence.url} target="_blank" rel="noreferrer" className="grid h-44 w-full place-items-center rounded-lg bg-ink-50 text-ink-400 text-[12px]">
                        <FileText size={22} className="mb-1" />
                        {evidence.type || 'FILE'}
                      </a>
                    )}
                    <div className="p-2 text-[11px] text-ink-500 flex justify-between gap-2">
                      <span className="truncate">{evidence.name || evidence.url}</span>
                      <a href={evidence.url} target="_blank" rel="noreferrer" download={evidence.name} className="flex items-center gap-1 text-saffron-600 font-semibold shrink-0 hover:underline">
                        <Download size={12} /> Open
                      </a>
                    </div>
                    <div className="px-2 pb-2 flex items-center justify-between text-[10.5px] text-ink-400">
                      <span>{evidence.uploadedByName ? `Uploaded by ${evidence.uploadedByName}` : 'Uploaded'}</span>
                      {evidence.createdAt && <span className="font-mono">{formatDate(evidence.createdAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-ink-400 bg-ink-50 rounded-xl text-[12px]">No evidence uploaded for this complaint yet.</div>
            )}
          </div>
        )}

        {/* TAB 7: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-2 animate-fade-in text-[12px]">
            {timelineEvents.length === 0 && <p className="text-ink-400 text-center p-6">No audit events yet.</p>}
            {timelineEvents.map((a) => (
              <div key={a.id || a.timestamp} className="p-3 bg-white border border-ink-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-saffron-700 font-semibold">{a.action}</span>
                  <p className="font-medium text-ink-900 mt-0.5">{a.actionLabel} by {a.actorName || 'System'} ({a.actorRole || 'user'})</p>
                  {a.remarks && <p className="text-[11px] text-ink-500 mt-0.5">“{a.remarks}”</p>}
                </div>
                <span className="text-[11px] font-mono text-ink-400">{a.timestamp ? formatDateTime(a.timestamp) : '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: COMMUNICATION LOG */}
        {activeTab === 'comments' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-[11.5px] text-ink-400">
              Internal remarks conversation derived from the backend audit timeline.
            </p>
            <div className="space-y-2.5">
              {timelineEvents.filter((entry) => entry.remarks).length === 0 && (
                <p className="p-6 text-center text-[12px] text-ink-400">No remarks have been recorded yet.</p>
              )}
              {timelineEvents
                .filter((entry) => entry.remarks)
                .map((entry) => (
                  <div key={entry.id || entry.timestamp} className="p-3 card border border-ink-100 bg-ink-50/50 text-[12.5px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-ink-900">{entry.actorName || 'System'} <span className="font-normal text-ink-400">({entry.actorRole || 'user'})</span></span>
                      <span className="text-[11px] text-ink-400">{entry.timestamp ? formatDateTime(entry.timestamp) : '—'}</span>
                    </div>
                    <p className="text-ink-700">{entry.remarks}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Action Bar — every action posts to the backend and then refreshes
          the detail modal, the queue list and the dashboard counters. */}
      {(isHead || isOfficer) && (
        <div className="p-4 border-t border-ink-100 bg-ink-50/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11.5px] font-semibold text-ink-700">{isHead ? 'Department Head Actions:' : 'Officer Actions:'}</span>

            {isHead && ['submitted', 'reopened'].includes(complaint.state) && (
              <Button size="sm" variant="saffron" disabled={busy} onClick={() => setActionModal('assign')}>
                Assign
              </Button>
            )}
            {isOfficer && ['assigned', 'reopened'].includes(complaint.state) && (
              <Button size="sm" variant="positive" disabled={busy} onClick={() => setActionModal('accept')}>
                Accept
              </Button>
            )}
            {isOfficer && ['accepted'].includes(complaint.state) && (
              <Button size="sm" variant="saffron" disabled={busy} onClick={() => setActionModal('inspection')}>
                Start Inspection
              </Button>
            )}
            {isOfficer && ['inspection_started', 'evidence_uploaded'].includes(complaint.state) && (
              <Button size="sm" variant="positive" disabled={busy} onClick={() => setActionModal('resolve')}>
                Resolve Complaint
              </Button>
            )}

            {isHead && !['resolved', 'closed', 'verification_pending', 'cancelled', 'rejected'].includes(complaint.state) && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setActionModal('transfer')}>
                Transfer
              </Button>
            )}
            {isHead && !['resolved', 'closed', 'verification_pending', 'rejected'].includes(complaint.state) && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setActionModal('escalate')}>
                Escalate
              </Button>
            )}
            {isHead && ['submitted', 'assigned', 'reopened'].includes(complaint.state) && (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => setActionModal('reject')}>
                Reject
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => { setActionModal(null); setRemarksInput(''); setTargetUserId(''); setTargetDeptId('') }}
        title={`${actionLabel(actionModal) || 'Execute'} Ticket #${complaint.trackingCode || complaint.id}`}
        footer={
          <>
            <Button variant="outline" onClick={() => { setActionModal(null); setRemarksInput(''); setTargetUserId(''); setTargetDeptId('') }}>Cancel</Button>
            <Button
              variant="positive"
              loading={busy}
              disabled={
                busy ||
                ((actionModal === 'assign' || actionModal === 'inspection') && !targetUserId) ||
                (actionModal === 'transfer' && !targetDeptId)
              }
              onClick={() => dispatch({
              assign: 'assigned', accept: 'accepted', inspection: 'inspection_started', resolve: 'resolved', transfer: 'transferred', escalate: 'escalated', reject: 'rejected',
            }[actionModal])}
            >
              Confirm {actionLabel(actionModal)}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {(actionModal === 'assign' || actionModal === 'inspection') && (
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">
                {actionModal === 'assign' ? 'Assign To (Department User)' : 'Field Inspector (Department User)'}
              </label>
              {assigneeRequest.loading ? (
                <p className="text-[12px] text-ink-400">Loading department users…</p>
              ) : assignees.length === 0 ? (
                <p className="text-[12px] text-alert-600">No assignable users returned for this department. Check the backend roster (GET /api/department/{departmentId}/users/).</p>
              ) : (
                <Select value={targetUserId} onChange={setTargetUserId} options={assignees} className="w-full" />
              )}
            </div>
          )}
          {actionModal === 'transfer' && (
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Transfer To Department</label>
              {departmentsRequest.loading ? (
                <p className="text-[12px] text-ink-400">Loading departments…</p>
              ) : transferDepartments.length === 0 ? (
                <p className="text-[12px] text-alert-600">No transfer targets returned from the backend.</p>
              ) : (
                <Select value={targetDeptId} onChange={setTargetDeptId} options={transferDepartments} className="w-full" />
              )}
            </div>
          )}
          {actionModal !== 'assign' && actionModal !== 'inspection' && actionModal !== 'transfer' && (
            <label className="block text-[12px] font-semibold text-ink-700">
              {actionModal === 'escalate' || actionModal === 'reject' ? 'Reason' : 'Remarks'}
            </label>
          )}
          {(actionModal !== 'assign' && actionModal !== 'inspection' && actionModal !== 'transfer') && (
            <textarea
              rows={3}
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              placeholder={actionModal === 'reject' ? 'Explain why this complaint is being rejected…' : 'Add workflow remarks for the audit trail…'}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}