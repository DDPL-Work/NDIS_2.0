import { createContext, useContext, useMemo, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocation } from 'react-router-dom'

const PORTAL_TYPES = {
  PUBLIC: 'public',
  CITIZEN: 'citizen',
  DM: 'dm',
  DEPARTMENT: 'department',
  STATE: 'state',
  NATIONAL: 'national',
}

const ROLE_TO_PORTAL = {
  CITIZEN: PORTAL_TYPES.CITIZEN,
  DISTRICT_COLLECTOR: PORTAL_TYPES.DM,
  DM: PORTAL_TYPES.DM,
  ADM: PORTAL_TYPES.DM,
  STATE_ADMIN: PORTAL_TYPES.STATE,
  SYSTEM_ADMIN: PORTAL_TYPES.NATIONAL,
  DEPT_HEAD: PORTAL_TYPES.DEPARTMENT,
  DEPT_OFFICER: PORTAL_TYPES.DEPARTMENT,
  SUPERVISOR: PORTAL_TYPES.DEPARTMENT,
  ENGINEER: PORTAL_TYPES.DEPARTMENT,
  FIELD_INSPECTOR: PORTAL_TYPES.DEPARTMENT,
}

const PUBLIC_ROUTES = ['/explore', '/']
const CITIZEN_ROUTES = ['/citizen']
const DM_ROUTES = ['/admin']
const DEPARTMENT_ROUTES = ['/linedept', '/department']
const STATE_ROUTES = ['/state-admin']

function resolvePortalFromRoute(pathname) {
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) return PORTAL_TYPES.PUBLIC
  if (CITIZEN_ROUTES.some((r) => pathname.startsWith(r))) return PORTAL_TYPES.CITIZEN
  if (DM_ROUTES.some((r) => pathname.startsWith(r))) return PORTAL_TYPES.DM
  if (DEPARTMENT_ROUTES.some((r) => pathname.startsWith(r))) return PORTAL_TYPES.DEPARTMENT
  if (STATE_ROUTES.some((r) => pathname.startsWith(r))) return PORTAL_TYPES.STATE
  return PORTAL_TYPES.PUBLIC
}

function resolvePortalContext(user, pathname, status) {
  const routePortal = resolvePortalFromRoute(pathname)

  if (status !== 'authenticated' || !user) {
    return {
      portal: PORTAL_TYPES.PUBLIC,
      authenticated: false,
      role: null,
      district: null,
      department: null,
      permissions: [],
      isPublic: true,
    }
  }

  const rolePortal = ROLE_TO_PORTAL[user.role] || PORTAL_TYPES.CITIZEN

  return {
    portal: routePortal === PORTAL_TYPES.PUBLIC ? PORTAL_TYPES.PUBLIC : rolePortal,
    authenticated: true,
    role: user.role,
    district: user.districtId || user.district || null,
    department: user.departmentId || user.department || null,
    permissions: user.permissions || [],
    isPublic: routePortal === PORTAL_TYPES.PUBLIC,
  }
}

const PortalContext = createContext({
  portal: PORTAL_TYPES.PUBLIC,
  authenticated: false,
  role: null,
  district: null,
  department: null,
  permissions: [],
  isPublic: true,
})

export function PortalProvider({ children }) {
  const { user, status } = useAuth()
  const location = useLocation()
  const [pathname, setPathname] = useState(location.pathname)

  useEffect(() => {
    setPathname(location.pathname)
  }, [location.pathname])

  const context = useMemo(() => resolvePortalContext(user, pathname, status), [user, pathname, status])

  return (
    <PortalContext.Provider value={context}>
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider')
  }
  return context
}

export { PORTAL_TYPES }