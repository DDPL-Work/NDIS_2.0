import { useIdentityStore } from '../identityStore'

export const DepartmentEmployeeRepository = {
  list: (departmentId) => useIdentityStore.getState().employees.filter((employee) => employee.departmentId === departmentId),
  find: (employeeId) => useIdentityStore.getState().employees.find((employee) => employee.id === employeeId),
  reportingTree: (departmentId) => {
    const employees = DepartmentEmployeeRepository.list(departmentId)
    return employees.map((employee) => ({ ...employee, subordinates: employees.filter((item) => item.managerId === employee.id) }))
  },
  onboarding: (actor, payload) => useIdentityStore.getState().onboardEmployee(actor, payload),
  update: (actor, employeeId, updates) => useIdentityStore.getState().updateEmployee(actor, employeeId, updates),
}
