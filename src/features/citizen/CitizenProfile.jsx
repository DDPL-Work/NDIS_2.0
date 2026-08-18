import { useNavigate } from 'react-router-dom'
import { Globe, LogOut, MapPin, User as UserIcon, Languages } from 'lucide-react'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { useAuthStore } from '../../app/store/authStore'
import { useI18n } from '../../i18n/i18n'
import { DISTRICTS } from '../../config/constants'

// Citizen profile.  The profile API exposes read-only identity data (no
// update-profile endpoint exists), so editing stays honest: district and
// language preferences are real, persisted settings; identity fields are
// read-only with helpdesk guidance rather than a fake save button.
export default function CitizenProfile() {
  const user = useAuthStore((state) => state.user)
  const setDistrict = useAuthStore((state) => state.setDistrict)
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()

  const currentDistrictId = user?.districtId || DISTRICTS[0]?.id

  function handleLogout() {
    signOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6" data-tour="citizen-profile-page">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-saffron-600">Citizen Portal</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">Profile</h1>
        <p className="mt-1 text-[13.5px] text-ink-500">Your account and preferences.</p>
      </div>

      {/* Identity */}
      <section className="card border p-4 sm:p-5" aria-label="Account details">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink-900 font-display text-lg font-bold text-saffron-400">
            {String(user?.name || 'C')[0].toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="text-[15.5px] font-semibold text-ink-950">{user?.name || 'Citizen'}</h2>
            <p className="text-[12.5px] text-ink-500">{user?.roleName || 'Citizen'}{user?.districtName ? ` · ${user.districtName}` : ''}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-ink-50/60 p-3">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Email</dt>
            <dd className="mt-1 text-[13px] font-medium text-ink-800">{user?.email || '—'}</dd>
          </div>
          <div className="rounded-xl bg-ink-50/60 p-3">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Mobile</dt>
            <dd className="mt-1 text-[13px] font-medium text-ink-800">{user?.phone || '—'}</dd>
          </div>
          <div className="rounded-xl bg-ink-50/60 p-3">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">District</dt>
            <dd className="mt-1 text-[13px] font-medium text-ink-800">{user?.districtName || '—'}</dd>
          </div>
          <div className="rounded-xl bg-ink-50/60 p-3">
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">Account</dt>
            <dd className="mt-1 text-[13px] font-medium text-ink-800">{user?.username || '—'}</dd>
          </div>
        </dl>

        <p className="mt-4 flex items-start gap-2 rounded-xl border border-ink-100 bg-ink-50/40 p-3 text-[12px] leading-relaxed text-ink-500">
          <UserIcon size={14} className="mt-0.5 shrink-0 text-ink-400" />
          Contact details are managed by the district registration desk. To update your name, mobile or email, please visit your district office or contact the helpdesk.
        </p>
      </section>

      {/* Preferences */}
      <section className="card border p-4 sm:p-5" aria-label="Preferences">
        <h2 className="flex items-center gap-2 text-[14.5px] font-semibold text-ink-950"><MapPin size={15} className="text-leaf-600" /> Location preferences</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-district" className="mb-1.5 block text-[12px] font-semibold text-ink-700">District</label>
            <Select
              id="profile-district"
              value={String(currentDistrictId)}
              onChange={(value) => setDistrict(value)}
              options={DISTRICTS.map((d) => ({ value: String(d.id), label: d.label }))}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold text-ink-700">Language</span>
            <div className="flex gap-2" role="group" aria-label="Language">
              {(['en', 'hi']).map((code) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition-colors ${
                    locale === code ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                  }`}
                >
                  <Languages size={13} /> {code === 'en' ? 'English' : 'हिन्दी'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="card border p-4 sm:p-5" aria-label="Account actions">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-ink-400" />
            <p className="text-[12.5px] text-ink-500">Sign out of your citizen account.</p>
          </div>
          <Button variant="danger" icon={LogOut} onClick={handleLogout}>Logout</Button>
        </div>
      </section>
    </div>
  )
}