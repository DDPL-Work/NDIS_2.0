import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Toaster from '../ui/Toaster'

export default function AppShell({ navItems, sections, portalLabel, portalIcon, accentClassName, title, subtitle, showDistrict, showDepartment, bottomNav }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-ink-50 overflow-hidden" style={{ height: '100dvh' }}>
      <Sidebar
        items={navItems}
        sections={sections}
        portalLabel={portalLabel}
        portalIcon={portalIcon}
        accentClassName={accentClassName}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} showDistrict={showDistrict} showDepartment={showDepartment} onMenuClick={() => setMobileNavOpen(true)} />
        <main className={bottomNav ? 'flex-1 overflow-y-auto pb-[calc(var(--citizen-bottom-nav-height,64px)+var(--safe-bottom,0px))] lg:pb-0' : 'flex-1 overflow-y-auto'}>
          <Outlet />
        </main>
      </div>
      {typeof bottomNav === 'function' ? bottomNav({ onOpenNav: () => setMobileNavOpen(true) }) : bottomNav}
      <Toaster />
    </div>
  )
}