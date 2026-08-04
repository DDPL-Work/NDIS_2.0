import { useIdentityStore } from '../identityStore'

export const LeaveRepository = {
  list: (employeeIds = []) => useIdentityStore.getState().leaves.filter((item) => !employeeIds.length || employeeIds.includes(item.employeeId)),
  apply: (actor, payload) => useIdentityStore.getState().applyLeave(actor, payload),
  decide: (actor, leaveId, decision) => useIdentityStore.getState().decideLeave(actor, leaveId, decision),
}
