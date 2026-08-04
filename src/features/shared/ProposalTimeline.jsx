import { Check } from 'lucide-react'
import clsx from 'clsx'
import { PROPOSAL_STATE_LABELS, STATUS_TONE } from '../../config/constants'
import { formatDateTime } from '../../utils/format'

const TONE_DOT = {
  positive: 'bg-leaf-600', negative: 'bg-alert-500', info: 'bg-ink-700', warning: 'bg-saffron-500', neutral: 'bg-ink-400',
}

export default function ProposalTimeline({ history = [] }) {
  return (
    <ol className="relative pl-5">
      {history.map((step, i) => {
        const isLast = i === history.length - 1
        return (
          <li key={i} className="relative pb-5 last:pb-0">
            {!isLast && <span className="absolute left-[-15px] top-4 bottom-0 w-px bg-ink-100" />}
            <span
              className={clsx(
                'absolute left-[-20px] top-0.5 grid h-4 w-4 place-items-center rounded-full text-white',
                TONE_DOT[STATUS_TONE[step.state]] || 'bg-ink-400'
              )}
            >
              {isLast && <Check size={10} />}
            </span>
            <p className="text-[13px] font-medium text-ink-900">{PROPOSAL_STATE_LABELS[step.state] || step.state}</p>
            <p className="text-[11.5px] text-ink-400 kbd-mono">{formatDateTime(step.at)}</p>
          </li>
        )
      })}
    </ol>
  )
}
