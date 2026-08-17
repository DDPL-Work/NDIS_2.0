import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, FileText, Search } from 'lucide-react'
import Button from '../../../components/ui/Button'

// Lifecycle uses the citizen-facing vocabulary of the real complaint state
// machine (COMPLAINT_STATE_LABELS): Submitted → Assigned → In Progress →
// Resolved. States shown here are the main path citizens see on their
// complaint; the full workflow has more intermediate stages.
const STAGES = [
  { label: 'Submitted', text: 'Your report reaches the district.' },
  { label: 'Assigned', text: 'The right department takes it up.' },
  { label: 'In Progress', text: 'Work begins at the location.' },
  { label: 'Resolved', text: 'Outcome is shared with you.' },
]

export default function ComplaintSection() {
  return (
    <section id="complaints" className="bg-ink-950 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2" data-tour-target="complaint-section">
          <div className="ndisp-scroll-reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-saffron-400">Citizen engagement</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">See Something That Needs Attention?</h2>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-ink-300">
              Report civic issues to the concerned department and follow the progress from submission to resolution.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/citizen/register"><Button size="lg" variant="saffron" icon={FileText}>Register a Complaint</Button></Link>
              <Link to="/citizen/track" className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-transparent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500/40"><Search size={16} />Track Complaint</Link>
            </div>
          </div>

          <ol className="ndisp-scroll-reveal stagger-1 relative space-y-0" aria-label="How a complaint is handled">
            {STAGES.map((stage, index) => {
              const Icon = index === STAGES.length - 1 ? CheckCircle2 : Circle
              return (
                <li key={stage.label} className="relative flex items-center gap-4 pb-8 last:pb-0">
                  {index < STAGES.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-28px)] w-px bg-ink-700" aria-hidden="true" />}
                  <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink-600 bg-ink-900 text-ink-300">
                    <Icon size={14} className={index === STAGES.length - 1 ? 'text-leaf-400' : 'text-saffron-400'} />
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold text-white">{stage.label}</span>
                    <span className="block text-[12.5px] text-ink-400">{stage.text}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}