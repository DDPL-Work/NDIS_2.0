import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { useUiStore } from '../../app/store/uiStore'
import { ChevronsLeft } from 'lucide-react'

export default function Sidebar({ items, portalLabel, portalIcon, accentClassName = 'bg-ink-900' }) {
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
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
        ))}
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
