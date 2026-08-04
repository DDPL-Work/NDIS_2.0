import { useIdentityStore } from '../identityStore'

export const RoleRepository = {
  list: () => useIdentityStore.getState().roles,
  create: (actor, payload) => useIdentityStore.getState().createRole(actor, payload),
  setPermissions: (actor, roleId, permissions) => useIdentityStore.getState().updateRolePermissions(actor, roleId, permissions),
}
