import { useMemo } from 'react'
import { useAuthStore } from '../../../../app/store/authStore'
import { useIdentityStore } from '../identityStore'
import { DEFAULT_ROLE_PERMISSIONS } from '../permissions/permissionCatalog'

export function useCurrentUser() { return useAuthStore((state) => state.user) }
export function useDepartmentUser(employeeId) { return useIdentityStore((state) => state.employees.find((employee) => employee.id === employeeId)) }
export function useRole(roleId) { return useIdentityStore((state) => state.roles.find((role) => role.id === roleId)) }
export function useAuthorization() {
  const user = useCurrentUser(); const roles = useIdentityStore((state) => state.roles); const temporaryPermissions = useIdentityStore((state) => state.temporaryPermissions)
  return useMemo(() => {
    const role = roles.find((item) => item.id === user?.role)
    const expiry = new Date()
    const temporary = temporaryPermissions.filter((item) => item.employeeId === user?.id && new Date(item.expiresAt) > expiry).flatMap((item) => item.permissions || [])
    const permissions = new Set([...(role?.permissions || DEFAULT_ROLE_PERMISSIONS[user?.role] || []), ...(user?.permissions || []), ...temporary])
    const can = (permission) => Boolean(user && (user.role === 'system_admin' || user.role === 'district_collector' || permissions.has(permission) || permissions.has('ALL_READ') || permissions.has('ALL_WRITE')))
    return { user, permissions, can }
  }, [user, roles, temporaryPermissions])
}
export function useCan(permission) { return useAuthorization().can(permission) }
export function usePermission(permission) { return useCan(permission) }
