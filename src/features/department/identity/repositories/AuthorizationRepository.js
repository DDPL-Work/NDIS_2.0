import { useIdentityStore } from '../identityStore'

export const AuthorizationRepository = {
  temporaryGrants: (employeeId) => useIdentityStore.getState().temporaryPermissions.filter((item) => item.employeeId === employeeId),
  grant: (actor, payload) => useIdentityStore.getState().grantTemporaryPermission(actor, payload),
}
