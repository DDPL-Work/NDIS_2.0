import { useIdentityStore } from '../identityStore'

export const AttendanceRepository = {
  list: (departmentId, employeeIds = []) => useIdentityStore.getState().attendance.filter((item) => !employeeIds.length || employeeIds.includes(item.employeeId)),
  clock: (actor, employeeId, type, gps) => useIdentityStore.getState().clock(actor, employeeId, type, gps),
}
