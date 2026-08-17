import { ArrowLeft, ArrowRight, X } from 'lucide-react'

// Tour tooltip — styled with the portal design system.  Pure presentation:
// placement math lives in the overlay engine.
export default function CitizenTourTooltip({ step, stepNumber, stepCount, position, onBack, onNext, onSkip, onClose, onFinish }) {
  const isDoneStep = step.done
  const isFirst = stepNumber === 0
  const isLast = stepNumber === stepCount - 1

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="citizen-tour-title"
      tabIndex={-1}
      className="citizen-tour-tooltip fixed z-[210] w-[min(340px,calc(100vw-24px))] rounded-2xl bg-white shadow-popover border border-ink-100 focus:outline-none"
      style={{ left: position.left, top: position.top }}
    >
      <button
        onClick={onClose}
        aria-label="Close tour"
        title="Close tour"
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700"
      >
        <X size={15} />
      </button>

      <div className="px-5 pt-4 pr-11 pb-4">
        <p className="eyebrow text-saffron-600">Citizen Portal</p>
        <h3 id="citizen-tour-title" className="mt-1 text-[15px] font-semibold text-ink-950 leading-snug">
          {step.title}
        </h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-600">{step.description}</p>

        {!isDoneStep && (
          <p aria-live="polite" className="mt-3 text-[11px] font-semibold text-ink-400">
            Step {stepNumber + 1} of {stepCount}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink-100 px-5 py-3">
        {isFirst ? (
          <button
            onClick={onSkip}
            aria-label="Skip tour"
            className="rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-500 hover:bg-ink-100 hover:text-ink-800"
          >
            Skip tour
          </button>
        ) : (
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-ink-600 hover:bg-ink-100 hover:text-ink-900"
          >
            <ArrowLeft size={13} /> Back
          </button>
        )}

        {isDoneStep ? (
          <button
            onClick={onFinish}
            aria-label="Finish tour"
            className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-600 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-leaf-700"
          >
            Start Exploring
          </button>
        ) : (
          <button
            onClick={isLast ? onFinish : onNext}
            aria-label="Next"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:bg-ink-950"
          >
            {isLast ? 'Finish' : 'Next'} <ArrowRight size={13} />
          </button>
        )}
      </div>
    </div>
  )
}