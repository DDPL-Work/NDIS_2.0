import { useIdentityStore } from '../identityStore'

export const PerformanceRepository = {
  leaderboard: (employees) => employees.map((employee) => {
    const tasks = useIdentityStore.getState().tasks.filter((task) => task.assigneeId === employee.id)
    const done = tasks.filter((task) => ['completed', 'verified', 'closed'].includes(task.status)).length
    const attendance = useIdentityStore.getState().attendance.filter((item) => item.employeeId === employee.id && item.type === 'clock_in').length
    return { ...employee, completedTasks: done, attendanceDays: attendance, efficiency: Math.min(100, 55 + done * 8 + attendance * 2) }
  }).sort((a, b) => b.efficiency - a.efficiency),
}
