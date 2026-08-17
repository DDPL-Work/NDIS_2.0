// Multi-stage visual workflow stepper — Vol 3 Ch 15 (Proposal & Workflow Engine).
// Stages: Draft -> Submitted -> Under DM Review -> Budget Approved -> Tasked -> Assigned to Field -> Inspection Complete -> Closed
import { Check, Clock, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

const LIFECYCLE_STAGES = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'DM Review' },
  { key: 'budget_approved', label: 'Budget Sanctioned' },
  { key: 'tasked', label: 'Directive Tasked' },
  { key: 'assigned_to_field', label: 'Field Operations' },
  { key: 'inspection_complete', label: 'Inspected' },
  { key: 'closed', label: 'Closed' },
]

export default function WorkflowStepper({ currentState = 'draft', history = [] }) {
  const currentIndex = LIFECYCLE_STAGES.findIndex((s) => s.key === currentState)

  return (
    <div className="w-full py-3">
      {/* Scrollable track: 8 stages never compress below ~300px; on narrow
          screens the track scrolls and the current stage shows its label. */}
      <div className="overflow-x-auto pb-0.5 -mx-1 px-1">
        <div className="flex items-center justify-between relative min-w-[300px]">
          {/* Background Connecting Line */}
          <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-ink-100 -z-0" />

        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex || currentState === 'closed' || currentState === 'completed'
          const isCurrent = idx === currentIndex
          const isPending = idx > currentIndex

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10">
              <div
                className={clsx(
                  'h-7 w-7 rounded-full grid place-items-center text-[11px] font-semibold transition-all',
                  isDone && 'bg-leaf-600 text-white ring-2 ring-leaf-100',
                  isCurrent && 'bg-saffron-500 text-white ring-4 ring-saffron-100 scale-110',
                  isPending && 'bg-ink-100 text-ink-400 border border-ink-200'
                )}
              >
                {isDone ? <Check size={14} /> : isCurrent ? <Clock size={14} /> : idx + 1}
              </div>
              <span
                className={clsx(
                  'text-[10.5px] font-medium mt-1.5 whitespace-nowrap hidden sm:block',
                  isDone && 'text-leaf-800',
                  isCurrent && 'text-saffron-600 font-semibold',
                  isPending && 'text-ink-400'
                )}
              >
                {stage.label}
              </span>
              <span
                className={clsx(
                  'text-[10px] font-semibold mt-1 sm:hidden',
                  isCurrent ? 'text-saffron-600' : isDone ? 'text-leaf-800' : 'text-ink-400'
                )}
              >
                {isCurrent ? `Step ${idx + 1}/${LIFECYCLE_STAGES.length}` : ''}
              </span>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
