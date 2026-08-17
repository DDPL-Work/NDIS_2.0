// State Admin audit & compliance view — reads the hash-chained audit trail
// written by every store mutation (budget, allocation, sanction, release,
// re-appropriation, governance, projects). Filters + search + CSV export.
import { useMemo, useState } from 'react'
import { BookMarked, Download, Search } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { useStateFinanceStore } from '../store/stateFinanceStore'
import { useStatePermission } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { SelectField, FilterStrip } from '../components/StateUI'

export default function StateAuditWorkspace() {
  const store = useStateFinanceStore()
  const pushToast = useUiStore((s) => s.pushToast)
  const canExport = useStatePermission('audit.view')
  const [entity, setEntity] = useState('all')
  const [query, setQuery] = useState('')

  const entities = useMemo(() => Array.from(new Set(store.auditLogs.map((a) => a.entity))), [store.auditLogs])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return store.auditLogs.filter((a) => {
      if (entity !== 'all' && a.entity !== entity) return false
      if (q && !`${a.actor} ${a.action} ${a.entity} ${a.entityId} ${a.reason}`.toLowerCase().includes(q)) return false
      return true
    }).slice(0, 300)
  }, [store.auditLogs, entity, query])

  const exportCsv = () => {
    const header = ['timestamp', 'actor', 'role', 'action', 'entity', 'entityId', 'reason', 'referenceType', 'referenceNo', 'hashSignature', 'status']
    const lines = [header.join(','), ...rows.map((a) => header.map((k) => `"${String(a[k] ?? '').replace(/"/g, '""')}"`).join(','))]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `state-admin-audit-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    pushToast(`Exported ${rows.length} audit records to CSV.`, 'success')
  }

  return (
    <div className="px-6 pb-10">
      <PageHeader
        eyebrow="STATE ADMIN · ADMINISTRATION · AUDIT & COMPLIANCE"
        title="Audit & Compliance"
        description="Immutable, hash-signed audit trail of every state administration mutation."
        action={<Button icon={Download} onClick={exportCsv} disabled={!canExport || rows.length === 0}>Export CSV</Button>}
      />

      <FilterStrip className="mb-4">
        <SelectField label="Entity" value={entity} onChange={setEntity} options={[{ value: 'all', label: 'All Entities' }, ...entities.map((e) => ({ value: e, label: e }))]} />
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor / action / reference" className="input-field pl-8 py-2 text-[13px]" />
        </div>
      </FilterStrip>

      <Card>
        <CardHeader title="Audit Trail" subtitle={`${rows.length} records · hash-signed & immutable`} icon={BookMarked} />
        <CardBody className="p-0">
          {rows.length === 0 ? (
            <EmptyState icon={BookMarked} title="No audit records found" description="Adjust the filters or perform an action in the panel to generate audit entries." />
          ) : (
            <DataTable
              columns={[
                { key: 'timestamp', label: 'Timestamp', render: (a) => <span className="font-mono text-[11.5px]">{new Date(a.timestamp).toLocaleString('en-IN')}</span> },
                { key: 'actor', label: 'User', render: (a) => <span>{a.actor}<span className="block text-[10.5px] text-ink-400">{a.role}</span></span> },
                { key: 'action', label: 'Action', render: (a) => <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px] text-ink-800">{a.action}</code> },
                { key: 'entity', label: 'Entity', render: (a) => <span className="text-[12.5px]">{a.entity}</span> },
                { key: 'entityId', label: 'Entity ID', render: (a) => <span className="font-mono text-[11.5px]">{a.entityId}</span>, hideOn: 'md' },
                { key: 'reason', label: 'Reason', render: (a) => <span className="text-[12.5px] text-ink-600">{a.reason || '—'}</span>, hideOn: 'md' },
                { key: 'hashSignature', label: 'Hash', render: (a) => <span className="font-mono text-[10.5px] text-ink-400">{a.hashSignature}</span>, hideOn: 'lg' },
                { key: 'status', label: 'Status', render: (a) => <Badge tone="positive">{a.status}</Badge> },
              ]}
              rows={rows}
              keyField="id"
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}