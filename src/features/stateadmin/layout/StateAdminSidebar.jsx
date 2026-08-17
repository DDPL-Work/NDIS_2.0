// Dedicated State Administration sidebar.
// Grouped navigation with collapsible parent sections, active-route
// highlighting (NavLink prefix matching), tooltips in collapsed mode and
// persisted expanded-state. Keyboard accessible (native buttons/links).
//
// Desktop (≥ lg): fixed-width rail, collapsible via the store.
// Mobile (< lg): off-canvas overlay drawer (hamburger in Topbar). In the
// drawer the nav always renders fully expanded, regardless of the desktop
// collapse state, so the deep section tree stays usable on phones.
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronDown, ChevronsLeft } from 'lucide-react'
import Icon from '../../../components/ui/Icon'
import { useUiStore } from '../../../app/store/uiStore'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
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
          collapsed && 'lg:justify-center lg:px-0',
          isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
        )
      }
    >
      <Icon name={item.icon} size={16} className="shrink-0" />
      <span className={clsx('truncate', collapsed && 'lg:hidden')}>
        {item.label}
        {item.planned && <span className="ml-1.5 text-[9.5px] font-semibold uppercase tracking-wide text-saffron-500">Phase {item.planned}</span>}
      </span>
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

export default function StateAdminSidebar({ open = false, onClose }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { pathname } = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [expanded, setExpanded] = useState(loadExpanded)

  // Below lg the drawer is always fully expanded; the desktop rail collapse
  // state only applies at lg and up.
  const showExpanded = isDesktop ? !collapsed : true

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

  const toggleSection = (label) =>
    setExpanded((current) =>
      current.includes(label) ? current.filter((l) => l !== label) : [...current, label]
    )

  const isOpen = (section) => expanded.includes(section.label)

  return (
    <>
      {open && <div onClick={onClose} aria-hidden="true" className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden" />}
      <aside
        aria-label="State Administration navigation"
        className={clsx(
          'flex flex-col border-r border-ink-100 bg-white',
          'fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:z-auto lg:translate-x-0 lg:w-auto lg:transition-[width]',
          showExpanded ? 'lg:w-[248px]' : 'lg:w-[68px]'
        )}
      >
        <div className={clsx('flex items-center gap-2.5 px-4 h-14 border-b border-ink-100 shrink-0', !showExpanded && 'lg:justify-center lg:px-0')}>
          <div className={clsx('grid h-8 w-8 place-items-center rounded-lg text-white shrink-0', STATE_BRAND.accentClassName)}>
            <Icon name={STATE_BRAND.portalIcon} size={16} />
          </div>
          {showExpanded && (
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
                collapsed={!showExpanded}
                onToggle={() => toggleSection(section.label)}
              />
              {showExpanded && isOpen(section) && (
                <div className="space-y-0.5 pb-1" role="group" aria-label={section.label}>
                  {section.items.map((item) => (
                    <SidebarLink key={item.to} item={item} collapsed={false} />
                  ))}
                </div>
              )}
              {!showExpanded && (
                <div className="space-y-0.5 pb-1">
                  {section.items.map((item) => (
                    <SidebarLink key={item.to} item={item} collapsed={true} />
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
          className="hidden lg:flex items-center gap-2 px-4 h-11 border-t border-ink-100 text-ink-400 hover:text-ink-700 hover:bg-ink-50 shrink-0 focus-visible:outline-2 focus-visible:outline-saffron-500"
        >
          <ChevronsLeft size={15} className={clsx('transition-transform', collapsed && 'rotate-180')} />
          <span className={clsx('text-[12px] font-medium', collapsed && 'lg:hidden')}>Collapse</span>
        </button>
      </aside>
    </>
  )
}