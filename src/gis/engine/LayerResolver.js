const PUBLIC_DEPARTMENTS = ['health', 'education', 'water', 'solar', 'tourism', 'pwd', 'urban', 'electricity']
export function resolveAccessibleLayers(user = {}, explicitDepartments = null) {
  if (explicitDepartments) return explicitDepartments
  const permissions = user?.permissions || []
  if (permissions.includes('ALL_READ') || permissions.includes('SYSADMIN') || permissions.includes('STATE_READ')) return null
  if (permissions.includes('CITIZEN_READ') || !user?.role) return PUBLIC_DEPARTMENTS
  return user.departmentId ? [user.departmentId] : PUBLIC_DEPARTMENTS
}
