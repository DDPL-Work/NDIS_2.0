import { useState, useMemo } from 'react'
import { CheckCircle2, Star, RefreshCw, RotateCcw, Clock, Download } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAsync } from '../../hooks/useAsync'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { formatDateTime } from '../../utils/format'

const TABS = ['Overview', 'Timeline', 'Photos', 'Messages', 'Feedback']

const chatLabel = (state) => ({
  submitted: 'Submitted',
  assigned: 'Assigned',
  accepted: 'Accepted',
  inspection_started: 'Inspection',
  evidence_uploaded: 'Evidence uploaded',
  resolved: 'Waiting for Your Review',
  verification_pending: 'Waiting for Your Review',
  closed: 'Closed',
  escalated: 'Escalated',
  reopened: 'Reopened',
  transferred: 'Transferred',
  rejected: 'Rejected',
}[state] || 'In Progress')

const canFeedback = (state) => ['resolved', 'verification_pending'].includes(state)
const canReopen = (state) => ['closed', 'resolved', 'verification_pending'].includes(state)

export default function CitizenComplaintDetail({ complaintId, onClose }) {
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

  if (detail.loading) return <div className="card p-6 text-sm text-ink-500">Loading complaint details…</div>
  if (detail.error || !complaint) return (
    <div className="card p-6 text-sm text-alert-700 flex justify-between gap-3">
      <span>{detail.error?.message || 'Complaint not found.'}</span>
      <Button size="sm" variant="outline" icon={RefreshCw} onClick={detail.refetch}>Retry</Button>
    </div>
  )

  const allowFeedback = canFeedback(complaint.state)
  const feedbackSubmitted = feedbackSent || complaint.rating != null
  const evidence = Array.isArray(complaint.evidences) ? complaint.evidences : []
  const showReopenButton = canReopen(complaint.state)
  const canEscalate = complaint.slaDueAt && new Date(complaint.slaDueAt) < new Date()

  return (
    <div className="card bg-white rounded-2xl overflow-hidden max-h-[88vh] flex flex-col">
      <header className="p-4 bg-ink-950 text-white flex justify-between gap-3">
        <div>
          <h2 className="font-semibold">{complaint.title}</h2>
          <p className="font-mono text-xs text-ink-300 mt-1">Tracking number: {complaint.trackingCode || complaint.id}</p>
        </div>
        <div className="flex items-start gap-2">
          <Badge tone={complaint.state === 'closed' ? 'positive' : complaint.state === 'rejected' || complaint.state === 'escalated' ? 'negative' : 'info'}>{chatLabel(complaint.state)}</Badge>
          {onClose && <button onClick={onClose} className="text-ink-300 hover:text-white text-lg leading-none">×</button>}
        </div>
      </header>

      <nav className="px-3 bg-ink-50 border-b flex gap-1 overflow-x-auto">
        {TABS.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 ${tab === item ? 'border-saffron-500 text-saffron-700' : 'border-transparent text-ink-500'}`}>{item}</button>
        ))}
      </nav>

      <main className="p-5 overflow-y-auto space-y-4 text-sm">
        {actionError && <p className="rounded-lg bg-alert-50 border border-alert-200 p-3 text-alert-700">{actionError.message}</p>}

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-ink-50 rounded-xl flex items-start gap-2">
                <Clock size={15} className="text-saffron-600 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-ink-400 block">Current status</span>
                  <b>{chatLabel(complaint.state)}</b>
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
            {!allowFeedback && complaint.state !== 'closed' && complaint.state !== 'reopened' && (
              <p className="text-ink-500">Feedback will be enabled once the work is resolved on the backend.</p>
            )}

            {!allowFeedback && complaint.state === 'reopened' && (
              <div className="p-4 rounded-xl bg-saffron-50 border border-saffron-200 space-y-1">
                <b className="flex gap-2 items-center text-sm text-saffron-800"><RotateCcw size={16} className="shrink-0" /> Your complaint has been reopened.</b>
                <p className="text-xs text-ink-600">The department is working on it again. Feedback will be enabled once the re-inspection is resolved and forwarded to you.</p>
              </div>
            )}

            {allowFeedback && (
              <div className="space-y-4">
                <div>
                  <b>Have you verified that the issue is resolved?</b>
                  <p className="text-xs text-ink-500 mt-1">Your feedback is sent to the backend workflow.</p>
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
      </main>

      {/* Reopen / escalate reason modal */}
      <Modal
        open={actionModal !== null}
        onClose={() => setActionModal(null)}
        title={actionModal === 'escalate' ? 'Escalate complaint' : 'Reopen complaint'}
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