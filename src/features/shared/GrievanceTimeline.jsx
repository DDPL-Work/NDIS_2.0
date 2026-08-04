import clsx from 'clsx'
import { GRIEVANCE_STATE_LABELS } from '../../config/constants'
import { formatDate, daysUntil } from '../../utils/format'

const STEPS = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed']

// LLD Vol 3 §15.2 — submitted → assigned → in_progress → resolved → closed,
// with `escalated` as a side-state re-entrant to `assigned` on SLA breach.
export default function GrievanceTimeline({ state, submittedAt, slaDueAt }) {
  const currentIdx = state === 'escalated' ? 1 : STEPS.indexOf(state)
  const remaining = daysUntil(slaDueAt)

  return (
    <div>
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'h-6 w-6 rounded-full grid place-items-center text-[10.5px] font-semibold',
                  i <= currentIdx ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400'
                )}
              >
                {i + 1}
              </div>
              <span className={clsx('text-[10.5px] font-medium text-center w-16', i <= currentIdx ? 'text-ink-800' : 'text-ink-400')}>
                {GRIEVANCE_STATE_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className={clsx('h-px flex-1 mx-1', i < currentIdx ? 'bg-ink-900' : 'bg-ink-100')} />}
          </div>
        ))}
      </div>

      {state === 'escalated' && (
        <div className="mt-4 rounded-lg bg-alert-50 border border-alert-200 px-3 py-2 text-[12px] text-alert-600 font-medium">
          Escalated to ADM/DM — no department action within the SLA window. Re-entering the assigned state for follow-up.
        </div>
      )}

      <div className="flex justify-between mt-4 text-[11.5px] text-ink-500">
        <span>Submitted {formatDate(submittedAt)}</span>
        <span className={remaining < 0 ? 'text-alert-600 font-medium' : ''}>
          {remaining < 0 ? `${Math.abs(remaining)} days past SLA` : `${remaining} days to SLA (14-day default)`}
        </span>
      </div>
    </div>
  )
}
