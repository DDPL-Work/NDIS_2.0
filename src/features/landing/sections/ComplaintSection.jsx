import { CheckCircle2, ClipboardCheck, FileText, Wrench } from 'lucide-react'
import Button from '../../../components/ui/Button'
import LandingCta from '../LandingCta'
import { GRIEVANCE_STATE_LABELS } from '../../../config/constants'

// The journey uses the citizen-facing vocabulary of the real complaint state
// machine (GRIEVANCE_STATE_LABELS): Submitted → Assigned to Department →
// In Progress → Resolved. The four numbered steps are the simplified public
// narrative; the "Status" chips carry the exact app vocabulary.
const STAGES = [
  { n: '01', icon: FileText, state: 'submitted', title: 'Report', text: 'Tell us what’s wrong.' },
  { n: '02', icon: ClipboardCheck, state: 'assigned', title: 'Review', text: 'The concerned team reviews your issue.' },
  { n: '03', icon: Wrench, state: 'in_progress', title: 'Action', text: 'Your complaint reaches the responsible department.' },
  { n: '04', icon: CheckCircle2, state: 'resolved', title: 'Resolution', text: 'Track the progress until resolution.' },
]

export default function ComplaintSection() {
  return (
    <section id="complaints" className="bg-ink-950 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2" data-tour-target="complaint-section">
          <div className="ndisp-scroll-reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-saffron-400">Citizen engagement</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Your Voice, Tracked Every Step</h2>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-ink-300">
              Report civic issues to the concerned department and follow every stage — from submission to resolution.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LandingCta to="/citizen/register"><Button size="lg" variant="saffron" icon={FileText}>Register a Complaint</Button></LandingCta>
              <LandingCta to="/citizen/track"><Button size="lg" variant="outline">Track Complaint</Button></LandingCta>
            </div>
          </div>

          <ol className="ndisp-scroll-reveal stagger-1 relative space-y-0" aria-label="How a complaint is handled">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon
              return (
                <li key={stage.n} className={`ndisp-scroll-reveal stagger-${index} relative flex items-center gap-4 pb-8 last:pb-0`}>
                  {index < STAGES.length - 1 && <span className="ndisp-line-dash absolute left-[15px] top-9 h-[calc(100%-28px)] w-px" aria-hidden="true" />}
                  <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink-600 bg-ink-900">
                    <Icon size={14} className={index === STAGES.length - 1 ? 'text-leaf-400' : 'text-saffron-400'} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[11px] font-bold tracking-widest text-ink-500">{stage.n}</span>
                      <span className="text-[14.5px] font-semibold text-white">{stage.title}</span>
                      <span className="rounded-full border border-ink-600 bg-ink-900 px-2 py-0.5 text-[10.5px] font-medium text-ink-300">
                        Status · {GRIEVANCE_STATE_LABELS[stage.state]}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-ink-400">{stage.text}</span>
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
