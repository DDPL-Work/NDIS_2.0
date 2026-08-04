import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Route guard mirroring gateway-level RBAC check (LLD Vol 2 §14.4)
export default function RequireRole({ roles }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
