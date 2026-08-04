import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store/authStore'
import { ROLES, ROLE_LABELS } from '../../config/constants'
import { User, Gavel, ShieldCheck, Building2, Wrench, Globe2, MapPinned } from 'lucide-react'
import { useI18n } from '../../i18n/i18n'

const ROLE_CARDS = [
  { role: ROLES.CITIZEN, icon: User, blurb: 'Explore the district map, report issues and track schemes.' },
  { role: ROLES.DM, icon: Gavel, blurb: 'District-wide visibility, approvals and tasking.' },
  { role: ROLES.ADM, icon: ShieldCheck, blurb: 'Delegated approvals within assigned sectors.' },
  { role: ROLES.DEPT_OFFICER, icon: Building2, blurb: 'Manage sector data, respond to directives.' },
  { role: ROLES.FIELD_ENGINEER, icon: Wrench, blurb: 'Update asset status, geo-tag inspection photos.' },
  { role: ROLES.STATE_ADMIN, icon: Globe2, blurb: 'Cross-district KPI comparison (Phase 2+).' },
]

export default function LoginPage() {
  const signInAs = useAuthStore((s) => s.signInAs)
  const navigate = useNavigate()
  const { t } = useI18n()

  function handleSelect(role) {
    const portal = signInAs(role)
    navigate(`/${portal}`)
  }

  return (
    <div className="min-h-screen bg-ink-950 relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }} />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-saffron-500/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-leaf-500/15 blur-3xl" />

      <div className="relative w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-saffron-500 text-white">
              <MapPinned size={22} />
            </div>
            <div className="text-left">
              <p className="font-display text-lg font-semibold text-white tracking-tight leading-none">NDISP</p>
              <p className="text-[11px] text-ink-300 leading-none mt-1">National District Infrastructure &amp; Services Portal</p>
            </div>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-white">{t('login.title', 'Sign in to NDISP')}</h1>
          <p className="text-ink-300 text-[13.5px] mt-2">{t('login.subtitle')} — Nalanda &amp; Rajgir Pilot, Bihar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ROLE_CARDS.map(({ role, icon: Icon, blurb }) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className="group text-left rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 backdrop-blur px-5 py-5 transition-colors"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-saffron-300 mb-3.5 group-hover:bg-saffron-500 group-hover:text-white transition-colors">
                <Icon size={18} />
              </div>
              <h3 className="text-[14px] font-semibold text-white">{ROLE_LABELS[role]}</h3>
              <p className="text-[12px] text-ink-300 mt-1 leading-snug">{blurb}</p>
              <span className="mt-3 inline-block text-[11.5px] font-semibold text-saffron-300 group-hover:translate-x-0.5 transition-transform">
                {t('login.continue')} →
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-[11.5px] text-ink-400 mt-8">
          Demo build — persona selection stands in for government SSO (OIDC) at pilot. All data shown is illustrative mock data.
        </p>
      </div>
    </div>
  )
}
