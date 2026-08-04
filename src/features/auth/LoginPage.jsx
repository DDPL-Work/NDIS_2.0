import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store/authStore'
import { ROLES, ROLE_LABELS } from '../../config/constants'
import { User, Gavel, ShieldCheck, Building2, Wrench, Globe2, MapPinned, Activity, Eye, ClipboardList } from 'lucide-react'
import { useI18n } from '../../i18n/i18n'

const ROLE_CARDS = [
  { role: ROLES.CITIZEN, icon: User, blurb: 'Register complaints via 5-step wizard, track status & confirm resolution.' },
  { role: ROLES.DISTRICT_COLLECTOR, icon: Gavel, blurb: 'District Executive command center, SLA leaderboards & AI recommendations.' },
  { role: ROLES.DM, icon: ShieldCheck, blurb: 'District Magistrate approvals, directive tasking & proposal review.' },
  { role: ROLES.ADM, icon: Eye, blurb: 'Delegated administrative oversight & sector grievance monitoring.' },
  { role: ROLES.DEPT_HEAD, icon: Building2, blurb: 'Departmental resource planning, asset schemas & officer tasking.' },
  { role: ROLES.DEPT_OFFICER, icon: ClipboardList, blurb: 'Manage assigned complaints queue, schedule inspections & resolve.' },
  { role: ROLES.FIELD_INSPECTOR, icon: Wrench, blurb: 'Field inspector mobile PWA, site geotag validation & evidence upload.' },
  { role: ROLES.ENGINEER, icon: Activity, blurb: 'Assistant / Executive Engineer job execution & material logging.' },
  { role: ROLES.SUPERVISOR, icon: ShieldCheck, blurb: 'Field operations supervision & inspection report verification.' },
  { role: ROLES.STATE_ADMIN, icon: Globe2, blurb: 'State-level cross-district KPI comparison & radar analytics.' },
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

      <div className="relative w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-saffron-500 text-white shadow-lg">
              <MapPinned size={22} />
            </div>
            <div className="text-left">
              <p className="font-display text-lg font-semibold text-white tracking-tight leading-none">NDISP 2.0</p>
              <p className="text-[11px] text-ink-300 leading-none mt-1">National District Infrastructure &amp; Services Portal</p>
            </div>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-white">Program 2: Complaint Management &amp; Simulation Engine</h1>
          <p className="text-ink-300 text-[13px] mt-1.5">Select a role persona to explore the end-to-end reactive workflow engine (Nalanda &amp; Rajgir Pilot)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLE_CARDS.map(({ role, icon: Icon, blurb }) => (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              className="group text-left rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] hover:border-saffron-500/50 backdrop-blur px-4 py-3.5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-saffron-300 group-hover:bg-saffron-500 group-hover:text-white transition-colors shrink-0">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13.5px] font-semibold text-white truncate">{ROLE_LABELS[role]}</h3>
                  <span className="text-[11px] text-saffron-300 font-semibold group-hover:translate-x-0.5 transition-transform inline-block">
                    Enter Portal →
                  </span>
                </div>
              </div>
              <p className="text-[11.5px] text-ink-300 mt-2 leading-snug">{blurb}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-[11.5px] text-ink-400 mt-6">
          NDISP Program 2 Specification — JWT claims simulation, 11-stage state machine &amp; reactive simulation engine enabled.
        </p>
      </div>
    </div>
  )
}
