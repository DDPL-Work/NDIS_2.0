import { useState, useMemo, useEffect } from 'react'
import {
  Building2, X, Clock, MapPin, User, FileText, CheckCircle2,
  AlertTriangle, Upload, RefreshCw, Download, Camera,
  ShieldCheck, History, GitCommit, MessageSquare, Shield,
  RotateCcw, Check, Copy, ExternalLink, ArrowRight
} from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useUiStore } from '../../app/store/uiStore'
import { useAsync } from '../../hooks/useAsync'
import { ROLES, DEPARTMENT_MAP, COMPLAINT_STATE_LABELS, PRIORITY_CONFIG } from '../../config/constants'
import { formatDate, formatDateTime } from '../../utils/format'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { DepartmentRepository } from '../../gis/repositories/DepartmentRepository'
import { complaintApprovalService } from '../../services/complaintApprovalService'
import EvidenceVerificationDetails from '../../components/gis/EvidenceVerificationDetails'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import StatusBadge from '../../components/ui/StatusBadge'
import MapView from '../../components/map/MapView'
import Modal from '../../components/ui/Modal'

const TABS = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'citizen', label: 'Citizen Info', icon: User },
  { id: 'timeline', label: 'Timeline', icon: History },
  { id: 'workflow', label: 'Workflow State', icon: GitCommit },
  { id: 'gis', label: 'GIS & Routing', icon: MapPin },
  { id: 'evidence', label: 'Documents & Photos', icon: Camera },
  { id: 'audit', label: 'Audit Trail', icon: Shield },
  { id: 'comments', label: 'Communication', icon: MessageSquare },
]

const WORKFLOW_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'inspection_started', label: 'Inspection' },
  { key: 'evidence_uploaded', label: 'Evidence Uploaded' },
  { key: 'resolved', label: 'Field Resolved' },
  { key: 'approved', label: 'Dept Approved' },
  { key: 'closed', label: 'Citizen Verified / Closed' },
]

