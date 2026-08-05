import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store/authStore'
import { ROLES, ROLE_LABELS, LANGUAGES } from '../../config/constants'
import { User, Gavel, ShieldCheck, Building2, Wrench, Globe2, MapPinned, Activity, Eye, ClipboardList, Home, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../../i18n/i18n'
import heroBg from '../../assets/hero-bg.jpg'

const ROLE_CARDS = [
  { key: 'citizen', role: ROLES.CITIZEN, icon: User },
  { key: 'collector', role: ROLES.DISTRICT_COLLECTOR, icon: Gavel },
  { key: 'dm', role: ROLES.DM, icon: ShieldCheck },
  { key: 'adm', role: ROLES.ADM, icon: Eye },
  { key: 'deptHead', role: ROLES.DEPT_HEAD, icon: Building2 },
  { key: 'deptOfficer', role: ROLES.DEPT_OFFICER, icon: ClipboardList },
  { key: 'inspector', role: ROLES.FIELD_INSPECTOR, icon: Wrench },
  { key: 'engineer', role: ROLES.ENGINEER, icon: Activity },
  { key: 'supervisor', role: ROLES.SUPERVISOR, icon: ShieldCheck },
  { key: 'stateAdmin', role: ROLES.STATE_ADMIN, icon: Globe2 },
]

/* Simplified on-brand national seal */
function Emblem({ className = '' }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15)
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={className}>
      <circle cx="24" cy="24" r="23" fill="currentColor" opacity="0.12" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="2.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        {spokes.map((deg) => (
          <line key={deg} x1="24" y1="5" x2="24" y2="20" transform={`rotate(${deg} 24 24)`} />
        ))}
      </g>
    </svg>
  )
}

export default function LoginPage() {
  const signInAs = useAuthStore((s) => s.signInAs)
  const navigate = useNavigate()
  const { locale, setLocale, t } = useI18n()

  function handleSelect(role) {
    const portal = signInAs(role)
    navigate(`/${portal}`)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-royal-950 px-4 py-16 font-body text-white sm:py-12">
      {/* Background image + scrims — mirrors the Home hero */}
      <div aria-hidden="true" className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-royal-950/90 via-royal-950/70 to-royal-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-royal-950/85 via-transparent to-royal-950/30" />
        <div className="absolute inset-0 bg-royal-950/10" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }} />
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-royal-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-saffron-500/15 blur-3xl" />
      </div>

      {/* Utility bar */}
      <div className="absolute left-0 top-0 right-0 z-10 bg-royal-950/40 backdrop-blur">
        <div className="mx-auto flex h-10 max-w-6xl items-center justify-between px-4 sm:px-6 text-[11px] text-royal-200">
          <p className="flex items-center gap-2 tracking-wide">
            <span className="hidden sm:inline font-semibold text-white/90">{t('landing.govTop')}</span>
            <span className="hidden sm:inline opacity-40">|</span>
            <span className="sm:hidden font-semibold text-white/90">{t('app.name')}</span>
            <span className="hidden sm:inline">{t('landing.portalName')}</span>
          </p>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-1.5 py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLocale(lang.code)}
                className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors ${locale === lang.code ? 'bg-royal-500 text-white' : 'text-royal-200 hover:text-white'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-6xl">
        {/* Brand + heading */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center text-saffron-400">
              <Emblem className="h-12 w-12" />
            </span>
            <span className="leading-tight text-left">
              <span className="block font-display text-lg font-bold tracking-tight text-white">
                NDISP <span className="text-saffron-400">2.0</span>
              </span>
              <span className="block max-w-[260px] text-[10.5px] text-royal-300">{t('app.fullName')}</span>
            </span>
          </Link>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-royal-100 backdrop-blur">
            <MapPinned size={13} className="text-saffron-300" />
            {t('landing.hero.badge')}
          </p>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white drop-shadow md:text-4xl">
            {t('login.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-royal-200">{t('login.personaHint')}</p>
        </div>

        {/* Role persona selector */}
        <div className="rounded-xl2 border border-white/10 bg-royal-950/55 p-5 shadow-2xl backdrop-blur-md sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-royal-700 text-saffron-300">
                <SlidersHorizontal size={16} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-semibold text-white">{t('login.selectRole')}</h2>
                <p className="text-[11px] text-royal-400">{t('login.subtitle')}</p>
              </div>
            </div>
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-medium text-royal-200 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Home size={13} /> {t('login.backHome')}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ROLE_CARDS.map(({ key, role, icon: Icon }) => (
              <button
                key={role}
                onClick={() => handleSelect(role)}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-saffron-400/60 hover:bg-white/[0.1] hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.6)]"
              >
                <span aria-hidden="true" className="absolute right-0 bottom-0 h-16 w-16 rounded-tl-full bg-royal-600/10 transition-colors group-hover:bg-saffron-400/15" />
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-royal-700 text-saffron-300 transition-colors group-hover:bg-saffron-500 group-hover:text-royal-950">
                  <Icon size={17} />
                </div>
                <h3 className="mt-3 text-[13px] font-semibold leading-snug text-white">{t(`login.roleLabel.${key}`, ROLE_LABELS[role])}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-royal-300">{t(`login.role.${key}`)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-saffron-300 transition-transform group-hover:translate-x-1">
                  {t('login.enter')} →
                </span>
              </button>
            ))}
          </div>

          {/* Mobile back link */}
          <div className="mt-5 flex justify-center sm:hidden">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-medium text-royal-200">
              <Home size={13} /> {t('login.backHome')}
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-royal-400" dangerouslySetInnerHTML={{ __html: t('login.specNote') }} />
      </div>
    </div>
  )
}