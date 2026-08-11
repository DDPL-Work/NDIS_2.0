// State Admin authorization helpers — same convention as the department
// framework (module.action permission strings). Stricter than the DM portal:
// ALL_READ unlocks only .view permissions; writes require an explicit
// permission or ALL_WRITE / SYSADMIN.
import { useAuthStore } from '../../../app/store/authStore'
import { STATE_ROLE_PERMISSIONS } from '../../../config/stateConstants'
import { useMemo } from 'react'

export function useStatePermission(permission) {
  const user = useAuthStore((s) => s.user)
  return useMemo(() => {
    if (!user) return false
    if (!permission) return true
    const perms = user?.permissions?.length
      ? user.permissions
      : STATE_ROLE_PERMISSIONS[user?.role] || []
    const isView = permission.endsWith('.view')
    const grants = isView ? ['SYSADMIN', 'ALL_READ', 'ALL_WRITE'] : ['SYSADMIN', 'ALL_WRITE']
    return perms.includes(permission) || grants.some((g) => perms.includes(g))
  }, [permission, user])
}

// Actor object passed into store mutations (audit + authority checks).
export function useStateActor() {
  const user = useAuthStore((s) => s.user)
  return useMemo(() => ({
    name: user?.name || user?.roleName || user?.role || 'State Admin',
    role: user?.role || 'state_admin',
    id: user?.id,
    departmentId: user?.departmentId || null,
  }), [user])
}