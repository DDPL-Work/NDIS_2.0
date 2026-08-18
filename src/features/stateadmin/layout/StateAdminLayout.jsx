// State Administration layout — dedicated shell for /state-admin/*.
// Reuses the existing design-system primitives (Topbar, Toaster, uiStore);
// DM/Department portals keep using AppShell and are not affected.
import { useEffect } from 'react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Topbar from '../../../components/layout/Topbar'
import Toaster from '../../../components/ui/Toaster'
import StateAdminSidebar from './StateAdminSidebar'
import { STATE_BRAND } from '../../../config/stateNavigation'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { useStateProjectStore } from '../store/stateProjectStore'
import { useStateGisStore } from '../store/stateGisStore'

export default function StateAdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Hydrate every state-admin store from the live backend once per shell mount.
  useEffect(() => {
    useStateFinanceStore.getState().hydrateFromBackend()
    useStateMasterStore.getState().hydrateFromBackend()
    useStateProjectStore.getState().hydrateFromBackend()
    useStateGisStore.getState().hydrateFromBackend()
  }, [])

  return (
    <div className="flex h-screen w-full bg-ink-50 overflow-hidden" style={{ height: '100dvh' }}>
      <StateAdminSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar
          title={STATE_BRAND.label}
          subtitle={STATE_BRAND.subtitle}
          showDistrict
          showDepartment={false}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}