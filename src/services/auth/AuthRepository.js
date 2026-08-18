import { apiRequest } from '../httpClient'
import { tokenManager } from './tokenManager'
export const AuthRepository = {
  async login(credentials) { const response = await apiRequest('/auth/login/', { method: 'POST', body: credentials, authenticated: false }); const tokens = response.tokens || response; if (!tokens.access || !tokens.refresh) throw new Error('The login response did not include valid session tokens.'); tokenManager.save({ access: tokens.access, refresh: tokens.refresh, user: null }); return response },
  async signup(payload) { const response = await apiRequest('/auth/signup/', { method: 'POST', body: payload, authenticated: false }); const tokens = response.tokens; if (tokens?.access && tokens?.refresh) tokenManager.save({ access: tokens.access, refresh: tokens.refresh, user: null }); return response },
  async getCurrentUser() { return apiRequest('/auth/me/') },
  // GET /api/auth/roles/ — public catalog of the platform's roles.
  async listRoles() { return apiRequest('/auth/roles/', { authenticated: false }) },
  async refreshToken() { const current = tokenManager.get(); const tokens = await apiRequest('/auth/token/refresh/', { method: 'POST', body: { refresh: current.refresh }, authenticated: false }); tokenManager.save({ access: tokens.access, refresh: tokens.refresh || current.refresh, user: current.user }); return tokens },
  logout() { tokenManager.clear() },
}
