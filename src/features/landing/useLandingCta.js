import { useAuthStore } from '../../app/store/authStore'

// Portal routes are session-gated (RequireRole redirects anonymous visitors
// home), so a signed-out visitor is served an in-page anchor or the public
// login page instead of a dead-end bounce. Signed-in users always get the
// real route. Only the landing page uses this mapping.
const ANONYMOUS_TARGET = {
  '/citizen/register': '/login',
  '/citizen/track': '/login',
  '/citizen/map': '#explore',
  '/citizen/facilities': '#explore',
  '/citizen/schemes': '#schemes',
  '/citizen/notifications': '#services',
}

export function useLandingCta() {
  const user = useAuthStore((s) => s.user)
  return function cta(to) {
    if (user) return { to }
    const fallback = ANONYMOUS_TARGET[to]
    if (!fallback) return { to }
    return fallback.startsWith('#') ? { href: fallback } : { to: fallback }
  }
}
