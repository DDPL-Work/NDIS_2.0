import { useMemo } from 'react'
import { Outlet } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import { getDepartmentNavigation } from './framework/DepartmentNavigation'
import { useDepartment } from './framework/DepartmentContext'
import { useAuthorization } from './identity/hooks/useAuthorization'

// The department layout is deliberately a thin adapter over the application's
// one shared shell. It does not create a second header, sidebar, or provider.
export default function DepartmentLayout() {
  const { dept } = useDepartment()
  const { can } = useAuthorization()
  const navItems = useMemo(() => getDepartmentNavigation(can), [can])

  return <AppShell
    navItems={navItems}
    portalLabel={dept.label}
    portalIcon={dept.icon || 'Building2'}
    accentClassName="bg-saffron-500"
    title="Department Workspace"
    subtitle={`${dept.label} · authenticated enterprise operations`}
    showDistrict
    showDepartment
  ><Outlet /></AppShell>
}
