import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, ChevronDown, Globe, MapPin, Search } from 'lucide-react'
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
import clsx from 'clsx'

function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onOutside])
}

function UserMenu({ dark = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useOutsideClick(ref, () => setOpen(false))
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx('flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 transition-colors', dark ? 'hover:bg-royal-900' : 'hover:bg-ink-100')}
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-saffron-500 text-white text-[11.5px] font-semibold">
          {user?.name?.[0] || 'U'}
        </div>
        <span className={clsx('text-[12.5px] font-medium max-w-[120px] truncate hidden sm:block', dark ? 'text-royal-100' : 'text-ink-800')}>
          {user?.name}
        </span>
        <ChevronDown size={13} className={dark ? 'text-royal-300' : 'text-ink-400'} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 card p-1.5 z-30 animate-fade-in">
          <div className="px-2.5 py-2">
            <p className="text-[13px] font-semibold text-ink-900">{user?.name}</p>
            <p className="text-[11.5px] text-ink-500">{ROLE_LABELS[user?.role]}</p>
          </div>
          <div className="h-px bg-ink-100 my-1" />
          <button
            onClick={() => {
              signOut()
              navigate('/')
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-alert-600 hover:bg-alert-50"
          >
            <LogOut size={14} /> Switch role / Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Topbar({ title, subtitle, showDistrict = true, showDepartment = false, theme = 'light' }) {
  const user = useAuthStore((s) => s.user)
  const setDistrict = useAuthStore((s) => s.setDistrict)
  const setDepartment = useAuthStore((s) => s.setDepartment)
  const { locale, setLocale } = useI18n()
  const dark = theme === 'royal'

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  const { data: notifications, refetch: refetchNotifs } = useAsync(() => notificationApi.listNotifications(), [])
  const [localNotifs, setLocalNotifs] = useState([])

  useEffect(() => {
    if (notifications) setLocalNotifs(notifications)
  }, [notifications])

  const unreadCount = localNotifs.filter((n) => !n.read).length
  const canSwitchDepartment = [ROLES.DISTRICT_COLLECTOR, ROLES.DM, ROLES.ADM, ROLES.STATE_ADMIN, ROLES.SYSTEM_ADMIN].includes(user?.role)
  const currentDepartment = DEPARTMENTS.find((department) => department.id === user?.departmentId)

  function handleMarkAllRead() {
    setLocalNotifs((cur) => cur.map((n) => ({ ...n, read: true })))
  }

  return (
    <>
      <header
        className={clsx(
          'h-14 border-b backdrop-blur flex items-center justify-between px-5 shrink-0 z-20',
          dark ? 'border-royal-800/70 bg-royal-950/95' : 'border-ink-100 bg-white/90'
        )}
      >
        <div className="min-w-0 flex items-center gap-3">
          <div>
            <h1 className={clsx('text-[15px] font-semibold truncate', dark ? 'text-royal-50' : 'text-ink-950')}>{title}</h1>
            {subtitle && (
              <p className={clsx('text-[11.5px] -mt-0.5 truncate', dark ? 'text-royal-300' : 'text-ink-500')}>{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cmd+K Quick Search Trigger Button */}
          <button
            onClick={() => setCmdOpen(true)}
            className={clsx(
              'hidden sm:flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
              dark
                ? 'border-royal-800 bg-royal-900/70 text-royal-200 hover:border-royal-600 hover:bg-royal-800/60 hover:text-royal-50'
                : 'border-ink-200 bg-ink-50 text-ink-500 hover:bg-white hover:border-ink-300'
            )}
          >
            <Search size={14} />
            <span>Search NDISP…</span>
            <kbd
              className={clsx(
                'font-mono text-[10px] px-1.5 py-0.5 rounded border',
                dark ? 'text-royal-300 bg-royal-950 border-royal-700' : 'text-ink-400 bg-white border-ink-200'
              )}
            >
              ⌘K
            </kbd>
          </button>

          {showDepartment && (canSwitchDepartment ? (
            <Select small dark={dark} value={user?.departmentId} onChange={setDepartment} options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))} />
          ) : (
            <Badge tone={dark ? 'royal' : 'info'}>{currentDepartment?.label || 'Department workspace'}</Badge>
          ))}

          {showDistrict && (
            <div className="hidden md:flex items-center gap-1.5 pl-1">
              <MapPin size={13} className={dark ? 'text-royal-300' : 'text-ink-400'} />
              <Select
                small
                dark={dark}
                value={user?.districtId}
                onChange={setDistrict}
                options={DISTRICTS.map((d) => ({
                  value: d.id,
                  label: `${d.label}${d.phase !== 'Pilot' ? ` (${d.phase})` : ''}`,
                }))}
              />
            </div>
          )}

          <button
            onClick={() => setLocale(locale === 'en' ? 'hi' : 'en')}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
              dark ? 'text-royal-200 hover:bg-royal-900 hover:text-royal-50' : 'text-ink-600 hover:bg-ink-100'
            )}
            title="Toggle language"
          >
            <Globe size={14} /> {locale === 'en' ? 'EN' : 'हि'}
          </button>

          {/* Notification Bell Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={clsx(
              'relative grid h-9 w-9 place-items-center rounded-lg transition-colors',
              dark ? 'text-royal-200 hover:bg-royal-900 hover:text-royal-50' : 'text-ink-500 hover:bg-ink-100'
            )}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className={clsx('absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-alert-500 ring-2', dark ? 'ring-royal-950' : 'ring-white')} />
            )}
          </button>

          <div className={clsx('h-6 w-px mx-0.5', dark ? 'bg-royal-800' : 'bg-ink-100')} />
          <UserMenu dark={dark} />
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