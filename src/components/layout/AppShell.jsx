import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Toaster from '../ui/Toaster'

export default function AppShell({ navItems, portalLabel, portalIcon, accentClassName, title, subtitle, showDistrict, showDepartment }) {
  return (
    <div className="flex h-screen w-full bg-ink-50 overflow-hidden">
      <Sidebar items={navItems} portalLabel={portalLabel} portalIcon={portalIcon} accentClassName={accentClassName} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} showDistrict={showDistrict} showDepartment={showDepartment} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
