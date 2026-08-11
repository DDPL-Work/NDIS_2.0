// Dedicated State Administration sidebar.
// Grouped navigation with collapsible parent sections, active-route
// highlighting (NavLink prefix matching), tooltips in collapsed mode and
// persisted expanded-state. Keyboard accessible (native buttons/links).
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronDown, ChevronsLeft } from 'lucide-react'
import Icon from '../../../components/ui/Icon'
import { useUiStore } from '../../../app/store/uiStore'
import { STATE_NAV, STATE_BRAND } from '../../../config/stateNavigation'

const EXPANDED_STORAGE_KEY = 'ndisp:stateadmin:expanded'

function loadExpanded() {
  try {
    const value = JSON.parse(localStorage.getItem(EXPANDED_STORAGE_KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function matchActive(to, pathname) {
  if (to === '/state-admin') return pathname === '/state-admin'
  const prefix = to.endsWith('/') ? to : `${to}/`
  return pathname === to || pathname.startsWith(prefix)
}

function SidebarLink({ item, collapsed }) {
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      tabIndex={0}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-saffron-500',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        )
      }
    >
      <Icon name={item.icon} size={16} className="shrink-0" />
      {!collapsed && (
        <span className="truncate">
          {item.label}
          {item.planned && <span className="ml-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-saffron-500">Phase {item.planned}</span>}
        </span>
      )}
    </NavLink>
  )
}

function SectionTitle({ section, open, collapsed, onToggle }) {
  if (collapsed) {
    return (
      <div className="pt-3 pb-1" aria-hidden="true">
        <Icon name={section.icon} size={14} className="mx-auto text-ink-300" />
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400 hover:text-ink-700 focus-visible:outline-2 focus-visible:outline-saffron-500"
    >
      <span className="flex items-center gap-2">
        <Icon name={section.icon} size={13} className="shrink-0" />
        {section.label}
      </span>
      <ChevronDown size={13} className={clsx('shrink-0 transition-transform', open && 'rotate-180')} />
    </button>
  )
}

export default function StateAdminSidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { pathname } = useLocation()
  const [expanded, setExpanded] = useState(loadExpanded)

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expanded))
    } catch {
      /* storage unavailable — persistence is best-effort */
    }
  }, [expanded])

  // Auto-expand the section containing the active route on navigation.
  useEffect(() => {
    const activeSection = STATE_NAV.sections.find((section) =>
      section.items.some((item) => matchActive(item.to, pathname))
    )
    if (activeSection && !expanded.includes(activeSection.label)) {
      setExpanded((current) => [...current, activeSection.label])
    }
  }, [pathname, expanded])

  const toggleSection = (label) =>
    setExpanded((current) =>
      current.includes(label) ? current.filter((l) => l !== label) : [...current, label]
    )

  const isOpen = (section) => expanded.includes(section.label)

  return (
    <aside
      className={clsx(
        'shrink-0 border-r border-ink-100 bg-white flex flex-col transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[248px]'
      )}
    >
      <div className={clsx('flex items-center gap-2.5 px-4 h-14 border-b border-ink-100 shrink-0', collapsed && 'justify-center px-0')}>
        <div className={clsx('grid h-8 w-8 place-items-center rounded-lg text-white shrink-0', STATE_BRAND.accentClassName)}>
          <Icon name={STATE_BRAND.portalIcon} size={16} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-ink-900 leading-tight truncate">{STATE_BRAND.label}</p>
            <p className="text-[10px] text-ink-400 leading-tight truncate">{STATE_BRAND.subtitle}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="State Administration navigation">
        {STATE_NAV.sections.map((section) => (
          <div key={section.label} className="mb-0.5">
            <SectionTitle
              section={section}
              open={isOpen(section)}
              collapsed={collapsed}
              onToggle={() => toggleSection(section.label)}
            />
            {!collapsed && isOpen(section) && (
              <div className="space-y-0.5 pb-1" role="group" aria-label={section.label}>
                {section.items.map((item) => (
                  <SidebarLink key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            )}
            {collapsed && (
              <div className="space-y-0.5 pb-1">
                {section.items.map((item) => (
                  <SidebarLink key={item.to} item={item} collapsed={collapsed} />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggleSidebar}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="flex items-center gap-2 px-4 h-11 border-t border-ink-100 text-ink-400 hover:text-ink-700 hover:bg-ink-50 shrink-0 focus-visible:outline-2 focus-visible:outline-saffron-500"
      >
        <ChevronsLeft size={15} className={clsx('transition-transform', collapsed && 'rotate-180')} />
        {!collapsed && <span className="text-[12px] font-medium">Collapse</span>}
      </button>
    </aside>
  )
}