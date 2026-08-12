import { tokenManager } from './auth/tokenManager'

// The citizen deployment consumes the published Nalanda backend by default.
// A local or staging server can still override this through VITE_API_BASE_URL.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://nalanda.drdesigntech.com/api').replace(/\/$/, '')
function messageFor(status, body) { if (body?.detail) return body.detail; if (body?.message) return body.message; return ({ 400: 'Please check the submitted information.', 401: 'Your session has expired. Please sign in again.', 403: 'You do not have permission for this action.', 404: 'The requested resource was not found.', 422: 'The submitted information is invalid.', 500: 'The service is temporarily unavailable.' })[status] || 'The request could not be completed.' }
export class ApiError extends Error { constructor(status, body) { super(messageFor(status, body)); this.status = status; this.body = body } }

async function refreshAccessToken() {
  const { refresh } = tokenManager.get(); if (!refresh) throw new ApiError(401)
  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) })
  const body = await response.json().catch(() => ({})); if (!response.ok || !body.access) throw new ApiError(response.status, body)
  const old = tokenManager.get(); tokenManager.save({ access: body.access, refresh: body.refresh || refresh, user: old.user }); return body.access
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, authenticated = true, retry = true, timeout = 15000, raw = false } = {}) {
  let access = tokenManager.get().access
  if (authenticated && tokenManager.isExpired() && tokenManager.get().refresh) access = await refreshAccessToken()
  const controller = new AbortController(); const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    const response = await fetch(`${API_BASE_URL}${path}`, { method, signal: controller.signal, headers: { Accept: 'application/json', ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...(authenticated && access ? { Authorization: `Bearer ${access}` } : {}), ...headers }, ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}) })
    if (response.status === 401 && authenticated && retry && tokenManager.get().refresh) { try { await refreshAccessToken(); return apiRequest(path, { method, body, headers, authenticated, retry: false, timeout, raw }) } catch { tokenManager.clear(); window.dispatchEvent(new Event('ndisp-auth-expired')) } }
    if (raw) {
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new ApiError(response.status, data) }
      return response
    }
    const data = response.status === 204 ? null : await response.json().catch(() => ({})); if (!response.ok) throw new ApiError(response.status, data); return data
  } catch (error) { if (error.name === 'AbortError') throw new Error('The request timed out. Please try again.'); throw error } finally { window.clearTimeout(timer) }
}
