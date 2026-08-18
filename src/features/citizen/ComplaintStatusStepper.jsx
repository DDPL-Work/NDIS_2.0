import clsx from 'clsx'
import { AlertTriangle, ArrowLeftRight, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import { COMPLAINT_STATE_LABELS } from '../../config/constants'

// Citizen status stepper.  Built ONLY from the real backend complaint workflow
// states (complaintMapper): the vertical timeline walks the actual mainline
// (submitted → assigned → accepted → inspection_started → evidence_uploaded →
// resolved → closed) and side states (escalated / rejected / cancelled /
// reopened / transferred) render as an explanatory banner — they are not
// invented stages.  The compact variant condenses the same real states into
// five citizen-friendly labels for list cards.

const MAINLINE = ['submitted', 'assigned', 'accepted', 'inspection_started', 'evidence_uploaded', 'resolved', 'closed']

const RANK = {
  draft: -1,
  rejected: -1,
  cancelled: -1,
  submitted: 0,
  assigned: 1,
  accepted: 2,
  inspection_scheduled: 3,
  inspection_started: 3,
  inspection_completed: 3,
  evidence_uploaded: 4,
  work_started: 4,
  work_completed: 4,
  resolved: 5,
  verification_pending: 5,
  citizen_verified: 6,
  closed: 6,
  transferred: 1,
  reopened: 3,
  escalated: 1,
}

const SIDE_STATES = {
  escalated: { label: 'Escalated to Collector', tone: 'negative', icon: AlertTriangle },
  rejected: { label: 'Rejected', tone: 'negative', icon: XCircle },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: XCircle },
  reopened: { label: 'Reopened by Citizen', tone: 'warning', icon: RefreshCw },
  transferred: { label: 'Transferred to another department', tone: 'info', icon: ArrowLeftRight },
}

const COMPACT = [
  { label: 'Reported', hint: 'Submitted' },
  { label: 'Assigned', hint: 'Assigned to department' },
  { label: 'In Progress', hint: 'Inspection and action' },
  { label: 'Resolved', hint: 'Awaiting your review' },
  { label: 'Closed', hint: 'Confirmed by you' },
]

export function complaintStateLabel(state) {
  if (!state) return 'Submitted'
  return COMPLAINT_STATE_LABELS[state] || SIDE_STATES[state]?.label || String(state).replace(/_/g, ' ')
}

export default function ComplaintStatusStepper({ state, size = 'full', className = '' }) {
  const side = SIDE_STATES[state]
  const rank = RANK[state] ?? 0

  if (size === 'full') {
    return (
      <ol className={clsx('space-y-0', className)} aria-label="Complaint status timeline">
        {side && (
          <li className="pb-4">
            <Badge tone={side.tone} dot>{side.label}</Badge>
          </li>
        )}
        {MAINLINE.map((entry, index) => {
          const completed = rank > index
          const current = rank === index
          const upcoming = !completed && !current
          return (
            <li key={entry} className="relative flex gap-3 pb-5 last:pb-0">
              {index < MAINLINE.length - 1 && (
                <span
                  aria-hidden="true"
                  className={clsx('absolute left-[11px] top-7 bottom-0 w-px', completed ? 'bg-leaf-500' : 'bg-ink-200')}
                />
              )}
              <span
                className={clsx(
                  'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                  completed && 'border-leaf-500 bg-leaf-500 text-white',
                  current && 'ndisp-step-current border-saffron-500 bg-white text-saffron-600',
                  upcoming && 'border-ink-200 bg-white text-ink-300'
                )}
              >
                {completed ? <CheckCircle2 size={13} /> : <span className={clsx('h-2 w-2 rounded-full', current ? 'bg-saffron-500' : 'bg-ink-200')} />}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className={clsx('block text-[13px] font-semibold leading-snug', current ? 'text-ink-950' : completed ? 'text-ink-800' : 'text-ink-400')}>
                  {COMPLAINT_STATE_LABELS[entry] || String(entry).replace(/_/g, ' ')}
                </span>
                {current && <span className="text-[10.5px] font-semibold uppercase tracking-wide text-saffron-700">Current status</span>}
              </span>
            </li>
          )
        })}
      </ol>
    )
  }

  // Compact: five citizen-friendly dots over the real workflow.
  return (
    <div className={clsx(className)} role="img" aria-label={`Status: ${complaintStateLabel(state)}`}>
      <ol className="flex items-center">
        {COMPACT.map((stage, index) => {
          const completed = rank > index
          const current = rank === index
          return (
            <li key={stage.label} className={clsx('flex items-center', index < COMPACT.length - 1 && 'flex-1')}>
              <span
                className={clsx(
                  'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[9px]',
                  completed && 'bg-leaf-500 text-white',
                  current && 'ndisp-step-current border-2 border-saffron-500 bg-white text-saffron-600',
                  !completed && !current && 'border-2 border-ink-200 bg-white text-ink-300'
                )}
              >
                {completed ? <CheckCircle2 size={9} /> : current ? <span className="h-1.5 w-1.5 rounded-full bg-saffron-500" /> : null}
              </span>
              {index < COMPACT.length - 1 && (
                <span className={clsx('mx-1 h-0.5 flex-1 rounded-full', rank > index ? 'bg-leaf-500' : 'bg-ink-100')} />
              )}
            </li>
          )
        })}
      </ol>
      <p className="mt-1.5 text-[11px] font-semibold text-ink-800">{COMPACT[Math.max(0, Math.min(rank, COMPACT.length - 1))].label}</p>
      <p className="text-[10.5px] text-ink-500">{COMPACT[Math.max(0, Math.min(rank, COMPACT.length - 1))].hint}</p>
    </div>
  )
}
