import { ROLE_PORTAL } from '../config/constants'
/** The single role-to-entry-route authority used after login and session restore. */
export function getDefaultRoute(role) { return `/${ROLE_PORTAL[role] || 'citizen'}` }
