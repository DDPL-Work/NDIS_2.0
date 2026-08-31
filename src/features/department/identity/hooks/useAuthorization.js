import { useMemo } from 'react'
import { useAuthStore } from '../../../../app/store/authStore'
import { useIdentityStore } from '../identityStore'
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions/permissionCatalog'

// Central permission resolver - uses authStore as the single source of truth for current user
function resolvePermissions(user, roles, temporaryPermissions) {
  if (!user) return new Set()
  
  // System roles get all permissions
  const systemRoles = ['system_admin', 'district_collector', 'state_super_admin', 'state_admin']
  if (systemRoles.includes(user.role)) {
    return new Set(['ALL_READ', 'ALL_WRITE', 'SYSADMIN'])
  }
  
  // Backend-supplied permissions take priority
  const backendPermissions = new Set(user.permissions || [])
  
  // Fallback to frontend role permissions if backend didn't supply any
  const rolePermissions = backendPermissions.size > 0 
    ? new Set() 
    : new Set(DEFAULT_ROLE_PERMISSIONS[user.role] || [])
  
  // Temporary permissions from identity store
  const expiry = new Date()
  const temporary = temporaryPermissions
    .filter((item) => item.employeeId === user?.id && new Date(item.expiresAt) > expiry)
    .flatMap((item) => item.permissions || [])
  
  const combined = new Set([...backendPermissions, ...rolePermissions, ...temporary])
  
  // Always include ALL_READ/ALL_WRITE if present
  if (combined.has('ALL_READ') || combined.has('ALL_WRITE') || combined.has('SYSADMIN')) {
    combined.add('ALL_READ')
    combined.add('ALL_WRITE')
    combined.add('SYSADMIN')
  }
  
  return combined
}

export function useCurrentUser() { return useAuthStore((state) => state.user) }
export function useDepartmentUser(employeeId) { return useIdentityStore((state) => state.employees.find((employee) => employee.id === employeeId)) }
export function useRole(roleId) { return useIdentityStore((state) => state.roles.find((role) => role.id === roleId)) }

export function useAuthorization() {
  const user = useCurrentUser()
  const roles = useIdentityStore((state) => state.roles)
  const temporaryPermissions = useIdentityStore((state) => state.temporaryPermissions)
  
  return useMemo(() => {
    const permissions = resolvePermissions(user, roles, temporaryPermissions)
    const can = (permission) => Boolean(user && permissions.has(permission))
    
    // DEV: Trace authorization for assets.view
    if (import.meta.env.DEV) {
      console.group('[AUTH DEBUG] useAuthorization')
      console.log({
        backendRoleCode: user?.backendRoleCode,
        authRole: user?.role,
        authPermissions: user?.permissions,
        identityRoleIds: roles.map(r => r.id),
        fallbackPermissions: DEFAULT_ROLE_PERMISSIONS[user?.role]?.length || 0,
        fallbackHasAssetsView: DEFAULT_ROLE_PERMISSIONS[user?.role]?.includes('assets.view'),
        temporaryPermissionsCount: temporaryPermissions.filter(p => p.employeeId === user?.id).flatMap(p => p.permissions || []).length,
        finalPermissionsCount: permissions.size,
        finalHasAssetsView: permissions.has('assets.view'),
        canAssetsView: can('assets.view'),
        authStatus: useAuthStore.getState().status
      })
      console.groupEnd()
    }
    
    return { user, permissions, can }
  }, [user, roles, temporaryPermissions])
}

export function useCan(permission) { return useAuthorization().can(permission) }
export function usePermission(permission) { return useCan(permission) }
