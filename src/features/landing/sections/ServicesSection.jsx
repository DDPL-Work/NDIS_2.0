import { ArrowRight, Building2, Bus, Compass, Droplets, FileText, GraduationCap, HeartPulse, Landmark } from 'lucide-react'
import LandingCta from '../LandingCta'

// Services that exist today in the citizen portal, organised as public-facing
// categories. Where a service requires a signed-in account the CTA routes
// through LandingCta (real route for signed-in users, in-page anchor or the
// public login page for anonymous visitors).
const SERVICES = [
  { icon: HeartPulse, title: 'Health', text: 'Find hospitals, PHCs and health facilities near you.', cta: 'Explore', to: '/citizen/map', accent: 'bg-saffron-50 text-saffron-600' },
  { icon: GraduationCap, title: 'Education', text: 'Public schools and learning facilities in your district.', cta: 'Explore', to: '/citizen/map', accent: 'bg-sky-50 text-sky-600' },
  { icon: Droplets, title: 'Water', text: 'Water supply points and related infrastructure.', cta: 'Explore', to: '/citizen/map', accent: 'bg-cyan-50 text-cyan-600' },
  { icon: Bus, title: 'Transport', text: 'Public transport and road infrastructure.', cta: 'Explore', to: '/citizen/map', accent: 'bg-ink-50 text-ink-600' },
  { icon: Building2, title: 'Public Facilities', text: 'Community buildings, parks and public amenities.', cta: 'Explore', to: '/citizen/map', accent: 'bg-leaf-50 text-leaf-600' },
  { icon: FileText, title: 'Complaints', text: 'Report civic issues and track every step.', cta: 'Report an Issue', to: '/citizen/register', accent: 'bg-amber-50 text-amber-600' },
  { icon: Landmark, title: 'Schemes', text: 'Government support and benefit schemes.', cta: 'View Schemes', to: '/citizen/schemes', accent: 'bg-violet-50 text-violet-600' },
  { icon: Compass, title: 'District Information', text: 'Departments, projects and district updates.', cta: 'View District', to: '/citizen/map', accent: 'bg-ink-50 text-ink-600' },
]

export default function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">How can we help?</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Services for Your District</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-500">From reporting a problem to finding a school nearby — start with what you need.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, index) => {
            const Icon = service.icon
            return (
              <LandingCta
                key={service.title}
                to={service.to}
                data-tour-target={service.to === '/citizen/register' ? 'service-complaint' : undefined}
                className={`ndisp-scroll-reveal stagger-${index % 4} group flex flex-col rounded-xl2 border border-ink-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-saffron-300 hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500/40`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${service.accent}`}><Icon size={20} /></span>
                <h3 className="mt-4 text-[15px] font-bold text-ink-950">{service.title}</h3>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-ink-500">{service.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 underline-offset-4 transition-colors group-hover:text-saffron-700">
                  {service.cta}
                  <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </LandingCta>
            )
          })}
        </div>
      </div>
    </section>
  )
}
