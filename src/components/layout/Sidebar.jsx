import { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { useUiStore } from '../../app/store/uiStore'
import { ChevronDown, ChevronsLeft } from 'lucide-react'

function NavItem({ item, collapsed, dark }) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
          collapsed && 'justify-center px-0',
          dark
            ? isActive
              ? 'bg-royal-600/80 text-white shadow-[inset_0_0_0_1px_rgba(141,184,250,0.25),0_2px_12px_-4px_rgba(47,110,240,0.6)]'
              : 'text-royal-200 hover:bg-royal-900 hover:text-royal-50'
            : isActive
              ? 'bg-ink-900 text-white'
              : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        )
      }
    >
      <Icon name={item.icon} size={16} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}

function NavGroup({ title, items, collapsed, dark }) {
  const [open, setOpen] = useState(true)

  if (collapsed) {
    // In icon-only mode a group has no room for a header — flatten its items.
    return (
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.to} item={item} collapsed dark={dark} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={clsx(
          'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors',
          dark ? 'text-royal-400 hover:text-royal-200' : 'text-ink-400 hover:text-ink-600'
        )}
      >
        <span>{title}</span>
        <ChevronDown
          size={13}
          className={clsx('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-1.5">
          {items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={false} dark={dark} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ items, portalLabel, portalIcon, accentClassName = 'bg-ink-900', theme = 'light' }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)
  const dark = theme === 'royal'

  const { flat, groups } = useMemo(() => {
    const flat = []
    const groups = []
    for (const item of items) {
      if (item.group) {
        const existing = groups.find((g) => g.title === item.group)
        if (existing) existing.items.push(item)
        else groups.push({ title: item.group, items: [item] })
      } else {
        flat.push(item)
      }
    }
    return { flat, groups }
  }, [items])

  return (
    <aside
      className={clsx(
        'shrink-0 border-r flex flex-col transition-all duration-200',
        dark ? 'border-royal-800/70 bg-royal-950' : 'border-ink-100 bg-white',
        collapsed ? 'w-[68px]' : 'w-[228px]'
      )}
    >
      <div className={clsx('flex items-center gap-2.5 px-4 h-14 border-b shrink-0', collapsed && 'justify-center px-0', dark ? 'border-royal-800/70' : 'border-ink-100')}>
        <div className={clsx('grid h-8 w-8 place-items-center rounded-lg text-white shrink-0', accentClassName)}>
          <Icon name={portalIcon} size={16} />
        </div>
        {!collapsed && (
          <span className={clsx('text-[13px] font-semibold leading-tight', dark ? 'text-royal-100' : 'text-ink-900')}>
            {portalLabel}
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {flat.map((item) => (
          <NavItem key={item.to} item={item} collapsed={collapsed} dark={dark} />
        ))}

        {groups.map((group) => (
          <div key={group.title} className={clsx('pt-1', !collapsed && 'mt-1')}>
            <NavGroup title={group.title} items={group.items} collapsed={collapsed} dark={dark} />
          </div>
        ))}
      </nav>

      <button
        onClick={toggle}
        className={clsx(
          'flex items-center gap-2 px-4 h-11 border-t transition-colors shrink-0',
          dark ? 'border-royal-800/70 text-royal-300 hover:bg-royal-900 hover:text-royal-50' : 'border-ink-100 text-ink-400 hover:bg-ink-50 hover:text-ink-700'
        )}
      >
        <ChevronsLeft size={15} className={clsx('transition-transform', collapsed && 'rotate-180')} />
        {!collapsed && <span className="text-[12px] font-medium">Collapse</span>}
      </button>
    </aside>
  )
}