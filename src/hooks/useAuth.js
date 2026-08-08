import { useAuthStore } from '../app/store/authStore'

// Single source of truth for the authenticated session.  Every workspace
// component consumes the same selector so the displayed department / role
// always come from the backend profile (GET /api/auth/me/) — never from a
// static configuration.
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const signIn = useAuthStore((s) => s.signIn)
  const signOut = useAuthStore((s) => s.signOut)
  const signUp = useAuthStore((s) => s.signUp)
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const setDistrict = useAuthStore((s) => s.setDistrict)
  const setDepartment = useAuthStore((s) => s.setDepartment)

  return {
    user,
    status,
    error,
    signIn,
    signOut,
    signUp,
    restoreSession,
    setDistrict,
    setDepartment,
    // Convenience accessors used by every department workspace header.
    departmentName: user?.departmentName || '',
    roleName: user?.roleName || '',
  }
}