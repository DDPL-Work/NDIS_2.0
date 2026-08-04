import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Route guard mirroring the gateway-level RBAC check (LLD Vol 2 §14.4): coarse
// route-level enforcement here, same as the API Gateway's Auth/RBAC middleware
// (Vol 1 §8.5) — fine-grained checks belong server-side, this just keeps a
// signed-in Field Engineer from landing on the Admin shell, etc.
export default function RequireRole({ roles }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <Outlet />
}
