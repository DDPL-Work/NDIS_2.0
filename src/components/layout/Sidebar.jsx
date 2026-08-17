import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { useUiStore } from '../../app/store/uiStore'
import { ChevronsLeft } from 'lucide-react'

// Desktop: fixed-width rail (collapsible via the store).
// Mobile (< lg): off-canvas overlay drawer controlled by `open`/`onClose`
// (hamburger in Topbar). Labels are always rendered and only hidden on
// desktop when the rail is collapsed, so the mobile drawer is never clipped.
function SidebarLink({ item, collapsed }) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      data-tour={item.tour}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
          collapsed && 'lg:justify-center lg:px-0',
          isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        )
      }
    >
      <Icon name={item.icon} size={16} />
      <span className={clsx('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar({ items = [], sections, portalLabel, portalIcon, accentClassName = 'bg-ink-900', open = false, onClose }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)

  // ESC closes the mobile drawer; lock body scroll while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  return (
    <>
      {open && <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden" />}
      <aside
        aria-label={portalLabel}
        className={clsx(
          'flex flex-col border-r border-ink-100 bg-white',
          'fixed inset-y-0 left-0 z-50 w-[min(88vw,300px)] transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:z-auto lg:translate-x-0 lg:w-auto lg:transition-[width]',
          collapsed ? 'lg:w-[68px]' : 'lg:w-[228px]'
        )}
      >
        <div className={clsx('flex items-center gap-2.5 px-4 h-14 border-b border-ink-100 shrink-0', collapsed && 'lg:justify-center lg:px-0')}>
          <div className={clsx('grid h-8 w-8 place-items-center rounded-lg text-white shrink-0', accentClassName)}>
            <Icon name={portalIcon} size={16} />
          </div>
          <span className={clsx('text-[13px] font-semibold text-ink-900 leading-tight', collapsed && 'lg:hidden')}>{portalLabel}</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sections
            ? sections.map((section) => (
                <div key={section.label} className="mb-1">
                  <p className={clsx('px-2.5 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400', collapsed && 'lg:hidden')}>{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => <SidebarLink key={item.to} item={item} collapsed={collapsed} />)}
                  </div>
                </div>
              ))
            : items.map((item) => <SidebarLink key={item.to} item={item} collapsed={collapsed} />)}
        </nav>

        <button
          onClick={toggle}
          className="hidden lg:flex items-center gap-2 px-4 h-11 border-t border-ink-100 text-ink-400 hover:text-ink-700 hover:bg-ink-50 shrink-0"
        >
          <ChevronsLeft size={15} className={clsx('transition-transform', collapsed && 'rotate-180')} />
          <span className={clsx('text-[12px] font-medium', collapsed && 'lg:hidden')}>Collapse</span>
        </button>
      </aside>
    </>
  )
}