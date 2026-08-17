// Notification Drawer — Vol 4 §API / Vol 3 Ch 18 (Notification Engine).
// Slide-out panel for portal, SMS, and email alerts.
import { useEffect, useState } from 'react'
import { Bell, X, Check, Filter, MessageSquare, Mail, Smartphone, AlertTriangle } from 'lucide-react'
import Badge from './Badge'
import Button from './Button'
import { timeAgo } from '../../utils/format'
import { DEPARTMENT_MAP } from '../../config/constants'

const CHANNEL_ICONS = {
  portal: MessageSquare,
  sms: Smartphone,
  email: Mail,
}

export default function NotificationDrawer({ open, onClose, notifications = [], onMarkAllRead }) {
  const [channelFilter, setChannelFilter] = useState('all')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const filtered = notifications.filter((n) => {
    if (channelFilter !== 'all' && n.channel !== channelFilter) return false
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-ink-950/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-4 border-b border-ink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-saffron-100 text-saffron-700">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink-950">Notifications</h3>
              <p className="text-[11.5px] text-ink-500">{unreadCount} unread alert(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100">
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 border-b border-ink-100 bg-ink-50/50 flex flex-wrap items-center justify-between gap-2 text-[12px]">
          <div className="flex items-center gap-1.5">
            {['all', 'portal', 'sms', 'email'].map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  channelFilter === c ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          {onMarkAllRead && unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="text-ink-600 hover:text-ink-950 font-medium flex items-center gap-1">
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-ink-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-ink-400 text-[12.5px]">No notifications found.</div>
          ) : (
            filtered.map((n) => {
              const ChannelIcon = CHANNEL_ICONS[n.channel] || Bell
              const dept = DEPARTMENT_MAP[n.departmentId]
              return (
                <div
                  key={n.id}
                  className={`p-4 transition-colors ${!n.read ? 'bg-saffron-50/20' : 'hover:bg-ink-50/50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white mt-0.5"
                      style={{ background: dept?.color || '#546882' }}
                    >
                      <ChannelIcon size={14} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[12.5px] font-medium text-ink-900 leading-snug">{n.message}</p>
                      <div className="flex items-center justify-between text-[11px] text-ink-400">
                        <span>{timeAgo(n.createdAt)} · {n.channel.toUpperCase()}</span>
                        {dept && <span>{dept.label}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
