import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { getDepartmentNavigation } from './framework/DepartmentNavigation'
import { useDepartment } from './framework/DepartmentContext'
import { useAuthorization } from './identity/hooks/useAuthorization'

// The department layout is deliberately a thin adapter over the application's
// one shared shell. It does not create a second header, sidebar, or provider.
export default function DepartmentLayout() {
  const { dept, deptName } = useDepartment()
  const { can } = useAuthorization()
  const navItems = useMemo(() => getDepartmentNavigation(can), [can])
  const departmentLabel = deptName || dept?.label || 'Department'

  return <AppShell
    navItems={navItems}
    portalLabel={departmentLabel}
    portalIcon={dept.icon || 'Building2'}
    accentClassName="bg-saffron-500"
    title="Department Workspace"
    subtitle={`${departmentLabel} · location-based service delivery`}
    showDistrict
    showDepartment
  ><Outlet /></AppShell>
}
