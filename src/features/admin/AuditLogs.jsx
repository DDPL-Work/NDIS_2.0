// Audit Logs Compliance Page — Vol 2 & Vol 4 Compliance Audit Trail.
// Honest data sources only: complaint state transitions (rebuilt from the
// backend complaint timeline) and workforce/identity actions recorded by the
// identity store. No fabricated or cryptographically-signed mock events.
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useIdentityStore } from '../../features/department/identity/identityStore'
import { formatDateTime } from '../../utils/format'

export default function AuditLogs() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const complaintLogs = useComplaintEngine((s) => s.auditLogs)
  const identityLogs = useIdentityStore((s) => s.auditLogs)

  const logs = useMemo(() => {
    const complaintRows = (complaintLogs || []).map((log) => ({
      id: log.id,
      category: 'complaints',
      label: log.action,
      detail: log.newValue && log.oldValue ? `${log.oldValue} → ${log.newValue}` : log.location,
      actor: log.actorName,
      targetEntityId: log.complaintId,
      timestamp: log.timestamp,
    }))
    const identityRows = (identityLogs || []).map((log) => ({
      id: log.id,
      category: 'workforce',
      label: log.action,
      detail: log.module || '',
      actor: log.actor,
      targetEntityId: log.entityId || '',
      timestamp: log.timestamp,
    }))
    return [...complaintRows, ...identityRows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [complaintLogs, identityLogs])

  const filteredLogs = useMemo(() => {
    if (!logs.length) return []
    return logs.filter((log) => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (
          !log.label.toLowerCase().includes(q) &&
          !log.actor.toLowerCase().includes(q) &&
          !log.id.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [logs, categoryFilter, searchQuery])

  const columns = [
    { key: 'id', label: 'Log ID', render: (r) => <span className="kbd-mono text-[11.5px]">{r.id}</span>, hideOn: 'sm' },
    {
      key: 'action',
      label: 'Action & Description',
      render: (r) => (
        <div>
          <span className="font-semibold text-ink-950 block">{r.label}</span>
          {r.detail && <span className="text-[11.5px] text-ink-500 block">{r.detail}</span>}
        </div>
      ),
    },
    { key: 'actor', label: 'Actor / User', render: (r) => <span className="text-ink-800">{r.actor}</span>, hideOn: 'md' },
    { key: 'entity', label: 'Target Entity', render: (r) => <span className="kbd-mono text-[11.5px] text-ink-600">{r.targetEntityId}</span>, hideOn: 'md' },
    {
      key: 'category',
      label: 'Source',
      render: (r) => (
        <Badge tone={r.category === 'complaints' ? 'sky' : 'ink'}>
          {r.category === 'complaints' ? 'Complaint Timeline' : 'Workforce & Identity'}
        </Badge>
      ),
    },
    { key: 'timestamp', label: 'Timestamp', render: (r) => formatDateTime(r.timestamp) },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Vol 2 §14"
        title="Governance & audit trail"
        description="Event trail rebuilt from the backend complaint timeline plus locally recorded workforce actions. Cryptographic event signing is not exposed by the backend."
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search audit trail…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-8 pr-3 py-1.5 text-[12px] focus:bg-white"
              />
            </div>
            <Select
              small
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'complaints', label: 'Complaint Timeline' },
                { value: 'workforce', label: 'Workforce & Identity' },
              ]}
            />
          </div>
        }
      />

      <div className="p-6">
        <div className="card">
          <DataTable
            columns={columns}
            rows={filteredLogs}
            emptyLabel={
              logs.length ? 'No audit events match the current filters' : 'No audit events recorded yet — events appear as complaints transition and workforce actions are recorded'
            }
          />
        </div>
      </div>
    </div>
  )
}