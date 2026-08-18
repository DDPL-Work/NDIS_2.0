import { useState, useMemo } from 'react'
import { Bell, Check, Inbox, Mail, MessageSquare, RefreshCw, Smartphone } from 'lucide-react'
import clsx from 'clsx'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { notificationApi } from '../../services/api'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { timeAgo } from '../../utils/format'
import { getLocallyReadIds, markReadLocal } from '../../utils/notificationRead'

// Channel presentation (real values from the notifications API).
const CHANNEL_META = {
  sms: { icon: Smartphone, label: 'SMS' },
  email: { icon: Mail, label: 'Email' },
  portal: { icon: MessageSquare, label: 'Portal' },
}

function isToday(iso) {
  if (!iso) return false
  const date = new Date(iso)
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export default function CitizenNotifications() {
  const dataVersion = useComplaintEngine((s) => s.dataVersion)
  const { data, loading, error, refetch } = useAsync(() => notificationApi.listNotifications(), [dataVersion])
  const [localReadVersion, setLocalReadVersion] = useState(0)
  const notifications = data || []

  // Read state = backend `read` flag OR this device's local read marker
  // (the notification API has no mark-read endpoint — see notificationRead.js).
  const locallyRead = useMemo(() => getLocallyReadIds(), [localReadVersion, dataVersion])
  const isRead = (notification) => Boolean(notification.read) || locallyRead.has(String(notification.id))

  const today = notifications.filter((n) => isToday(n.createdAt))
  const earlier = notifications.filter((n) => !isToday(n.createdAt))
  const unreadCount = notifications.filter((n) => !isRead(n)).length

  function markAllRead() {
    markReadLocal(notifications.map((n) => n.id))
    setLocalReadVersion((v) => v + 1)
  }

  function markOneRead(id) {
    markReadLocal([id])
    setLocalReadVersion((v) => v + 1)
  }

  function renderRow(notification) {
    const channel = CHANNEL_META[notification.channel] || CHANNEL_META.portal
    const Icon = channel.icon
    const read = isRead(notification)
    return (
      <li key={notification.id} className={clsx('flex gap-3 p-3.5', !read && 'bg-saffron-50/30')}>
        <span className={clsx('relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl', read ? 'bg-ink-50 text-ink-400' : 'bg-saffron-100 text-saffron-700')}>
          <Icon size={16} />
          {!read && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-saffron-500" aria-label="Unread" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] leading-snug text-ink-800">{notification.message}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-400">
            <span>{timeAgo(notification.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{channel.label}</span>
            {notification.label && (
              <>
                <span aria-hidden="true">·</span>
                <span>{notification.label}</span>
              </>
            )}
          </span>
        </span>
        {!read && (
          <button
            onClick={() => markOneRead(notification.id)}
            className="self-center rounded-lg border border-ink-200 px-2 py-1 text-[10.5px] font-semibold text-ink-600 transition-colors hover:bg-ink-50"
            title="Mark as read (stored on this device)"
          >
            <Check size={12} className="mr-1 inline" />Mark read
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6" data-tour="citizen-notifications-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-saffron-600">Citizen Portal</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up.'}
          </p>
        </div>
        {!loading && !error && unreadCount > 0 && (
          <Button size="sm" variant="outline" icon={Check} onClick={markAllRead}>Mark all read</Button>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {error && (
        <div className="card flex items-center justify-between gap-3 p-4 text-[13px] text-alert-700">
          <span className="flex items-center gap-2"><Bell size={15} />Something went wrong while loading your notifications.</span>
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={refetch}>Try Again</Button>
        </div>
      )}
      {!loading && !error && notifications.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          description="Updates about your complaints and district services will appear here."
        />
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-5">
          {today.length > 0 && (
            <section aria-label="Today">
              <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Today</h2>
              <ul className="card divide-y divide-ink-50 border">{today.map(renderRow)}</ul>
            </section>
          )}
          {earlier.length > 0 && (
            <section aria-label="Earlier">
              <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">Earlier</h2>
              <ul className="card divide-y divide-ink-50 border">{earlier.map(renderRow)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}