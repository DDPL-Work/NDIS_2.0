import { Link } from 'react-router-dom'
import { LayoutDashboard, MapPin, MapPinned, SearchCheck, Sparkles, TriangleAlert, UserPlus } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { useAuthStore } from '../../../app/store/authStore'
import { getDefaultRoute } from '../../../app/authRoutes'
import AnimatedDistrictVisual from './AnimatedDistrictVisual'
import HeroBackdrop from './HeroBackdrop'
import HeroSearch from './HeroSearch'
import LandingCta from '../LandingCta'

const QUICK_ACTIONS = [
  { icon: MapPin, title: 'Find Nearby', to: '/citizen/map' },
  { icon: TriangleAlert, title: 'Report Problem', to: '/citizen/register' },
  { icon: SearchCheck, title: 'Track Request', to: '/citizen/track' },
  { icon: MapPinned, title: 'Explore Map', to: '/citizen/map' },
]

export default function HeroSection({ requestSearch = null, externalQuery = null }) {
  const user = useAuthStore((s) => s.user)
  const portalRoute = user?.role ? getDefaultRoute(user.role) : '/citizen'

  return (
    <section id="top" className="ndisp-gradient-pan relative overflow-hidden bg-gradient-to-br from-ink-50 via-white to-saffron-50/50 pt-28 pb-14 sm:pt-32">
      <HeroBackdrop />
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <div className="text-center lg:text-left">
          <p className="ndisp-fade-in mx-auto inline-flex items-center gap-1.5 rounded-full border border-saffron-200 bg-white px-3.5 py-1.5 text-[12px] font-semibold text-saffron-700 lg:mx-0">
            <Sparkles size={13} />Government services, made simple
          </p>
          <h1 className="ndisp-reveal mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink-950 sm:text-5xl xl:text-6xl">
            Your District. Your Services. <span className="text-ink-900">Your Voice.</span>
          </h1>
          <p className="ndisp-scroll-reveal mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-600 lg:mx-0">
            Access public services, discover facilities, raise complaints, track requests and stay connected with your district — all in one place.
          </p>

          <div className="ndisp-scroll-reveal mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            {user ? (
              <>
                <Link to={portalRoute}><Button size="lg" variant="saffron" icon={LayoutDashboard}>Continue to Citizen Portal</Button></Link>
                <a href="#services"><Button size="lg" variant="outline">Explore Services</Button></a>
              </>
            ) : (
              <>
                <a href="#services"><Button size="lg" variant="saffron">Explore Services</Button></a>
                <Link to="/register"><Button size="lg" variant="outline">Get Started</Button></Link>
                <span className="mx-1 hidden h-5 w-px bg-ink-200 sm:block" aria-hidden="true" />
                <Link to="/login" className="text-[13.5px] font-semibold text-ink-700 underline-offset-4 hover:underline">Login</Link>
                <Link to="/register" className="flex items-center gap-1 text-[13.5px] font-semibold text-saffron-700 underline-offset-4 hover:underline"><UserPlus size={14} />Create Account</Link>
              </>
            )}
          </div>

          <div className="ndisp-scroll-reveal mx-auto mt-9 max-w-2xl lg:mx-0" data-tour-target="hero-search">
            <HeroSearch externalQuery={externalQuery} />
          </div>

          <div className="ndisp-scroll-reveal mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Quick actions">
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon
              return (
                <LandingCta
                  key={action.title}
                  to={action.to}
                  className={`ndisp-scroll-reveal stagger-${index} group flex flex-col items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-3.5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-saffron-300 hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500/40`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-50 text-ink-700 transition-all duration-200 group-hover:bg-saffron-50 group-hover:text-saffron-700">
                    <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
                  </span>
                  <span className="text-[12.5px] font-semibold text-ink-800 group-hover:text-ink-950">{action.title}</span>
                </LandingCta>
              )
            })}
          </div>
        </div>

        <div className="ndisp-scroll-reveal" data-tour-target="hero-map">
          <AnimatedDistrictVisual onExplore={(marker) => requestSearch?.(marker.query)} />
        </div>
      </div>
    </section>
  )
}
