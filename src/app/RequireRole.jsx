import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Route guard mirroring gateway-level RBAC check (LLD Vol 2 §14.4)
// - restoring: show loading
// - unauthenticated: redirect to login
// - authenticated but wrong role: show 403 (NOT redirect to login)
// - authenticated and correct role: render outlet
export default function RequireRole({ roles }) {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  if (status === 'restoring') return <div className="grid min-h-screen place-items-center text-sm text-ink-500">Restoring secure session…</div>
  if (!user || status === 'idle' || status === 'error') return <Navigate to="/login" replace />
  if (status === 'unauthorized') return <div className="m-6 rounded-xl border border-alert-200 bg-alert-50 p-8 text-center"><h1 className="text-lg font-semibold text-ink-950">403 · Access denied</h1><p className="mt-1 text-sm text-ink-600">Your session is authenticated but not authorized for this area.</p></div>
  if (roles && !roles.includes(user.role)) {
    // Authenticated but forbidden - show 403, don't redirect to login
    return <div className="m-6 rounded-xl border border-alert-200 bg-alert-50 p-8 text-center"><h1 className="text-lg font-semibold text-ink-950">403 · Access denied</h1><p className="mt-1 text-sm text-ink-600">Your role ({user.roleName || user.role}) does not grant access to this area.</p></div>
  }
  return <Outlet />
}
