import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, LogIn, MapPinned, Menu, UserPlus, X } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { useAuthStore } from '../../../app/store/authStore'
import { getDefaultRoute } from '../../../app/authRoutes'

const NAV = [
  { label: 'Home', href: '#top' },
  { label: 'Services', href: '#services' },
  { label: 'Explore Map', href: '#explore' },
  { label: 'Complaints', href: '#complaints' },
  { label: 'Schemes', href: '#schemes' },
  { label: 'About', href: '#about' },
]

// Sticky public header: transparent over the hero, glass/white after scroll.
// Authentication-aware — a signed-in citizen sees "Continue to Citizen
// Portal" instead of registration prompts; admin links are never shown.
export default function PublicHeader({ onStartTour }) {
  const user = useAuthStore((s) => s.user)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const portalRoute = user?.role ? getDefaultRoute(user.role) : '/citizen'

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled || open ? 'border-b border-ink-100 bg-white/90 backdrop-blur-md shadow-[0_1px_12px_rgba(11,53,88,0.06)]' : 'bg-transparent'}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-ink-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white">Skip to content</a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="NDISP home">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-900 text-saffron-400"><MapPinned size={18} /></span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[15px] font-bold tracking-tight text-ink-950">NDISP</span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400 sm:block">National District Information &amp; Service Platform</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-ink-100/70 hover:text-ink-950">{item.label}</a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Link to={portalRoute} className="hidden sm:block">
              <Button size="md" variant="saffron" icon={LayoutDashboard}>Continue to Citizen Portal</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block"><Button size="md" variant="ghost">Login</Button></Link>
              <Link to="/register" className="hidden sm:block"><Button size="md" icon={UserPlus}>Register</Button></Link>
            </>
          )}
          <button
            onClick={() => onStartTour?.()}
            className="hidden rounded-lg px-3 py-2 text-[12.5px] font-medium text-ink-500 transition-colors hover:bg-ink-100/70 hover:text-ink-800 md:block"
          >
            Take a Tour
          </button>
          <button onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink-100 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-800 hover:bg-ink-50">{item.label}</a>
            ))}
            <button onClick={() => { setOpen(false); onStartTour?.() }} className="rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-ink-800 hover:bg-ink-50">Take a Tour</button>
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">
              {user ? (
                <Link to={portalRoute} onClick={() => setOpen(false)}><Button className="w-full" size="lg" variant="saffron" icon={LayoutDashboard}>Continue to Citizen Portal</Button></Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)}><Button className="w-full" size="lg" variant="outline" icon={LogIn}>Login</Button></Link>
                  <Link to="/register" onClick={() => setOpen(false)}><Button className="w-full" size="lg" icon={UserPlus}>Create Account</Button></Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}