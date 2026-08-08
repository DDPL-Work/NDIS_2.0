const KEY = 'ndisp-auth-session'
function decode(token) { try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) } catch { return null } }
export const tokenManager = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } },
  save({ access, refresh, user }) { const payload = decode(access); localStorage.setItem(KEY, JSON.stringify({ access, refresh, user, expiresAt: payload?.exp ? payload.exp * 1000 : null })) },
  setUser(user) { const session = this.get(); localStorage.setItem(KEY, JSON.stringify({ ...session, user })) },
  clear() { localStorage.removeItem(KEY) },
  isExpired(skewMs = 30000) { const { access, expiresAt } = this.get(); return !access || (expiresAt != null && Date.now() + skewMs >= expiresAt) },
}
