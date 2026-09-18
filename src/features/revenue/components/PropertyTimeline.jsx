// Revenue & Property Intelligence — Property Timeline Component
import { useMemo } from 'react'
import { Card, Badge, Tooltip, Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../../components/ui'
import { formatDate, formatDateTime } from '../utils/revenueFormatters'
import {
  FileText, Calculator, Bell, CreditCard, AlertTriangle,
  ClipboardList, Gavel, Shield, History, AlertCircle,
  CheckCircle, XCircle, Clock, AlertTriangle as AlertTriangleIcon
} from 'lucide-react'

const EVENT_TYPE_CONFIG = {
  assessment: { label: 'Assessment', icon: Calculator, color: '#3b82f6', bgColor: '#eff6ff' },
  assessment_change: { label: 'Assessment Change', icon: Calculator, color: '#8b5cf6', bgColor: '#f5f0ff' },
  demand_generated: { label: 'Demand Generated', icon: FileText, color: '#1d4ed8', bgColor: '#eff6ff' },
  demand_revised: { label: 'Demand Revised', icon: FileText, color: '#8b5cf6', bgColor: '#f5f0ff' },
  notice_issued: { label: 'Notice Issued', icon: Bell, color: '#f97316', bgColor: '#fff7ed' },
  notice_served: { label: 'Notice Served', icon: Bell, color: '#ea580c', bgColor: '#fff7ed' },
  notice_response: { label: 'Notice Response', icon: Bell, color: '#ea580c', bgColor: '#fff7ed' },
  payment_received: { label: 'Payment Received', icon: CreditCard, color: '#22c55e', bgColor: '#f0fdf4' },
  payment_reversed: { label: 'Payment Reversed', icon: CreditCard, color: '#ef4444', bgColor: '#fef2f2' },
  arrears_created: { label: 'Arrears Created', icon: AlertTriangle, color: '#dc2626', bgColor: '#fef2f2' },
  arrears_aged: { label: 'Arrears Aged', icon: AlertTriangle, color: '#991b1b', bgColor: '#fef2f2' },
  inspection_scheduled: { label: 'Inspection Scheduled', icon: ClipboardList, color: '#0891b2', bgColor: '#f0f9ff' },
  inspection_completed: { label: 'Inspection Completed', icon: ClipboardList, color: '#0e7490', bgColor: '#f0f9ff' },
  inspection_failed: { label: 'Inspection Failed', icon: AlertCircle, color: '#dc2626', bgColor: '#fef2f2' },
  reassessment_requested: { label: 'Reassessment Requested', icon: Calculator, color: '#8b5cf6', bgColor: '#f5f0ff' },
  reassessment_approved: { label: 'Reassessment Approved', icon: Calculator, color: '#7c3aed', bgColor: '#f5f0ff' },
  reassessment_completed: { label: 'Reassessment Completed', icon: CheckCircle, color: '#22c55e', bgColor: '#f0fdf4' },
  recovery_initiated: { label: 'Recovery Initiated', icon: Gavel, color: '#dc2626', bgColor: '#fef2f2' },
  recovery_action: { label: 'Recovery Action', icon: Gavel, color: '#991b1b', bgColor: '#fef2f2' },
  recovery_completed: { label: 'Recovery Completed', icon: CheckCircle, color: '#22c55e', bgColor: '#f0fdf4' },
  dispute_filed: { label: 'Dispute Filed', icon: AlertTriangle, color: '#a855f7', bgColor: '#faf5ff' },
  dispute_resolved: { label: 'Dispute Resolved', icon: Shield, color: '#22c55e', bgColor: '#f0fdf4' },
  audit_entry: { label: 'Audit Entry', icon: Shield, color: '#6b7280', bgColor: '#f9fafb' },
  property_created: { label: 'Property Created', icon: History, color: '#3b82f6', bgColor: '#eff6ff' },
  property_updated: { label: 'Property Updated', icon: History, color: '#6b7280', bgColor: '#f9fafb' },
  owner_changed: { label: 'Owner Changed', icon: History, color: '#6b7280', bgColor: '#f9fafb' },
  reassessment_pending: { label: 'Reassessment Pending', icon: Clock, color: '#f97316', bgColor: '#fff7ed' },
  notice_overdue: { label: 'Notice Overdue', icon: AlertTriangleIcon, color: '#dc2626', bgColor: '#fef2f2' },
}

const EVENT_CATEGORIES = {
  assessment: ['assessment', 'assessment_change', 'reassessment_requested', 'reassessment_approved', 'reassessment_completed', 'reassessment_pending'],
  demand: ['demand_generated', 'demand_revised'],
  notice: ['notice_issued', 'notice_served', 'notice_response', 'notice_overdue'],
  payment: ['payment_received', 'payment_reversed'],
  arrears: ['arrears_created', 'arrears_aged'],
  inspection: ['inspection_scheduled', 'inspection_completed', 'inspection_failed'],
  reassessment: ['reassessment_requested', 'reassessment_approved', 'reassessment_completed', 'reassessment_pending'],
  recovery: ['recovery_initiated', 'recovery_action', 'recovery_completed'],
  dispute: ['dispute_filed', 'dispute_resolved'],
  audit: ['audit_entry'],
  property: ['property_created', 'property_updated', 'owner_changed'],
}

function getEventCategory(eventType) {
  for (const [category, types] of Object.entries(EVENT_CATEGORIES)) {
    if (types.includes(eventType)) return category
  }
  return 'other'
}

function getEventConfig(eventType) {
  return EVENT_TYPE_CONFIG[eventType] || {
    label: eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: History,
    color: '#6b7280',
    bgColor: '#f9fafb',
  }
}

export function PropertyTimeline({
  events = [],
  className = '',
  compact = false,
  groupByCategory = true,
  showFilters = true,
  onEventClick,
  emptyMessage = 'No timeline events found',
}) {
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEvents, setExpandedEvents] = useState(new Set())

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        if (filterCategory !== 'all') {
          const category = getEventCategory(event.eventType)
          if (category !== filterCategory) return false
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const searchable = [
            event.eventTypeLabel || '',
            event.description || '',
            event.actor || '',
            event.eventType || '',
          ].join(' ').toLowerCase()
          if (!searchable.includes(query)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.eventDate || 0) - new Date(a.eventDate || 0))
  }, [events, filterCategory, searchQuery])

  const groupedEvents = useMemo(() => {
    if (!groupByCategory) return { All: filteredEvents }

    const groups = {}
    filteredEvents.forEach(event => {
      const category = getEventCategory(event.eventType)
      const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1)
      if (!groups[categoryLabel]) groups[categoryLabel] = []
      groups[categoryLabel].push(event)
    })
    return groups
  }, [filteredEvents, groupByCategory])

  const toggleEvent = (eventId) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }

  if (events.length === 0) {
    return (
      <Card className={className}>
        <div className="p-8 text-center">
          <History className="w-12 h-12 mx-auto mb-3 text-ink-300" />
          <p className="text-ink-500">{emptyMessage}</p>
        </div>
      </Card>
    )
  }

  const categories = groupByCategory
    ? Object.keys(groupedEvents).sort()
    : ['All']

  return (
    <Card className={className}>
      {/* Header & Filters */}
      <div className="p-4 border-b border-ink-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="font-medium text-ink-900">Property Timeline</h3>
            <p className="text-sm text-ink-500">{events.length} events • {filteredEvents.length} filtered</p>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search events..."
                  className="w-48 sm:w-64 pl-10 pr-4 py-2 border border-ink-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'assessment', label: 'Assessment' },
                  { value: 'demand', label: 'Demand' },
                  { value: 'notice', label: 'Notices' },
                  { value: 'payment', label: 'Payments' },
                  { value: 'arrears', label: 'Arrears' },
                  { value: 'inspection', label: 'Inspections' },
                  { value: 'reassessment', label: 'Reassessment' },
                  { value: 'recovery', label: 'Recovery' },
                  { value: 'dispute', label: 'Disputes' },
                  { value: 'audit', label: 'Audit' },
                  { value: 'property', label: 'Property' },
                ]}
                className="w-40"
                placeholder="Filter by category"
              />
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([category, events]) => (
            <div key={category} className="space-y-3">
              <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider pb-2 border-b border-ink-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EVENT_TYPE_CONFIG[events[0]?.eventType]?.color || '#6b7280' }} />
                <span>{category} ({events.length})</span>
              </h4>
              <div className="space-y-2">
                {events.map(event => (
                  <TimelineEventItem
                    key={event.id}
                    event={event}
                    compact={compact}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function TimelineEventItem({ event, compact = false, onClick }) {
  const config = getEventConfig(event.eventType)
  const Icon = config.icon
  const isExpanded = true // Could be controlled by parent

  const handleClick = () => onClick?.(event)

  return (
    <div
      className={`relative flex gap-3 p-3 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors cursor-pointer ${compact ? 'p-2' : ''}`}
      onClick={handleClick}
      style={{ borderLeft: `3px solid ${config.color}` }}
    >
      {/* Timeline connector */}
      <div className="absolute left-[-1.5px] top-0 bottom-0 w-[3px] bg-ink-100" />

      {/* Event indicator */}
      <div className="flex-shrink-0 relative z-10">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: config.bgColor, border: `2px solid ${config.color}` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
      </div>

      {/* Event content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink-900">{config.label}</span>
              <span className="text-xs text-ink-500">{formatDateTime(event.eventDate)}</span>
              {event.status && (
                <Badge variant="outline" className="text-[10px]">
                  {event.status}
                </Badge>
              )}
            </div>
            {event.description && (
              <p className="text-xs text-ink-600 mt-1 line-clamp-2">{event.description}</p>
            )}
            {event.amount && (
              <p className="text-sm font-medium text-ink-900 mt-1">
                Amount: {event.amount > 0 ? '+' : ''}{event.amount}
              </p>
            )}
          </div>
          {event.actor && (
            <div className="text-right">
              <p className="text-xs text-ink-500">By</p>
              <p className="text-xs font-medium text-ink-900">{event.actor}</p>
              {event.actorRole && <p className="text-[10px] text-ink-400">{event.actorRole}</p>}
            </div>
          )}
        </div>

        {/* Expandable details */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-ink-500">Event ID</p>
              <p className="font-mono text-ink-900 truncate">{event.id}</p>
            </div>
            <div>
              <p className="text-ink-500">Type</p>
              <p className="font-mono text-ink-900">{event.eventType}</p>
            </div>
            <div>
              <p className="text-ink-500">Actor</p>
              <p className="font-mono text-ink-900 truncate">{event.actor || '—'}</p>
            </div>
            <div>
              <p className="text-ink-500">Role</p>
              <p className="font-mono text-ink-900">{event.actorRole || '—'}</p>
            </div>
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="col-span-2">
                <p className="text-ink-500">Metadata</p>
                <pre className="text-[10px] text-ink-600 bg-ink-50 p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function PropertyTimelineCompact({ events = [], maxItems = 5, className = '', onViewAll }) {
  const recentEvents = useMemo(() => events.slice(0, maxItems), [events, maxItems])

  if (events.length === 0) {
    return (
      <Card className={className}>
        <div className="p-4 text-center text-ink-500">
          <History className="w-8 h-8 mx-auto mb-2 text-ink-300" />
          <p>No recent activity</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-4 border-b border-ink-200 flex items-center justify-between">
        <h3 className="font-medium text-ink-900">Recent Activity</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-sm text-blue-600 hover:text-blue-700">
            View All
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        {recentEvents.map(event => {
          const config = getEventConfig(event.eventType)
          const Icon = config.icon
          return (
            <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-ink-50 rounded-lg">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bgColor }}>
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-900 truncate">{config.label}</p>
                <p className="text-xs text-ink-500">{formatDateTime(event.eventDate)}</p>
              </div>
              <Badge variant="outline" className="text-xs" style={{ backgroundColor: `${config.color}15`, color: config.color, borderColor: `${config.color}40` }}>
                {event.status || 'Completed'}
              </Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function PropertyTimelineStats({ events = [] }) {
  const stats = useMemo(() => {
    const counts = {}
    events.forEach(event => {
      const category = getEventCategory(event.eventType)
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }, [events])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {Object.entries(stats).map(([category, count]) => (
        <Card key={category} className="p-3 text-center hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-ink-900">{count}</p>
          <p className="text-xs text-ink-500 capitalize">{category}</p>
        </Card>
      ))}
    </div>
  )
}

export default PropertyTimeline