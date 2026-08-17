import { Link } from 'react-router-dom'
import { MapPinned } from 'lucide-react'

// Footer links point only to existing routes or in-page anchors — no dead
// links. Privacy/Terms/Contact pages do not exist yet, so those entries are
// intentionally omitted until real pages exist.
const CITIZEN_SERVICES = [
  { label: 'Register a Complaint', to: '/citizen/register' },
  { label: 'Track a Complaint', to: '/citizen/track' },
  { label: 'Explore Map', to: '/citizen/map' },
  { label: 'Facilities', to: '/citizen/map' },
  { label: 'Schemes', to: '/citizen/schemes' },
]

const EXPLORE = [
  { label: 'Home', href: '#top' },
  { label: 'Services', href: '#services' },
  { label: 'Explore Your District', href: '#explore' },
  { label: 'Complaints', href: '#complaints' },
  { label: 'Schemes & Services', href: '#schemes' },
  { label: 'About NDISP', href: '#about' },
]

export default function PublicFooter() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-saffron-400"><MapPinned size={18} /></span>
              <span className="font-display text-[15px] font-bold tracking-tight text-ink-950">NDISP</span>
            </div>
            <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-ink-500">
              National District Information &amp; Service Platform — public services, district information and citizen engagement in one place.
            </p>
            <p className="mt-4 text-[11px] text-ink-400">Made for citizens, by district administration.</p>
          </div>

          <nav aria-label="Citizen services">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Citizen Services</h3>
            <ul className="mt-3 space-y-2">
              {CITIZEN_SERVICES.map((item) => (
                <li key={item.label}><Link to={item.to} className="text-[13px] text-ink-600 transition-colors hover:text-ink-950 hover:underline">{item.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Explore">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Explore</h3>
            <ul className="mt-3 space-y-2">
              {EXPLORE.map((item) => (
                <li key={item.label}><a href={item.href} className="text-[13px] text-ink-600 transition-colors hover:text-ink-950 hover:underline">{item.label}</a></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Access">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Access</h3>
            <ul className="mt-3 space-y-2">
              <li><Link to="/login" className="text-[13px] text-ink-600 transition-colors hover:text-ink-950 hover:underline">Login</Link></li>
              <li><Link to="/register" className="text-[13px] text-ink-600 transition-colors hover:text-ink-950 hover:underline">Create an Account</Link></li>
              <li><Link to="/citizen/map" className="text-[13px] text-ink-600 transition-colors hover:text-ink-950 hover:underline">Explore Map</Link></li>
              <li><Link to="/citizen/track" className="text-[13px] text-ink-600 transition-colors hover:text-ink-950 hover:underline">Track Complaint</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 sm:flex-row">
          <p className="text-[11.5px] text-ink-400">© {new Date().getFullYear()} NDISP · National District Information &amp; Service Platform</p>
          <p className="text-[11.5px] text-ink-400">This portal is an information and citizen-service platform.</p>
        </div>
      </div>
    </footer>
  )
}