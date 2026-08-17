import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { useUiStore } from '../../app/store/uiStore'
import { ChevronsLeft } from 'lucide-react'

// `items` may be a flat list of nav items, or `sections` may be supplied as
// [{ label, items: [...] }] to render grouped items with section headers.
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
          collapsed && 'justify-center px-0',
          isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        )
      }
    >
      <Icon name={item.icon} size={16} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ items = [], sections, portalLabel, portalIcon, accentClassName = 'bg-ink-900' }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={clsx(
        'shrink-0 border-r border-ink-100 bg-white flex flex-col transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[228px]'
      )}
    >
      <div className={clsx('flex items-center gap-2.5 px-4 h-14 border-b border-ink-100 shrink-0', collapsed && 'justify-center px-0')}>
        <div className={clsx('grid h-8 w-8 place-items-center rounded-lg text-white shrink-0', accentClassName)}>
          <Icon name={portalIcon} size={16} />
        </div>
        {!collapsed && <span className="text-[13px] font-semibold text-ink-900 leading-tight">{portalLabel}</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {sections
          ? sections.map((section) => (
              <div key={section.label} className="mb-1">
                {!collapsed && (
                  <p className="px-2.5 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400">{section.label}</p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => <SidebarLink key={item.to} item={item} collapsed={collapsed} />)}
                </div>
              </div>
            ))
          : items.map((item) => <SidebarLink key={item.to} item={item} collapsed={collapsed} />)}
      </nav>

      <button
        onClick={toggle}
        className="flex items-center gap-2 px-4 h-11 border-t border-ink-100 text-ink-400 hover:text-ink-700 hover:bg-ink-50 shrink-0"
      >
        <ChevronsLeft size={15} className={clsx('transition-transform', collapsed && 'rotate-180')} />
        {!collapsed && <span className="text-[12px] font-medium">Collapse</span>}
      </button>
    </aside>
  )
}
