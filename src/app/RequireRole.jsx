import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Route guard mirroring gateway-level RBAC check (LLD Vol 2 §14.4)
export default function RequireRole({ roles }) {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  if (status === 'restoring') return <div className="grid min-h-screen place-items-center text-sm text-ink-500">Restoring secure session…</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
