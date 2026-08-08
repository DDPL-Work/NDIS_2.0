import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthService } from '../../services/auth/AuthService'

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
  async restoreSession() {
    // The initial persisted state is deliberately "restoring".  Do not use
    // that status as a guard: doing so prevented the very first restore after
    // a page reload and left route guards on the loading screen forever.
    if (restoreInFlight) return restoreInFlight
    set({ status: 'restoring', error: null })
    restoreInFlight = (async () => {
      try { const user = await AuthService.restoreSession(); set({ user, status: user ? 'authenticated' : 'idle' }); return user }
      catch { AuthService.logout(); set({ user: null, status: 'idle' }); return null }
      finally { restoreInFlight = null }
    })()
    return restoreInFlight
  },
  signOut() { AuthService.logout(); set({ user: null, status: 'idle', error: null }) },
  hasPermission(permission) { const user = get().user; return Boolean(user?.permissions?.includes(permission) || user?.permissions?.includes('ALL_READ') || user?.permissions?.includes('SYSADMIN')) },
  setDistrict(districtId) { set((s) => ({ user: s.user ? { ...s.user, districtId } : null })) },
  setDepartment(departmentId) { set((s) => ({ user: s.user ? { ...s.user, departmentId } : null })) },
}), { name: 'ndisp-auth-profile', partialize: (state) => ({ user: state.user }) }))
