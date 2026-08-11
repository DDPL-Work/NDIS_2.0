// State Administration layout — dedicated shell for /state-admin/*.
// Reuses the existing design-system primitives (Topbar, Toaster, uiStore);
// DM/Department portals keep using AppShell and are not affected.
import { Outlet } from 'react-router-dom'
import Topbar from '../../../components/layout/Topbar'
import Toaster from '../../../components/ui/Toaster'
import StateAdminSidebar from './StateAdminSidebar'
import { STATE_BRAND } from '../../../config/stateNavigation'

export default function StateAdminLayout() {
  return (
    <div className="flex h-screen w-full bg-ink-50 overflow-hidden">
      <StateAdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          title={STATE_BRAND.label}
          subtitle={STATE_BRAND.subtitle}
          showDistrict
          showDepartment={false}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}