import { useState, useRef, useEffect, useMemo } from 'react'
import { Menu, Bell, LogOut, ChevronDown, Globe, HelpCircle, MapPin, Search } from 'lucide-react'
import Select from '../ui/Select'
import Badge from '../ui/Badge'
import NotificationDrawer from '../ui/NotificationDrawer'
import CommandPalette from '../ui/CommandPalette'
import { useAuthStore } from '../../app/store/authStore'
import { useI18n } from '../../i18n/i18n'
import { useAsync } from '../../hooks/useAsync'
import { notificationApi } from '../../services/api'
import { DISTRICTS, DEPARTMENTS, ROLE_LABELS, ROLES } from '../../config/constants'
import { useNavigate } from 'react-router-dom'
import { useTourStore } from '../tour/tourStore'
import { markReadLocal } from '../../utils/notificationRead'

function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutsideClick(ref, () => setOpen(false))
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-ink-100">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-saffron-500 text-white text-[11.5px] font-semibold">
          {user?.name?.[0] || 'U'}
        </div>
        <span className="text-[12.5px] font-medium text-ink-800 max-w-[120px] truncate hidden sm:block">{user?.name}</span>
        <ChevronDown size={13} className="text-ink-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 max-h-[80vh] overflow-y-auto card p-1.5 z-30 animate-fade-in">
          <div className="px-2.5 py-2">
            <p className="text-[13px] font-semibold text-ink-900">{user?.name}</p>
            <p className="text-[11.5px] text-ink-500">{user?.designation || ROLE_LABELS[user?.role]}</p>
            {user?.department?.label && <p className="text-[10.5px] text-ink-400">{user.department.label}</p>}
          </div>
          <div className="h-px bg-ink-100 my-1" />
          <button
            onClick={() => {
              signOut()
              navigate('/')
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-alert-600 hover:bg-alert-50"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Topbar({ title, subtitle, showDistrict = true, showDepartment = false, onMenuClick }) {
  const user = useAuthStore((s) => s.user)
  const setDistrict = useAuthStore((s) => s.setDistrict)
  const setDepartment = useAuthStore((s) => s.setDepartment)
  const { locale, setLocale } = useI18n()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  const { data: notifications } = useAsync(() => notificationApi.listNotifications(), [])
  const [localNotifs, setLocalNotifs] = useState([])

  useEffect(() => {
    if (notifications) setLocalNotifs(notifications)
  }, [notifications])

  // "Mark all read" is a device-local preference — the notification API has
  // no mark-read endpoint (see utils/notificationRead.js).
  function handleMarkAllRead() {
    const ids = localNotifs.map((n) => n.id)
    markReadLocal(ids)
    setLocalNotifs((current) => current.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = localNotifs.filter((n) => !n.read).length
  const canSwitchDepartment = [ROLES.DISTRICT_COLLECTOR, ROLES.DM, ROLES.ADM, ROLES.STATE_ADMIN, ROLES.SYSTEM_ADMIN].includes(user?.role)
  const currentDepartment = DEPARTMENTS.find((department) => department.id === user?.departmentId)

  // District options come from the configured hierarchy (slug ids); when the
  // authenticated profile carries the numeric backend district pk, its label
  // is resolved from the profile itself so the selector never renders an
  // undefined pair ("Nalanda (undefined)").
  const districtOptions = useMemo(() => {
    const base = DISTRICTS.map((d) => ({ value: d.id, label: d.phase ? `${d.label} (${d.phase})` : d.label }))
    if (user?.districtId && !base.some((option) => option.value === user.districtId) && user?.district?.label) {
      return [...base, { value: user.districtId, label: user.district.label }]
    }
    return base
  }, [user?.districtId, user?.district?.label])

  return (
    <>
      <header className="h-14 border-b border-ink-100 bg-white/90 backdrop-blur flex items-center justify-between px-3 sm:px-5 shrink-0 z-20">
        <div className="min-w-0 flex items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-ink-100 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-ink-950 truncate">{title}</h1>
            {subtitle && <p className="text-[11.5px] text-ink-500 -mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0 min-w-0">
          {/* Cmd+K Quick Search Trigger Button */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-[12px] text-ink-500 hover:bg-white hover:border-ink-300 transition-colors"
          >
            <Search size={14} />
            <span>Search NDISP…</span>
            <kbd className="font-mono text-[10px] text-ink-400 bg-white px-1.5 py-0.5 rounded border border-ink-200">⌘K</kbd>
          </button>

          {/* Mobile-only search trigger so the palette stays reachable on phones */}
          <button
            onClick={() => setCmdOpen(true)}
            className="sm:hidden grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
            aria-label="Search NDISP"
          >
            <Search size={17} />
          </button>

          {showDepartment && (
            <div className="hidden sm:flex items-center max-w-[180px] min-w-0">
              {canSwitchDepartment ? (
                <Select small value={user?.departmentId} onChange={setDepartment} options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))} />
              ) : (
                <Badge tone="info">{currentDepartment?.label || 'Department workspace'}</Badge>
              )}
            </div>
          )}

          {showDistrict && (
            <div className="hidden md:flex items-center gap-1.5 pl-1">
              <MapPin size={13} className="text-ink-400" />
              <Select
                small
                value={user?.districtId}
                onChange={setDistrict}
                options={districtOptions}
              />
            </div>
          )}

          <button
            onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-ink-600 hover:bg-ink-100"
            title="Toggle language"
          >
            <Globe size={14} />
            <span className="hidden sm:inline">{locale === 'en' ? 'EN' : 'हि'}</span>
          </button>

          {/* Citizen-only guided tour replay ("Take a Tour") */}
          {user?.role === ROLES.CITIZEN && (
            <button
              onClick={() => useTourStore.getState().openReplay()}
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
              title="Take a tour"
              aria-label="Take a tour"
            >
              <HelpCircle size={17} />
            </button>
          )}

          {/* Notification Bell Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 transition-colors"
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-alert-500 ring-2 ring-white" />}
          </button>

          <div className="h-6 w-px bg-ink-100 mx-0.5" />
          <UserMenu />
        </div>
      </header>

      {/* Drawer & Command Palette components */}
      <NotificationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={localNotifs}
        onMarkAllRead={handleMarkAllRead}
      />

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
