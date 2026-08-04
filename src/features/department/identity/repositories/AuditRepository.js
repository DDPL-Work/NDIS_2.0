import { useIdentityStore } from '../identityStore'

export const AuditRepository = {
  list: () => useIdentityStore.getState().auditLogs,
  log: (...args) => useIdentityStore.getState().log(...args),
}
