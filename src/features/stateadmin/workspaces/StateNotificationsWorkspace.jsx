// State Admin notification inbox — merges the live notification feed
// (GET /api/notifications/) with local alerts raised by finance/sanction
// activity (which the backend does not surface). Unread state for local
// notifications lives in the finance store; backend items track read locally.
import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Filter } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Pagination, { usePagedRows } from '../../../components/ui/Pagination'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStatePermission } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { backendNotificationApi } from '../../../api/notificationApi'
import { SelectField, FilterStrip } from '../components/StateUI'
import { STATE_NOTIFICATION_TYPES, STATE_NOTIFICATION_TYPE_LABELS } from '../../../config/stateConstants'

const TONE_BY_TYPE = {
  budget_allocated: 'positive',
  budget_approved: 'positive',
  sanction_issued: 'positive',
  fund_released: 'positive',
  order_published: 'info',
  proposal_submitted: 'info',
  approval_pending: 'warning',
  proposal_returned: 'warning',
  approval_escalated: 'warning',
  budget_exhaustion: 'negative',
  low_utilization: 'negative',
  project_delayed: 'negative',
}

const toViewItem = (n) => ({
  id: n.id,
  type: n.type || 'notification',
  message: n.message || '',
  createdAt: n.createdAt || n.created_at || null,
  departmentId: n.departmentId || null,
  read: !!n.read,
  local: false,
})

export default function StateNotificationsWorkspace() {
  const store = useStateFinanceStore()
  const pushToast = useUiStore((s) => s.pushToast)
  const canMark = useStatePermission('notification.view')
  const [type, setType] = useState('all')
  const [showUnread, setShowUnread] = useState(false)
  const [backendFeed, setBackendFeed] = useState([])
  const [backendRead, setBackendRead] = useState({})

  useEffect(() => {
    let alive = true
    backendNotificationApi.list().catch(() => []).then((items) => {
      if (alive) setBackendFeed((items || []).map(toViewItem))
    })
    return () => { alive = false }
  }, [])

  const rows = useMemo(() => {
    const local = store.notifications.map((n) => ({ ...n, local: true }))
    const merged = [...backendFeed, ...local].map((n) => (n.local ? n : { ...n, read: n.read || backendRead[n.id] }))
    return merged.filter((n) => {
      if (type !== 'all' && n.type !== type) return false
      if (showUnread && n.read) return false
      return true
    })
  }, [store.notifications, backendFeed, backendRead, type, showUnread])

  const { page, setPage, pageSize, setPageSize, pageRows, total } = usePagedRows(rows)

  const unread = rows.filter((n) => !n.read).length

  const markRead = (n) => {
    if (n.read) return
    if (n.local) store.setNotificationRead(n.id)
    else setBackendRead((s) => ({ ...s, [n.id]: true }))
    pushToast('Marked as read.', 'success')
  }

  const markAllRead = () => {
    store.markNotificationsRead()
    setBackendRead(Object.fromEntries(rows.filter((n) => !n.local).map((n) => [n.id, true])))
    pushToast('All notifications marked as read.', 'success')
  }

  return (
    <div className="px-6 pb-10">
      <PageHeader
        eyebrow="STATE ADMIN · MONITORING · NOTIFICATIONS"
        title="Notifications"
        description={`System-generated alerts from budget, sanction, release and approval activity — ${unread} unread.`}
        action={
          <Button variant="ghost" icon={CheckCheck} onClick={markAllRead} disabled={!canMark}>
            Mark All Read
          </Button>
        }
      />

      <FilterStrip className="mb-4">
        <SelectField
          label="Type"
          value={type}
          onChange={setType}
          options={[{ value: 'all', label: 'All Types' }, ...STATE_NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
        />
        <Button variant={showUnread ? 'primary' : 'ghost'} size="sm" icon={Filter} onClick={() => setShowUnread((s) => !s)}>
          {showUnread ? 'Only Unread' : 'Unread Only'}
        </Button>
      </FilterStrip>

      <Card>
        <CardHeader title="Notification Feed" subtitle={`${rows.length} notifications`} icon={Bell} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={Bell} title={showUnread ? 'No unread notifications' : 'No notifications found'} description={showUnread ? 'You are all caught up.' : 'Notifications raised by financial and approval activity will appear here.'} />
          ) : (
            <div className="divide-y divide-ink-50">
              {pageRows.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n)}
                  className={`flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-ink-50 transition-colors ${!n.read ? 'bg-ink-50/60' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-ink-200' : 'bg-saffron-500'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap">
                      <Badge tone={TONE_BY_TYPE[n.type] || 'neutral'}>{STATE_NOTIFICATION_TYPE_LABELS[n.type] || n.type}</Badge>
                      {n.departmentId && <span className="text-[11px] uppercase tracking-wide text-ink-400">{n.departmentId}</span>}
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-800">{n.message}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-400">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                  </span>
                  {!n.read && <span className="text-[10.5px] font-semibold uppercase tracking-wide text-saffron-600 shrink-0 mt-1">Unread</span>}
                </button>
              ))}
            </div>
          )}
          {total > pageSize && <Pagination total={total} page={page} onPage={setPage} pageSize={pageSize} onPageSize={setPageSize} />}
        </CardBody>
      </Card>
    </div>
  )
}