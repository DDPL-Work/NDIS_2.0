import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '../../services/auth/AuthService'
import { getDefaultRoute } from '../../app/authRoutes'

// Demo-access marker.  Demo personas have no gateway tokens, so a full page
// reload would otherwise wipe the persisted user during session restore
// (AuthService.restoreSession returns null without tokens).  The marker keeps
// a demo session alive across reloads; real SSO sessions never set it.
const DEMO_MARKER = 'ndisp.demo.session'

let restoreInFlight = null

export const useAuthStore = create(persist((set, get) => ({
  user: null,
  status: 'restoring', // restoring | loading | authenticated | idle | error
  error: null,
  async signIn(credentials) {
    set({ status: 'loading', error: null })
    try { const { user, redirectTo } = await AuthService.login(credentials); set({ user, status: 'authenticated' }); return redirectTo }
    catch (error) { set({ status: 'error', error: error.message }); throw error }
  },
  async signUp(payload) { set({ status: 'loading', error: null }); try { const result = await AuthService.signup(payload); set({ status: 'idle' }); return result } catch (error) { set({ status: 'error', error: error.message }); throw error } },
  // Demo access — offline persona for the mock-data build; never used by the
  // production SSO flow. Role/permissions are still fed through the same
  // permission checks as a real session.
  demoSignIn(persona) {
    localStorage.setItem(DEMO_MARKER, '1')
    set({ user: persona.user, status: 'authenticated', error: null })
    return getDefaultRoute(persona.user.role)
  },
  async restoreSession() {
    // The initial persisted state is deliberately "restoring".  Do not use
    // that status as a guard: doing so prevented the very first restore after
    // a page reload and left route guards on the loading screen forever.
    if (restoreInFlight) return restoreInFlight
    set({ status: 'restoring', error: null })
    restoreInFlight = (async () => {
      try {
        const user = await AuthService.restoreSession()
        if (user) { set({ user, status: 'authenticated' }); return user }
        // Demo build: keep the persisted persona session across reloads
        // instead of clearing it (see DEMO_MARKER).
        if (localStorage.getItem(DEMO_MARKER) && get().user) { set({ status: 'authenticated' }); return get().user }
        set({ user: null, status: 'idle' }); return null
      }
      catch { AuthService.logout(); localStorage.removeItem(DEMO_MARKER); set({ user: null, status: 'idle' }); return null }
      finally { restoreInFlight = null }
    })()
    return restoreInFlight
  },
  signOut() { AuthService.logout(); localStorage.removeItem(DEMO_MARKER); set({ user: null, status: 'idle', error: null }) },
  hasPermission(permission) { const user = get().user; return Boolean(user?.permissions?.includes(permission) || user?.permissions?.includes('ALL_READ') || user?.permissions?.includes('SYSADMIN')) },
  setDistrict(districtId) { set((s) => ({ user: s.user ? { ...s.user, districtId } : null })) },
  setDepartment(departmentId) { set((s) => ({ user: s.user ? { ...s.user, departmentId } : null })) },
}), { name: 'ndisp-auth-profile', partialize: (state) => ({ user: state.user }) }))
