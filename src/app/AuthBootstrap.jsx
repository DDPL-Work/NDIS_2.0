import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
export default function AuthBootstrap({ children }) {
  const restoreSession = useAuthStore((s) => s.restoreSession); const signOut = useAuthStore((s) => s.signOut)
  useEffect(() => { restoreSession(); const onExpired = () => signOut(); window.addEventListener('ndisp-auth-expired', onExpired); return () => window.removeEventListener('ndisp-auth-expired', onExpired) }, [restoreSession, signOut])
  return children
}
