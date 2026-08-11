import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, LockKeyhole, MapPinned, UserPlus } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { getDefaultRoute } from '../../app/authRoutes'
import { DEMO_PERSONAS } from './demoPersonas'
import Icon from '../../components/ui/Icon'

export default function LoginPage() {
  const navigate = useNavigate(); const signIn = useAuthStore((s) => s.signIn); const signUp = useAuthStore((s) => s.signUp); const demoSignIn = useAuthStore((s) => s.demoSignIn); const status = useAuthStore((s) => s.status); const storeError = useAuthStore((s) => s.error); const user = useAuthStore((s) => s.user)
  const [signup, setSignup] = useState(false); const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '' }); const [notice, setNotice] = useState('')
  const busy = status === 'loading'
  useEffect(() => { if (user?.role && status === 'authenticated') navigate(getDefaultRoute(user.role), { replace: true }) }, [navigate, status, user])
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function submit(event) { event.preventDefault(); setNotice(''); try { if (signup) { await signUp(form); setNotice('Account created. You can now sign in.'); setSignup(false) } else { await signIn({ username: form.username, password: form.password }) } } catch { /* Store exposes a safe message. */ } }
  function demo(persona) { const route = demoSignIn(persona); navigate(route, { replace: true }) }
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-white/10 bg-white/[.06] p-7 shadow-2xl backdrop-blur">
          <div className="mb-7 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-saffron-500 text-white"><MapPinned size={23} /></div>
            <h1 className="mt-4 text-xl font-semibold text-white">NDISP secure access</h1>
            <p className="mt-1 text-sm text-ink-300">Sign in with your authorised government account.</p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            {signup && <><Field label="Full name" name="full_name" value={form.full_name} onChange={change} autoComplete="name" /><Field label="Email" name="email" type="email" value={form.email} onChange={change} autoComplete="email" /></>}
            <Field label="Username" name="username" value={form.username} onChange={change} autoComplete="username" />
            <Field label="Password" name="password" type="password" value={form.password} onChange={change} autoComplete={signup ? 'new-password' : 'current-password'} />
            {(storeError || notice) && <p className={storeError ? 'text-xs text-alert-300' : 'text-xs text-leaf-300'}>{storeError || notice}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-saffron-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-600 disabled:opacity-60">
              {signup ? <UserPlus size={16} /> : <LockKeyhole size={16} />}{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <button onClick={() => { setSignup((value) => !value); setNotice('') }} className="mt-5 w-full text-center text-xs text-saffron-300 hover:text-saffron-200">{signup ? 'Already have an account? Sign in' : 'Need an account? Create one'}</button>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[.03] p-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
            <FlaskConical size={13} className="text-saffron-400" />Demo access (mock-data build — no backend required)
          </div>
          <p className="mt-1 text-[11.5px] text-ink-400">Personas for evaluating the State Administration Panel and existing portals.</p>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEMO_PERSONAS.map((persona) => (
              <button key={persona.id} onClick={() => demo(persona)} className="flex flex-col items-start gap-1.5 rounded-lg border border-white/10 bg-white/[.05] px-3 py-2.5 text-left transition-colors hover:border-saffron-400 hover:bg-white/[.09]">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-ink-700 text-saffron-300"><Icon name={persona.icon} size={13} /></span>
                <span className="text-[12px] font-medium text-white leading-tight">{persona.label}</span>
                <span className="text-[10.5px] text-ink-400">{persona.id.includes('dm') ? 'DM Portal' : persona.id.includes('dept-head') ? 'Department Portal' : 'State Admin'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
function Field({ label, ...props }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-ink-200">{label}</span><input required className="w-full rounded-lg border border-white/15 bg-white/[.07] px-3 py-2.5 text-sm text-white outline-none placeholder:text-ink-400 focus:border-saffron-400" {...props} /></label> }