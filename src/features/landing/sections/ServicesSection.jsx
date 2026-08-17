import { Link } from 'react-router-dom'
import { Bell, Building2, Compass, FileText, FolderKanban, Landmark, MapPinned, Search } from 'lucide-react'

// Services that exist today in the citizen portal. Where a service requires a
// signed-in account (complaint registration, tracking, notifications) the CTA
// still leads to the existing route — the portal itself handles login.
const SERVICES = [
  { icon: FileText, title: 'Register a Complaint', text: 'Tell us about a civic issue and track its progress.', cta: 'Report an Issue', to: '/citizen/register', accent: 'bg-saffron-50 text-saffron-600' },
  { icon: Search, title: 'Track Complaint', text: 'Follow the status of a request you have already raised.', cta: 'Track Now', to: '/citizen/track', accent: 'bg-sky-50 text-sky-600' },
  { icon: MapPinned, title: 'Explore Facilities', text: 'Discover hospitals, schools, water points and more.', cta: 'Explore Map', to: '/citizen/map', accent: 'bg-leaf-50 text-leaf-600' },
  { icon: Compass, title: 'Find Nearby Services', text: 'Search for the nearest service to your location.', cta: 'Find Nearby', to: '/citizen/map', accent: 'bg-ink-50 text-ink-600' },
  { icon: Landmark, title: 'Government Schemes', text: 'Learn about schemes and services available to you.', cta: 'View Schemes', to: '/citizen/schemes', accent: 'bg-amber-50 text-amber-600' },
  { icon: Building2, title: 'District Information', text: 'Get to know your district — facilities, departments and data.', cta: 'View District', to: '/citizen/map', accent: 'bg-ink-50 text-ink-600' },
  { icon: FolderKanban, title: 'Public Projects', text: 'See public works and infrastructure projects near you.', cta: 'Explore Projects', to: '/citizen/map', accent: 'bg-violet-50 text-violet-600' },
  { icon: Bell, title: 'Notifications', text: 'Stay informed about your requests and district updates.', cta: 'View Updates', to: '/citizen/notifications', accent: 'bg-ink-50 text-ink-600' },
]

export default function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">Citizen Services</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Everything You Need, In One Place</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-500">From reporting a problem to finding a school nearby — start with what you need.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, index) => {
            const Icon = service.icon
            return (
              <div key={service.title} data-tour-target={service.to === '/citizen/register' ? 'service-complaint' : undefined} className={`ndisp-scroll-reveal stagger-${index % 4} group flex flex-col rounded-xl2 border border-ink-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-popover`}>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${service.accent}`}><Icon size={20} /></span>
                <h3 className="mt-4 text-[15px] font-bold text-ink-950">{service.title}</h3>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-ink-500">{service.text}</p>
                <Link to={service.to} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-900 underline-offset-4 transition-colors group-hover:text-saffron-700">
                  {service.cta}
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">→</span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}