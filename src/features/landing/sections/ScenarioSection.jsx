import { HeartPulse, Megaphone, Compass } from 'lucide-react'
import Button from '../../../components/ui/Button'
import LandingCta from '../LandingCta'

// Realistic citizen scenarios — each card is a working action. "Find a
// Hospital" runs the real spatial-query search; "Report an Issue" routes
// through LandingCta (real route for signed-in users); "Explore Services"
// jumps to the service grid.
const SCENARIOS = [
  { icon: HeartPulse, title: 'Need a nearby hospital?', text: 'Find nearby health facilities.', action: 'Find a Hospital', kind: 'search' },
  { icon: Megaphone, title: 'Have a civic issue?', text: 'Report it and track progress.', action: 'Report an Issue', kind: 'route', to: '/citizen/register' },
  { icon: Compass, title: 'Looking for a government service?', text: 'Explore available services.', action: 'Explore Services', kind: 'anchor', href: '#services' },
]

export default function ScenarioSection({ onFindHospital = null }) {
  return (
    <section id="scenarios" className="bg-ink-50/70 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">Start here</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">What do you need right now?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-500">Common situations, handled in a couple of clicks.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SCENARIOS.map((scenario, index) => {
            const Icon = scenario.icon
            return (
              <div key={scenario.title} className={`ndisp-scroll-reveal stagger-${index} relative rounded-xl2 border border-ink-100 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-popover`}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-900 text-saffron-400"><Icon size={22} /></span>
                <h3 className="mt-4 text-[16px] font-bold text-ink-950">{scenario.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{scenario.text}</p>
                {scenario.kind === 'search' ? (
                  <Button size="md" variant="primary" className="mt-4" onClick={() => onFindHospital?.()}>{scenario.action}</Button>
                ) : scenario.kind === 'route' ? (
                  <span className="mt-4 inline-block"><LandingCta to={scenario.to}><Button size="md" variant="primary">{scenario.action}</Button></LandingCta></span>
                ) : (
                  <span className="mt-4 inline-block"><a href={scenario.href}><Button size="md" variant="primary">{scenario.action}</Button></a></span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
