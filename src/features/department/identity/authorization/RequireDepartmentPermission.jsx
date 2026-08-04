import { Navigate, Outlet } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useCurrentUser, useCan } from '../hooks/useAuthorization'

export default function RequireDepartmentPermission({ permission }) {
  const user = useCurrentUser()
  const allowed = useCan(permission)
  if (!user) return <Navigate to="/" replace />
  if (allowed) return <Outlet />
  return <div className="m-6 rounded-xl border border-alert-200 bg-alert-50 p-8 text-center"><ShieldAlert className="mx-auto text-alert-600" size={28} /><h1 className="mt-3 text-lg font-semibold text-ink-950">403 · Access denied</h1><p className="mt-1 text-sm text-ink-600">Your current department role does not grant {permission}.</p></div>
}
