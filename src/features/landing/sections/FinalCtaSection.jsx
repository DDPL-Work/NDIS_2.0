import { Link } from 'react-router-dom'
import { LayoutDashboard, LogIn, MapPinned, UserPlus } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { useAuthStore } from '../../../app/store/authStore'
import { getDefaultRoute } from '../../../app/authRoutes'

export default function FinalCtaSection() {
  const user = useAuthStore((s) => s.user)
  const portalRoute = user?.role ? getDefaultRoute(user.role) : '/citizen'

  return (
    <section className="bg-white pb-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
            <svg viewBox="0 0 640 320" className="h-full w-full">
              <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1">
                {[60, 120, 180, 240].map((y) => <line key={`h${y}`} x1="0" y1={y} x2="640" y2={y} />)}
                {[80, 160, 240, 320, 400, 480, 560].map((x) => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="320" />)}
              </g>
            </svg>
          </div>
          <div className="relative">
            <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900 px-3.5 py-1.5 text-[12px] font-semibold text-saffron-400"><MapPinned size={13} />NDISP</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Your district is closer than you think.</h2>
            <p className="mx-auto mt-3 max-w-xl text-[14.5px] leading-relaxed text-ink-300">Explore services, find facilities and stay connected with your local administration.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3" data-tour-target="create-account">
              {user ? (
                <>
                  <Link to={portalRoute}><Button size="lg" variant="saffron" icon={LayoutDashboard}>Continue to Citizen Portal</Button></Link>
                  <Link to="/login" className="flex items-center gap-1 text-[13.5px] font-semibold text-ink-300 underline-offset-4 hover:text-white hover:underline"><LogIn size={14} />Login</Link>
                </>
              ) : (
                <>
                  <Link to="/register"><Button size="lg" variant="saffron" icon={UserPlus}>Create Citizen Account</Button></Link>
                  <a href="#services" className="inline-flex items-center gap-2 rounded-lg border border-ink-600 bg-transparent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500/40">Explore Services</a>
                  <Link to="/login" className="flex items-center gap-1 text-[13.5px] font-semibold text-ink-300 underline-offset-4 hover:text-white hover:underline"><LogIn size={14} />Login</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}