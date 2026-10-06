import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, CheckCircle2, Star, RefreshCw, RotateCcw, Clock, Download, ShieldCheck } from 'lucide-react'
import clsx from 'clsx'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAsync } from '../../hooks/useAsync'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { complaintApprovalService } from '../../services/complaintApprovalService'
import { formatDateTime } from '../../utils/format'

const TABS = ['Overview', 'Timeline', 'Photos', 'Messages', 'Feedback']

const chatLabel = (state, isDeptApproved = true) => {
  if (['resolved', 'verification_pending', 'citizen_confirmation'].includes(state)) {
    return isDeptApproved ? 'Waiting for Your Review' : 'Pending Dept Approval'
  }
  return {
    submitted: 'Submitted',
    assigned: 'Assigned',
    accepted: 'Accepted',
    inspection_started: 'Inspection',
    evidence_uploaded: 'Evidence uploaded',
    closed: 'Closed',
    escalated: 'Escalated',
    reopened: 'Reopened',
    transferred: 'Transferred',
    rejected: 'Rejected',
  }[state] || 'In Progress'
}

export default function CitizenComplaintDetail({ complaintId, onClose, fullscreen = false }) {
  const [tab, setTab] = useState('Overview')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionModal, setActionModal] = useState(null)

  const ingestComplaint = useComplaintEngine((s) => s.ingestComplaint)

  const detail = useAsync(() => ComplaintRepository.detail(complaintId), [complaintId])
  const history = useAsync(() => ComplaintRepository.timeline(complaintId), [complaintId])
  const complaint = detail.data

  const [approvalInfo, setApprovalInfo] = useState(() => complaintApprovalService.isWorkApproved(complaintId, complaint))

  useEffect(() => {
    if (complaint) {
      setApprovalInfo(complaintApprovalService.isWorkApproved(complaint.id, complaint))
    }
  }, [complaint])

  useEffect(() => {
    const onApproved = (e) => {
      if (String(e.detail?.complaintId) === String(complaintId)) {
        setApprovalInfo({ approved: true, ...e.detail })
        detail.refetch()
      }
    }
    const onRework = (e) => {
      if (String(e.detail?.complaintId) === String(complaintId)) {
        setApprovalInfo({ approved: false })
        detail.refetch()
      }
    }
    window.addEventListener('ndisp:complaint-approved', onApproved)
    window.addEventListener('ndisp:complaint-rework-requested', onRework)
    return () => {
      window.removeEventListener('ndisp:complaint-approved', onApproved)
      window.removeEventListener('ndisp:complaint-rework-requested', onRework)
    }
  }, [complaintId, detail])

  const timeline = useMemo(() => {
    const rows = Array.isArray(history.data) ? history.data : []
    return [...rows].sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
  }, [history.data])

  const remarksThread = useMemo(() => timeline.filter((entry) => entry.remarks), [timeline])

  function afterMutation() {
    return Promise.all([detail.refetch(), history.refetch(), ingestComplaint(complaintId)])
  }

  async function handleFeedback() {
    setSaving(true); setActionError(null)
    try {
      await ComplaintRepository.feedback(complaintId, { rating, feedback_comment: comment })
      setFeedbackSent(true)
      await afterMutation()
    } catch (error) { setActionError(error) } finally { setSaving(false) }
  }

  async function handleClose() {
    setSaving(true); setActionError(null)
    try {
      await ComplaintRepository.close(complaintId)
      await afterMutation()
    } catch (error) { setActionError(error) } finally { setSaving(false) }
  }

  async function handleAction() {
    if (actionModal === 'reopen' && !reason.trim()) return
    setSaving(true); setActionError(null)
    try {
      if (actionModal === 'reopen') {
        await ComplaintRepository.reopen(complaintId, { reason: reason.trim() })
      } else if (actionModal === 'escalate') {
        await ComplaintRepository.escalate(complaintId, { reason: reason.trim() || 'Escalation requested by citizen.' })
      }
      setActionModal(null)
      setReason('')
      await afterMutation()
    } catch (error) { setActionError(error) } finally { setSaving(false) }
  }

  const isResolvedState = ['resolved', 'verification_pending', 'citizen_confirmation'].includes(complaint?.state)
  const isDeptApproved = Boolean(approvalInfo?.approved)
  // New Flow: Citizen feedback option ONLY opens after department head or officer approves the work!
  const allowFeedback = complaint && isResolvedState && isDeptApproved

  const feedbackSubmitted = feedbackSent || complaint?.rating != null
  const evidence = Array.isArray(complaint?.evidences) ? complaint.evidences : []
  const showReopenButton = complaint && (['closed', 'resolved', 'verification_pending'].includes(complaint.state) && (isDeptApproved || complaint.state === 'closed'))
  const canEscalate = complaint?.slaDueAt && new Date(complaint.slaDueAt) < new Date()

  return (
    <div
      id="citizen-complaint-sheet"
      className={fullscreen ? 'fixed inset-0 z-[180] flex h-dvh flex-col bg-white' : 'flex flex-col bg-white rounded-2xl overflow-hidden max-h-[85vh]'}
    >
      <header className={clsx('flex shrink-0 justify-between gap-3 bg-ink-950 text-white', fullscreen ? 'px-4 pb-4 pt-[calc(14px+var(--safe-top))]' : 'p-4')}>
        <div className="flex min-w-0 items-center gap-2">
          {fullscreen && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-[15px]">{complaint?.title || 'Complaint details'}</h2>
            <p className="mt-0.5 font-mono text-xs text-ink-300">Tracking number: {complaint?.trackingCode || complaint?.id || '—'}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2">
          {complaint && (
            <Badge tone={complaint.state === 'closed' ? 'positive' : isResolvedState && !isDeptApproved ? 'warning' : complaint.state === 'rejected' || complaint.state === 'escalated' ? 'negative' : 'info'}>
              {chatLabel(complaint.state, isDeptApproved)}
            </Badge>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={fullscreen ? 'grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-300 transition-colors hover:bg-white/10 hover:text-white' : 'text-lg leading-none text-ink-300 hover:text-white p-1'}
            >
              ×
            </button>
          )}
        </div>
      </header>

      {complaint && (
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b bg-ink-50 px-3">
          {TABS.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold ${tab === item ? 'border-saffron-500 text-saffron-700' : 'border-transparent text-ink-500'}`}>{item}</button>
          ))}
        </nav>
      )}

      <main className={fullscreen ? 'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pb-[calc(20px+var(--safe-bottom))] text-sm' : 'space-y-4 overflow-y-auto p-5 text-sm'}>
        {detail.loading ? (
          <p className="text-ink-500">Loading complaint details…</p>
        ) : detail.error || !complaint ? (
          <div className="flex items-center justify-between gap-3 text-alert-700">
            <span>{detail.error?.message || 'Complaint not found.'}</span>
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={detail.refetch}>Retry</Button>
          </div>
        ) : (
          <>
        {actionError && <p className="rounded-lg bg-alert-50 border border-alert-200 p-3 text-alert-700">{actionError.message}</p>}

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <>
            {isResolvedState && !isDeptApproved && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/80 flex items-start gap-2.5">
                <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="text-[12.5px] text-amber-900 leading-snug">
                  <strong>Work Done — Pending Department Approval:</strong> The field team completed the work. The Department Head is reviewing the resolution before citizen sign-off.
                </div>
              </div>
            )}
            {isResolvedState && isDeptApproved && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-[12.5px] text-emerald-900 leading-snug">
                  <strong>Resolution Approved by Department:</strong> Work has been verified and approved by {approvalInfo?.approvedBy || 'Department Head'}. You can submit your feedback in the Feedback tab.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-ink-50 rounded-xl flex items-start gap-2">
                <Clock size={15} className="text-saffron-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-ink-400 block">Current status</span>
                  <b>{chatLabel(complaint.state, isDeptApproved)}</b>
                </div>
              </div>
              <div className="p-3 bg-ink-50 rounded-xl flex items-start gap-2">
                <span className="text-xs text-ink-400 block">Priority</span>
                <b className="uppercase">{complaint.priority || '—'}</b>
              </div>
              <div className="p-3 bg-ink-50 rounded-xl">
                <span className="text-xs text-ink-400 block">Expected resolution</span>
                <b>{complaint.slaDueAt ? formatDateTime(complaint.slaDueAt) : '—'}</b>
              </div>
              <div className="p-3 bg-ink-50 rounded-xl">
                <span className="text-xs text-ink-400 block">Submitted on</span>
                <b>{complaint.createdAt ? formatDateTime(complaint.createdAt) : '—'}</b>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Department</span>
                <b className="text-ink-900">{complaint.departmentName || '—'}</b>
              </div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Nearest facility</span>
                <b className="text-ink-900">{complaint.location?.nearestFacility || '—'}</b>
              </div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">District</span>
                <b className="text-ink-900">{complaint.location?.districtName || '—'}</b>
              </div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Coordinates</span>
                <b className="text-ink-900 font-mono">
                  {Array.isArray(complaint.location?.position) && complaint.location.position.length >= 2
                    ? `${complaint.location.position[1].toFixed(5)}°N, ${complaint.location.position[0].toFixed(5)}°E`
                    : '—'}
                </b>
              </div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Assigned officer</span>
                <b className="text-ink-900">{complaint.assignedOfficer?.name || '—'}</b>
              </div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Assigned inspector</span>
                <b className="text-ink-900">{complaint.assignedInspector?.name || '—'}</b>
              </div>
            </div>

            <p className="text-ink-700 leading-relaxed p-3 bg-ink-50/50 border border-ink-100 rounded-xl">{complaint.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Rating</span>
                <b className="text-ink-900">{complaint.rating != null ? `${complaint.rating} / 5` : '—'}</b>
              </div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl">
                <span className="text-ink-400 block">Feedback</span>
                <b className="text-ink-900">{complaint.feedbackComment || '—'}</b>
              </div>
            </div>

            {complaint.resolutionSummary && (
              <div className="p-3 rounded-xl bg-leaf-50 border border-leaf-200">
                <span className="text-xs text-leaf-700 font-semibold">Resolution summary</span>
                <p className="text-xs text-ink-800 mt-1">{complaint.resolutionSummary}</p>
              </div>
            )}
          </>
        )}

        {/* TIMELINE */}
        {tab === 'Timeline' && (
          <>
            {history.loading && <p className="text-ink-500">Loading timeline…</p>}
            {history.error && <p className="text-alert-700">{history.error.message}</p>}
            {!history.loading && !history.error && timeline.length === 0 && <p className="text-ink-500">No timeline events available.</p>}
            {!history.loading && !history.error && timeline.map((entry, index) => (
              <div key={entry.id || `${entry.timestamp}-${index}`} className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-saffron-100 text-saffron-800 grid place-items-center text-xs shrink-0 mt-0.5">{index + 1}</div>
                <div>
                  <b className="capitalize">{entry.action?.replace(/_/g, ' ') || 'Complaint updated'}</b>
                  <p className="text-xs text-ink-400">{entry.timestamp ? formatDateTime(entry.timestamp) : '—'}</p>
                  {(entry.actorName || entry.remarks) && (
                    <p className="text-xs text-ink-500 mt-1">
                      {entry.actorName ? `By ${entry.actorName} (${entry.actorRole || 'user'})` : ''}{entry.remarks ? ` — ${entry.remarks}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* PHOTOS */}
        {tab === 'Photos' && (
          <>
            {evidence.length === 0 && <p className="p-8 text-center text-xs text-ink-400">No evidence has been uploaded yet.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evidence.map((entry) => (
                <div key={entry.id || entry.url} className="card p-2 border border-ink-200 space-y-2">
                  <a href={entry.url} target="_blank" rel="noreferrer">
                    <img src={entry.url} alt={entry.name || 'Complaint evidence'} className="h-44 w-full object-cover rounded-lg" />
                  </a>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-ink-500">{entry.name || 'Evidence'}</span>
                    <a href={entry.url} target="_blank" rel="noreferrer" download={entry.name} className="flex items-center gap-1 text-saffron-600 font-semibold shrink-0 hover:underline">
                      <Download size={12} /> Download
                    </a>
                  </div>
                  {entry.uploadedByName && <p className="text-[10.5px] text-ink-400">Uploaded by {entry.uploadedByName}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* MESSAGES */}
        {tab === 'Messages' && (
          <div className="space-y-3">
            <p className="text-xs text-ink-400">Updates and internal remarks recorded for this complaint are shown below in chronological order.</p>
            {remarksThread.length === 0 && <p className="p-6 text-center text-xs text-ink-400">No remarks have been recorded yet.</p>}
            {remarksThread.map((entry) => (
              <div key={entry.id || entry.timestamp} className="card p-3 border border-ink-100 bg-ink-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-ink-900">{entry.actorName || 'Department'} <span className="font-normal text-ink-400">({entry.actorRole || 'system'})</span></span>
                  <span className="text-[10.5px] text-ink-400">{entry.timestamp ? formatDateTime(entry.timestamp) : '—'}</span>
                </div>
                <p className="text-xs text-ink-700">{entry.remarks}</p>
              </div>
            ))}
          </div>
        )}

        {/* FEEDBACK */}
        {tab === 'Feedback' && (
          <>
            {!allowFeedback && isResolvedState && !isDeptApproved && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-950 font-semibold text-[13.5px]">
                  <Clock size={18} className="text-amber-600 shrink-0" />
                  <span>Work Completed · Awaiting Department Head Approval</span>
                </div>
                <p className="text-[12.5px] text-amber-800 leading-relaxed">
                  The assigned field inspector has completed the repair work and uploaded on-site verification evidence. The resolution is currently under review by the Department Head / Officer.
                </p>
                <div className="p-3 bg-white/80 rounded-lg border border-amber-200/70 text-[12px] text-amber-900 font-medium">
                  Citizen review and feedback submission will open automatically here once the Department Head approves the resolution.
                </div>
              </div>
            )}

            {!allowFeedback && !isResolvedState && complaint.state !== 'closed' && complaint.state !== 'reopened' && (
              <p className="text-ink-500">Feedback will be enabled once the repair work is completed and approved by the department.</p>
            )}

            {!allowFeedback && complaint.state === 'reopened' && (
              <div className="p-4 rounded-xl bg-saffron-50 border border-saffron-200 space-y-1">
                <b className="flex gap-2 items-center text-sm text-saffron-800"><RotateCcw size={16} className="shrink-0" /> Your complaint has been reopened.</b>
                <p className="text-xs text-ink-600">The department is working on it again. Feedback will be enabled once the re-inspection is resolved and approved by the department.</p>
              </div>
            )}

            {allowFeedback && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-950">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Work Approved by Department {approvalInfo?.approvedBy ? `(${approvalInfo.approvedBy})` : ''}</span>
                  </div>
                  <p className="text-[12px] text-emerald-800">
                    The department head has verified and approved the work. Please confirm if the issue is resolved and rate your experience.
                  </p>
                  {approvalInfo?.remarks && (
                    <p className="text-[11.5px] text-emerald-700 mt-1 bg-white/80 p-2 rounded-lg border border-emerald-200/60 font-mono">
                      Department Remarks: “{approvalInfo.remarks}”
                    </p>
                  )}
                </div>

                <div>
                  <b>Have you verified that the issue is resolved?</b>
                  <p className="text-xs text-ink-500 mt-1">Your feedback is sent directly to the district administration.</p>
                </div>

                <div>
                  <span className="text-xs font-semibold">Rate your experience</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} disabled={saving || feedbackSubmitted} className={star <= rating ? 'text-saffron-500' : 'text-ink-200'}>
                        <Star size={22} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea className="input-field" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional feedback comment…" disabled={feedbackSubmitted} />

                {!feedbackSubmitted && (
                  <div className="flex flex-wrap gap-2">
                    <Button loading={saving} variant="positive" disabled={saving} onClick={handleFeedback}>
                      Submit feedback
                    </Button>
                    <Button loading={saving} variant="outline" disabled={saving} onClick={() => setActionModal('reopen')}>
                      Need rework
                    </Button>
                  </div>
                )}

                {(feedbackSubmitted || complaint.rating != null) && (
                  <div className="flex flex-wrap gap-2 items-center pt-1">
                    <span className="text-xs text-leaf-700 flex gap-1.5 items-center"><CheckCircle2 size={15} /> Feedback submitted.</span>
                    <Button loading={saving} variant="positive" disabled={saving} onClick={handleClose}>Close complaint</Button>
                  </div>
                )}
              </div>
            )}

            {complaint.state === 'closed' && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-leaf-50 border border-leaf-200">
                  <b className="flex gap-2 items-center text-sm"><CheckCircle2 size={17} className="text-leaf-600" /> Your complaint is closed.</b>
                  {complaint.rating != null && <p className="text-xs mt-1">You rated this resolution {complaint.rating} / 5{complaint.feedbackComment ? ` — "${complaint.feedbackComment}"` : ''}.</p>}
                </div>
                <Button loading={saving} variant="outline" icon={RotateCcw} disabled={saving} onClick={() => setActionModal('reopen')}>Reopen complaint</Button>
              </div>
            )}

            {canEscalate && (
              <Button loading={saving} variant="danger" disabled={saving} onClick={() => setActionModal('escalate')}>
                Escalate
              </Button>
            )}
          </>
        )}
          </>
        )}
      </main>

      {/* Reopen / escalate reason modal */}
      <Modal
        open={actionModal !== null}
        onClose={() => setActionModal(null)}
        title={actionModal === 'escalate' ? 'Escalate complaint' : 'Reopen complaint'}
        zIndex={fullscreen ? 'z-[200]' : 'z-50'}
        footer={
        <>
          <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
          <Button
            variant={actionModal === 'escalate' ? 'danger' : 'positive'}
            loading={saving}
            disabled={actionModal === 'reopen' && !reason.trim()}
            onClick={handleAction}
          >
            {actionModal === 'escalate' ? 'Escalate' : 'Reopen'}
          </Button>
        </>
      }>
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink-700">
            {actionModal === 'escalate' ? 'Reason for escalation' : 'Reason for reopening'}
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={actionModal === 'escalate' ? 'Explain why you would like this complaint escalated…' : 'Tell us why the issue is still not resolved…'}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"
          />
        </div>
      </Modal>
    </div>
  )
}