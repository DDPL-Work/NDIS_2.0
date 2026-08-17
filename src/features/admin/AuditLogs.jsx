// Audit Logs Compliance Page — Vol 2 & Vol 4 Compliance Audit Trail (log_audit_event).
import { useState, useMemo } from 'react'
import { ShieldCheck, Search, Lock, Filter, FileText } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { useAsync } from '../../hooks/useAsync'
import { getAuditLogs } from '../../services/mock/auditLogs'
import { formatDateTime } from '../../utils/format'

export default function AuditLogs() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: logs, loading } = useAsync(() => Promise.resolve(getAuditLogs()), [])

  const filteredLogs = useMemo(() => {
    if (!logs) return []
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
    { key: 'action', label: 'Action & Description', render: (r) => <span className="font-semibold text-ink-950">{r.label}</span> },
    { key: 'actor', label: 'Actor / User', render: (r) => <span className="text-ink-800">{r.actor}</span>, hideOn: 'md' },
    { key: 'entity', label: 'Target Entity', render: (r) => <span className="kbd-mono text-[11.5px] text-ink-600">{r.targetEntityId}</span>, hideOn: 'md' },
    { key: 'ip', label: 'IP Address', render: (r) => <span className="kbd-mono text-[11.5px] text-ink-500">{r.ipAddress}</span>, hideOn: 'md' },
    { key: 'timestamp', label: 'Timestamp', render: (r) => formatDateTime(r.timestamp) },
    {
      key: 'hash',
      label: 'Cryptographic Hash Signature',
      render: (r) => (
        <span className="kbd-mono text-[10.5px] bg-ink-100 text-ink-700 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit">
          <Lock size={10} className="text-leaf-600" /> {r.hashSignature}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Vol 2 §14"
        title="Governance & immutable audit trail"
        description="Tamper-evident audit log (log_audit_event). Every financial sanction, data ingest, and administrative decision is cryptographically signed."
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
                { value: 'all', label: 'All Categories' },
                { value: 'workflow', label: 'Workflows & Approvals' },
                { value: 'ingestion', label: 'CSV Ingestion' },
                { value: 'field', label: 'Field Ops & Inspections' },
                { value: 'analytics', label: 'Analytics Computation' },
              ]}
            />
          </div>
        }
      />

      <div className="p-6">
        <div className="card">
          {loading ? (
            <div className="p-6 text-center text-ink-400 text-[12.5px]">Loading compliance logs…</div>
          ) : (
            <DataTable columns={columns} rows={filteredLogs} emptyLabel="No audit events found" />
          )}
        </div>
      </div>
    </div>
  )
}