export default function ComplaintDetailHub({ complaintId, onClose }) {
  const user = useAuthStore((s) => s.user)
  const refreshComplaint = useComplaintEngine((s) => s.refreshComplaint)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const pushToast = useUiStore((s) => s.pushToast)

  const [activeTab, setActiveTab] = useState('overview')
  const [actionModal, setActionModal] = useState(null)
  const [remarksInput, setRemarksInput] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [targetDeptId, setTargetDeptId] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copiedTracking, setCopiedTracking] = useState(false)

  // Approval modals
  const [approvalModal, setApprovalModal] = useState(false)
  const [reworkModal, setReworkModal] = useState(false)
  const [approvalRemarks, setApprovalRemarks] = useState('')
  const [reworkReason, setReworkReason] = useState('')

  const detailRequest = useAsync(() => (complaintId ? ComplaintRepository.detail(complaintId) : Promise.resolve(null)), [complaintId])
  const timelineRequest = useAsync(() => (complaintId ? ComplaintRepository.timeline(complaintId) : Promise.resolve([])), [complaintId])

  const complaint = detailRequest.data

  const [approvalState, setApprovalState] = useState(() => complaintApprovalService.isWorkApproved(complaintId, complaint))

  useEffect(() => {
    if (complaint) {
      setApprovalState(complaintApprovalService.isWorkApproved(complaint.id, complaint))
    }
  }, [complaint])

  useEffect(() => {
    const onApproved = (e) => {
      if (String(e.detail?.complaintId) === String(complaintId)) {
        setApprovalState({ approved: true, ...e.detail })
      }
    }
    const onRework = (e) => {
      if (String(e.detail?.complaintId) === String(complaintId)) {
        setApprovalState({ approved: false })
      }
    }
    window.addEventListener('ndisp:complaint-approved', onApproved)
    window.addEventListener('ndisp:complaint-rework-requested', onRework)
    return () => {
      window.removeEventListener('ndisp:complaint-approved', onApproved)
      window.removeEventListener('ndisp:complaint-rework-requested', onRework)
    }
  }, [complaintId])

  const departmentId = complaint?.departmentId || ''
  const assigneeRequest = useAsync(
    () => (actionModal === 'assign' || actionModal === 'inspection') && departmentId ? DepartmentRepository.users(departmentId) : Promise.resolve([]),
    [actionModal, departmentId]
  )
  const departmentsRequest = useAsync(
    () => (actionModal === 'transfer' ? DepartmentRepository.list() : Promise.resolve([])),
    [actionModal]
  )

  const assignees = useMemo(() => {
    const rows = Array.isArray(assigneeRequest.data) ? assigneeRequest.data : []
    const normalizeRole = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
    const loggedInId = String(user?.id ?? '')
    const UNSUPPORTED_ASSIGNEE_ROLES = new Set([ROLES.CITIZEN, ROLES.STATE_ADMIN, ROLES.STATE_SUPER_ADMIN])
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

  const augmentedTimeline = useMemo(() => {
    const list = [...timelineEvents]
    if (approvalState.approved && approvalState.approvedAt && complaint?.id) {
      const alreadyHas = list.some((e) => e.action === 'dept_approved' || e.remarks?.includes('[DEPT_HEAD_APPROVED]'))
      if (!alreadyHas) {
        list.push({
          id: `dept-approval-${complaint.id}`,
          action: 'dept_approved',
          actionLabel: 'Department Work Approved',
          fromStatus: 'resolved',
          toStatus: 'approved_for_feedback',
          actorName: approvalState.approvedBy || 'Department Head',
          actorRole: approvalState.approverRole || 'Department Head',
          remarks: approvalState.remarks || 'Work reviewed and approved. Released for citizen feedback.',
          timestamp: approvalState.approvedAt,
        })
      }
    }
    return list.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
  }, [timelineEvents, approvalState, complaint?.id])

  useEffect(() => {
    if (complaintId) refreshComplaint(complaintId)
  }, [complaintId, refreshComplaint])

  if (detailRequest.loading) {
    return <div className="card m-4 sm:m-6 p-8 text-center text-sm text-ink-500">Loading complaint details from the backend…</div>
  }
  if (detailRequest.error || !complaint) {
    return (
      <div className="card m-4 sm:m-6 p-6 text-sm text-alert-700 flex justify-between gap-3">
        <span>{detailRequest.error?.message || 'Complaint not found.'}</span>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={detailRequest.refetch}>Retry</Button>
      </div>
    )
  }

  const dept = DEPARTMENT_MAP[complaint.departmentSlug] || {}
  const priorityInfo = PRIORITY_CONFIG[complaint.priority] || PRIORITY_CONFIG.medium
  const isHead = user?.role === ROLES.DEPT_HEAD
  const isOfficer = [ROLES.DEPT_OFFICER, ROLES.ENGINEER, ROLES.FIELD_INSPECTOR].includes(user?.role)
  const isSupervisorOrAdmin = [ROLES.DM, ROLES.ADM, ROLES.DISTRICT_COLLECTOR, ROLES.DEPT_HEAD].includes(user?.role)

  const isResolved = ['resolved', 'verification_pending', 'citizen_confirmation'].includes(complaint.state)
  const canApprove = (isHead || isOfficer || isSupervisorOrAdmin) && isResolved && !approvalState.approved
  const isApproved = isResolved && approvalState.approved

  const isSlaBreached = complaint.slaDueAt && new Date(complaint.slaDueAt) < new Date() && !['resolved', 'closed'].includes(complaint.state)

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

  async function handleApproveWork() {
    setBusy(true)
    try {
      const res = complaintApprovalService.approveWork(complaint.id, {
        actorUser: user,
        remarks: approvalRemarks || 'Work verified and approved by department.',
      })
      setApprovalState(res)
      pushToast(`Work approved for Ticket #${complaint.trackingCode || complaint.id}. Citizen feedback is now unlocked.`, 'success')
      setApprovalModal(false)
      setApprovalRemarks('')
      await Promise.all([detailRequest.refetch(), timelineRequest.refetch(), refreshComplaint(complaint.id)])
    } catch (err) {
      pushToast(`Failed to approve work: ${err?.message || 'Error'}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleRequestRework() {
    if (!reworkReason.trim()) {
      pushToast('Please provide a reason for requesting rework.', 'warning')
      return
    }
    setBusy(true)
    try {
      complaintApprovalService.requestRework(complaint.id, {
        actorUser: user,
        reason: reworkReason,
      })
      await transitionComplaintState(complaint.id, 'inspection_started', user, `Rework requested by department: ${reworkReason}`)
      setApprovalState({ approved: false })
      pushToast(`Rework requested for Ticket #${complaint.trackingCode || complaint.id}. Returned to field team.`, 'info')
      setReworkModal(false)
      setReworkReason('')
      await Promise.all([detailRequest.refetch(), timelineRequest.refetch(), refreshComplaint(complaint.id)])
    } catch (err) {
      pushToast(`Rework action: ${err?.message || 'Error'}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleEvidenceUpload(event) {
    const files = event.target.files
    if (!files || !files.length) return
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

  function copyTrackingNumber() {
    const text = complaint.trackingCode || complaint.id
    navigator.clipboard?.writeText(text)
    setCopiedTracking(true)
    setTimeout(() => setCopiedTracking(false), 2000)
    pushToast('Tracking number copied to clipboard', 'info')
  }

  const actionLabel = (key) => ({
    assign: 'Assign',
    accept: 'Accept',
    inspection: 'Start Inspection',
    resolve: 'Resolve',
    transfer: 'Transfer',
    escalate: 'Escalate',
    reject: 'Reject',
  }[key])

  return (
    <div className="flex flex-col h-full max-h-[88vh] bg-white rounded-2xl overflow-hidden outline-none">
      {/* 1. TOP COMMAND BAR */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm ring-1 ring-white/10"
            style={{ background: dept?.color || '#334155' }}
          >
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-[16px] text-white tracking-tight truncate max-w-sm sm:max-w-md" title={complaint.title}>
                {complaint.title}
              </span>
              <StatusBadge status={complaint.state} />
              {isResolved && !approvalState.approved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 border border-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded-full">
                  <Clock size={11} /> Pending Dept Approval
                </span>
              )}
              {isResolved && approvalState.approved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={11} /> Dept Approved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11.5px] text-slate-300 font-mono flex-wrap">
              <button
                onClick={copyTrackingNumber}
                className="hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded border border-white/10 transition-colors"
                title="Click to copy tracking code"
              >
                <span>#{complaint.trackingCode || complaint.id}</span>
                {copiedTracking ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} className="text-slate-400" />}
              </button>
              <span className="text-slate-500">·</span>
              <span>{complaint.departmentName || dept?.label || 'Department'}</span>
              <span className="text-slate-500">·</span>
              {isSlaBreached ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  <AlertTriangle size={11} /> SLA Overdue
                </span>
              ) : complaint.slaDueAt ? (
                <span className="text-slate-300 flex items-center gap-1">
                  <Clock size={11} className="text-slate-400" /> Due: {formatDateTime(complaint.slaDueAt)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. PROMINENT WORK APPROVAL CALLOUT BANNER (WHEN RESOLVED) */}
      {isResolved && !approvalState.approved && (
        <div className="bg-amber-50/90 border-b border-amber-200/90 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-700 grid place-items-center shrink-0 border border-amber-300/40">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-950 flex items-center gap-1.5">
                Field Work Completed · Action Required: Department Head Approval
              </p>
              <p className="text-[12px] text-amber-900 mt-0.5 leading-snug">
                Field inspector uploaded resolution & evidence. Review the work and approve it to release this ticket to the citizen for review and rating.
              </p>
            </div>
          </div>
          {(isHead || isOfficer || isSupervisorOrAdmin) && (
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="positive" icon={CheckCircle2} onClick={() => setApprovalModal(true)}>
                Approve Work
              </Button>
              <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => setReworkModal(true)}>
                Request Rework
              </Button>
            </div>
          )}
        </div>
      )}

      {isResolved && approvalState.approved && (
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[12.5px] text-emerald-950 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              Work verified and approved by <strong>{approvalState.approvedBy}</strong> ({approvalState.approverRole}){approvalState.approvedAt ? ` on ${new Date(approvalState.approvedAt).toLocaleDateString()}` : ''}. Citizen feedback option is open.
            </span>
          </div>
          {(isHead || isOfficer || isSupervisorOrAdmin) && (
            <button
              onClick={() => setReworkModal(true)}
              className="text-[12px] text-emerald-800 hover:text-emerald-950 underline font-semibold transition-colors"
            >
              Request Rework
            </button>
          )}
        </div>
      )}

      {/* 3. MODERN TAB NAVIGATION BAR */}
      <div className="px-5 bg-slate-50 border-b border-ink-100 flex gap-1 overflow-x-auto shrink-0 scrollbar-none">
        {TABS.map((t) => {
          const IconCmp = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[12.5px] font-semibold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-ink-900 text-ink-950 bg-white shadow-sm'
                  : 'border-transparent text-ink-500 hover:text-ink-900 hover:bg-ink-100/60'
              }`}
            >
              <IconCmp size={14} className={isActive ? 'text-ink-900' : 'text-ink-400'} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* 4. MAIN SCROLLABLE TAB CONTENTS */}
      <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 pb-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-fade-in">
            {/* SLA Gauge Banner */}
            <div className="p-4 rounded-xl border border-ink-100 bg-gradient-to-r from-ink-50 to-white flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-saffron-50 border border-saffron-200 text-saffron-600 grid place-items-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="font-semibold text-[13.5px] text-ink-900">SLA Resolution Target</span>
                  <p className="text-[12px] text-ink-500 mt-0.5">
                    Target SLA: <strong className="text-ink-700">{complaint.slaTargetHours ?? '—'} hours</strong>
                    {' · '}
                    Due Date: <strong className="text-ink-700">{complaint.slaDueAt ? formatDateTime(complaint.slaDueAt) : '—'}</strong>
                  </p>
                </div>
              </div>
              <Badge tone={priorityInfo.tone} className="text-[12px] font-semibold px-2.5 py-1">
                {priorityInfo.label} Priority
              </Badge>
            </div>

            {/* Field Resolution Summary Card (if resolved) */}
            {complaint.resolutionSummary && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Field Work & Resolution Summary
                  </span>
                  {complaint.resolvedAt && (
                    <span className="text-[11.5px] text-emerald-700 font-mono">
                      Resolved {formatDate(complaint.resolvedAt)}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-emerald-950 leading-relaxed font-medium bg-white/80 p-3 rounded-lg border border-emerald-200/60">
                  {complaint.resolutionSummary}
                </p>
                {complaint.resolutionDetails?.photos?.length > 0 && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11.5px] text-emerald-800 font-medium">Evidence Photos:</span>
                    <button
                      onClick={() => setActiveTab('evidence')}
                      className="text-[11.5px] text-emerald-700 hover:text-emerald-900 underline font-semibold"
                    >
                      View {complaint.resolutionDetails.photos.length} photo(s) in Documents & Photos →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4-Grid: Department & Officers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px] p-4 bg-white border border-ink-100 rounded-xl shadow-xs">
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Department</span>
                <p className="font-semibold text-ink-900 mt-1">{complaint.departmentName || dept?.label || '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">District / Block</span>
                <p className="font-semibold text-ink-900 mt-1">
                  {[complaint.location?.districtName, complaint.location?.block].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Assigned Officer</span>
                <p className="font-semibold text-ink-900 mt-1">{complaint.assignedOfficer?.name || 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Field Inspector</span>
                <p className="font-semibold text-ink-900 mt-1">{complaint.assignedInspector?.name || 'Unassigned'}</p>
              </div>
            </div>

            {/* 4-Grid: Location & Timings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px] p-4 bg-white border border-ink-100 rounded-xl shadow-xs">
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Submitted On</span>
                <p className="font-semibold text-ink-900 mt-1">{complaint.createdAt ? formatDateTime(complaint.createdAt) : '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Nearest Facility</span>
                <p className="font-semibold text-ink-900 mt-1">{complaint.location?.nearestFacility || '—'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Category</span>
                <p className="font-semibold text-ink-900 mt-1">{complaint.categoryName || 'General Grievance'}</p>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-ink-400 uppercase tracking-wider">Coordinates</span>
                <p className="font-semibold text-ink-900 mt-1 font-mono text-[12px]">
                  {Array.isArray(complaint.location?.position) && complaint.location.position.length >= 2
                    ? `${complaint.location.position[1].toFixed(5)}°N, ${complaint.location.position[0].toFixed(5)}°E`
                    : '—'}
                </p>
              </div>
            </div>

            {/* Complaint Description */}
            <div>
              <h4 className="text-[13px] font-bold text-ink-900 mb-1.5">Citizen Complaint Description</h4>
              <p className="text-[13px] text-ink-700 leading-relaxed p-4 bg-ink-50/60 border border-ink-100 rounded-xl">
                {complaint.description || 'No additional description provided.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CITIZEN INFO */}
        {activeTab === 'citizen' && (
          <div className="space-y-4 animate-fade-in text-[13px]">
            <div className="p-5 bg-white border border-ink-100 rounded-xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                <span className="font-bold text-ink-950 text-[15px] flex items-center gap-2">
                  <User size={18} className="text-ink-600" /> {complaint.citizen?.name || 'Citizen'}
                </span>
                {complaint.citizen?.isMasked ? (
                  <Badge tone="warning">Identity Masked on Public Portal</Badge>
                ) : (
                  <Badge tone="positive">Verified Citizen</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Phone Number</span>
                  <p className="font-mono text-ink-900 font-semibold mt-1">{complaint.citizen?.phone || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Email Address</span>
                  <p className="font-mono text-ink-900 font-semibold mt-1">{complaint.citizen?.email || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Village / Ward</span>
                  <p className="text-ink-900 font-semibold mt-1">
                    {[complaint.location?.village, complaint.location?.ward].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 sm:col-span-2">
                  <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">Full Address</span>
                  <p className="text-ink-900 font-semibold mt-1">{complaint.location?.address || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block">District</span>
                  <p className="text-ink-900 font-semibold mt-1">{complaint.location?.districtName || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 animate-fade-in">
            {timelineRequest.loading && <p className="text-[12.5px] text-ink-400 p-4 text-center">Loading timeline…</p>}
            {timelineRequest.error && <p className="text-[12.5px] text-alert-600 p-4 text-center">Unable to load the timeline.</p>}
            {!timelineRequest.loading && !timelineRequest.error && augmentedTimeline.length === 0 && (
              <p className="text-[12.5px] text-ink-400 p-8 text-center bg-slate-50 rounded-xl">No timeline events recorded yet.</p>
            )}

            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {augmentedTimeline.map((a, idx) => {
                const isApproval = a.action === 'dept_approved'
                return (
                  <div key={a.id || `${a.timestamp}-${idx}`} className="relative flex items-start gap-3 text-[12.5px]">
                    <div className={`absolute -left-6 mt-1 h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold text-white shadow-xs ${
                      isApproval ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-slate-700 ring-4 ring-slate-100'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className={`flex-1 p-3.5 rounded-xl border transition-all ${
                      isApproval ? 'bg-emerald-50/70 border-emerald-200' : 'bg-white border-slate-200 shadow-xs'
                    }`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`font-bold text-[13px] ${isApproval ? 'text-emerald-950' : 'text-slate-900'}`}>
                          {a.actionLabel || a.action?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-[11.5px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {a.timestamp ? formatDateTime(a.timestamp) : '—'}
                        </span>
                      </div>

                      <p className="text-[12px] text-slate-600 mt-1">
                        Actor: <strong className="text-slate-800">{a.actorName || 'System'}</strong> ({a.actorRole || 'user'})
                        {a.fromStatus && a.toStatus ? (
                          <span className="text-slate-500 font-mono text-[11px] ml-1.5">
                            · {a.fromStatus} → {a.toStatus}
                          </span>
                        ) : null}
                      </p>

                      {a.remarks && (
                        <div className="mt-2 text-[12px] text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 leading-relaxed font-sans">
                          {a.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TAB 4: WORKFLOW STATE STEPPER */}
        {activeTab === 'workflow' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 card border border-ink-100 rounded-xl bg-white shadow-xs">
              <span className="text-[13px] font-bold text-ink-900 block mb-3">Complaint Resolution Pipeline</span>
              <div className="flex items-center flex-wrap gap-y-3">
                {WORKFLOW_STEPS.map((step, i) => {
                  const currentIdx = complaint.state === 'closed'
                    ? 6
                    : isApproved
                      ? 5
                      : complaint.state === 'resolved'
                        ? 4
                        : complaint.state === 'evidence_uploaded'
                          ? 3
                          : complaint.state === 'inspection_started'
                            ? 2
                            : complaint.state === 'assigned'
                              ? 1
                              : 0

                  const done = i <= currentIdx
                  const active = i === currentIdx
                  return (
                    <div key={step.key} className="flex items-center flex-1 min-w-[100px] last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold ${
                          active
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                            : done
                              ? 'bg-ink-900 text-white'
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`text-[11px] font-medium text-center w-20 leading-tight ${
                          active ? 'text-amber-700 font-bold' : done ? 'text-ink-900' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1.5 ${i < currentIdx ? 'bg-ink-900' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  )
                })}
              </div>

              {['escalated', 'rejected', 'reopened', 'transferred'].includes(complaint.state) && (
                <div className="mt-5 rounded-lg bg-saffron-50 border border-saffron-200 px-3.5 py-2.5 text-[12.5px] text-saffron-900 font-medium">
                  Current Status: {COMPLAINT_STATE_LABELS[complaint.state] || complaint.state} — This complaint branched off the linear workflow.
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
                <div className="h-[280px] rounded-xl overflow-hidden card border border-ink-100 relative shadow-xs">
                  <MapView center={complaint.location.position} zoom={15} activeTool="radius" radiusCenter={complaint.location.position} radiusKm={0.5} className="h-full" />
                </div>
                <div className="p-3.5 card border border-ink-100 text-[12.5px] flex items-center justify-between bg-slate-50">
                  <div>
                    <span className="font-bold text-ink-900">Nearest Sector Facility:</span>
                    <span className="text-ink-700 ml-1.5 font-medium">{complaint.location.nearestFacility || '—'}</span>
                  </div>
                  <span className="font-mono text-ink-500 text-[11.5px]">
                    {complaint.location.position[1].toFixed(5)}, {complaint.location.position[0].toFixed(5)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-[12.5px] text-ink-400 p-8 text-center bg-slate-50 rounded-xl">No coordinates recorded for this complaint.</p>
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
                  <p className="text-[11px] text-ink-500 mt-0.5">Photos, videos or PDFs — coordinates verified against complaint location pin.</p>
                </div>
                <label className="flex items-center gap-1.5 rounded-lg bg-saffron-600 text-white px-3 py-1.5 text-[12px] font-semibold cursor-pointer hover:bg-saffron-700">
                  <Upload size={14} />
                  {uploadingEvidence ? 'Uploading…' : 'Upload Evidence'}
                  <input type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={handleEvidenceUpload} disabled={uploadingEvidence} />
                </label>
              </div>
            )}
            {Array.isArray(complaint.evidences) && complaint.evidences.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaint.evidences.map((evidence) => (
                  <div key={evidence.id || evidence.url} className="card p-2.5 border border-ink-100 rounded-xl shadow-xs">
                    {/IMAGE|JPEG|JPG|PNG|WEBP|GIF/.test(evidence.type || '') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(evidence.url || '') ? (
                      <a href={evidence.url} target="_blank" rel="noreferrer">
                        <img src={evidence.url} alt={evidence.name || 'Evidence'} className="h-44 w-full object-cover rounded-lg" />
                      </a>
                    ) : (
                      <a href={evidence.url} target="_blank" rel="noreferrer" className="grid h-44 w-full place-items-center rounded-lg bg-ink-50 text-ink-400 text-[12px]">
                        <FileText size={24} className="mb-1" />
                        {evidence.type || 'FILE'}
                      </a>
                    )}
                    <div className="p-2 text-[11.5px] text-ink-500 flex justify-between gap-2">
                      <span className="truncate font-medium text-ink-700">{evidence.name || evidence.url}</span>
                      <a href={evidence.url} target="_blank" rel="noreferrer" download={evidence.name} className="flex items-center gap-1 text-saffron-600 font-semibold shrink-0 hover:underline">
                        <Download size={12} /> Open
                      </a>
                    </div>
                    <div className="px-2 pb-2 flex items-center justify-between text-[11px] text-ink-400">
                      <span>{evidence.uploadedByName ? `Uploaded by ${evidence.uploadedByName}` : 'Uploaded'}</span>
                      {evidence.createdAt && <span className="font-mono">{formatDate(evidence.createdAt)}</span>}
                    </div>
                    <EvidenceVerificationDetails evidence={evidence} submittedPin={complaint.location?.position} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-ink-400 bg-slate-50 rounded-xl text-[12.5px]">No evidence uploaded for this complaint yet.</div>
            )}
          </div>
        )}

        {/* TAB 7: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-2.5 animate-fade-in text-[12.5px]">
            {augmentedTimeline.length === 0 && <p className="text-ink-400 text-center p-8 bg-slate-50 rounded-xl">No audit events yet.</p>}
            {augmentedTimeline.map((a) => (
              <div key={a.id || a.timestamp} className="p-3 bg-white border border-ink-100 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="font-mono text-saffron-700 font-bold text-[11.5px] uppercase">{a.action}</span>
                  <p className="font-semibold text-ink-900 mt-0.5">{a.actionLabel} by {a.actorName || 'System'} ({a.actorRole || 'user'})</p>
                  {a.remarks && <p className="text-[12px] text-ink-500 mt-0.5">“{a.remarks}”</p>}
                </div>
                <span className="text-[11.5px] font-mono text-ink-400 shrink-0 ml-2">{a.timestamp ? formatDateTime(a.timestamp) : '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: COMMUNICATION LOG */}
        {activeTab === 'comments' && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-[12px] text-ink-500">
              Internal workflow and communication history from the complaint audit log.
            </p>
            <div className="space-y-2.5">
              {augmentedTimeline.filter((entry) => entry.remarks).length === 0 && (
                <p className="p-8 text-center text-[12.5px] text-ink-400 bg-slate-50 rounded-xl">No remarks recorded yet.</p>
              )}
              {augmentedTimeline
                .filter((entry) => entry.remarks)
                .map((entry) => (
                  <div key={entry.id || entry.timestamp} className="p-3.5 card border border-ink-100 bg-slate-50/60 rounded-xl text-[12.5px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-ink-900">{entry.actorName || 'System'} <span className="font-normal text-ink-400">({entry.actorRole || 'user'})</span></span>
                      <span className="text-[11px] text-ink-400 font-mono">{entry.timestamp ? formatDateTime(entry.timestamp) : '—'}</span>
                    </div>
                    <p className="text-ink-800 leading-relaxed">{entry.remarks}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. STICKY ROLE ACTION BAR */}
      <div className="px-5 py-3.5 border-t border-ink-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] font-bold text-ink-700">
            {isHead ? 'Department Head Actions:' : isOfficer ? 'Officer Actions:' : 'Actions:'}
          </span>

          {/* Department Head / Officer WORK APPROVAL ACTION */}
          {canApprove && (
            <Button size="sm" variant="positive" icon={CheckCircle2} disabled={busy} onClick={() => setApprovalModal(true)}>
              Approve Work
            </Button>
          )}

          {canApprove && (
            <Button size="sm" variant="outline" icon={RotateCcw} disabled={busy} onClick={() => setReworkModal(true)}>
              Request Rework
            </Button>
          )}

          {isHead && ['submitted', 'reopened'].includes(complaint.state) && (
            <Button size="sm" variant="saffron" disabled={busy} onClick={() => setActionModal('assign')}>
              Assign Officer
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

        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* APPROVE WORK MODAL */}
      <Modal
        open={approvalModal}
        onClose={() => setApprovalModal(false)}
        title={`Approve Work for Ticket #${complaint.trackingCode || complaint.id}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApprovalModal(false)}>Cancel</Button>
            <Button variant="positive" icon={CheckCircle2} loading={busy} onClick={handleApproveWork}>
              Confirm Approval & Open Citizen Feedback
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-[13px]">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950">
            <p className="font-semibold">Verify and approve completed resolution:</p>
            <p className="text-[12px] text-emerald-800 mt-1">
              Approving this work confirms that inspection/repair is satisfactory. The citizen will immediately receive the option to review and submit feedback.
            </p>
          </div>

          {complaint.resolutionSummary && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Reported Resolution</span>
              <p className="text-slate-800 font-medium mt-1">{complaint.resolutionSummary}</p>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-ink-700 mb-1">Approval Remarks (Optional)</label>
            <textarea
              rows={3}
              value={approvalRemarks}
              onChange={(e) => setApprovalRemarks(e.target.value)}
              placeholder="e.g. Work inspected on site by department and confirmed satisfactory."
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* REQUEST REWORK MODAL */}
      <Modal
        open={reworkModal}
        onClose={() => setReworkModal(false)}
        title={`Request Rework for Ticket #${complaint.trackingCode || complaint.id}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setReworkModal(false)}>Cancel</Button>
            <Button variant="danger" icon={RotateCcw} loading={busy} onClick={handleRequestRework}>
              Send Back for Rework
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-[13px]">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950">
            <p className="font-semibold">Send back to field team:</p>
            <p className="text-[12px] text-amber-800 mt-1">
              If the completed work does not satisfy quality requirements, provide reasons below. The complaint will be returned to the field inspector.
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-ink-700 mb-1">
              Rework Reason / Instructions <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reworkReason}
              onChange={(e) => setReworkReason(e.target.value)}
              placeholder="Describe what needs to be rectified or re-inspected on site…"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* OTHER ROLE ACTION MODALS (Assign, Accept, Transfer, Reject, etc.) */}
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
