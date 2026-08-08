import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import ProposalTimeline from '../shared/ProposalTimeline'
import { useAsync } from '../../hooks/useAsync'
import { workflowApi, directoryApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { formatCurrencyINR } from '../../utils/format'

export default function Directives() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const [selected, setSelected] = useState(null)
  const [engineerId, setEngineerId] = useState('')
  const [busy, setBusy] = useState(false)

  const { data: directives, loading, refetch } = useAsync(() => workflowApi.getDirectives(user?.departmentId), [user?.departmentId])
  const { data: engineersData } = useAsync(() => directoryApi.listFieldEngineers(user?.departmentId), [user?.departmentId])
  const engineers = engineersData || []

  async function acknowledgeAndAssign() {
    setBusy(true)
    try {
      const engineer = engineers.find((e) => e.id === engineerId)
      await workflowApi.transitionProposal(selected.id, 'assigned_to_field')
      selected.assignedFieldEngineer = engineer?.name
      pushToast(`Directive acknowledged and assigned to ${engineer?.name}.`, 'success')
      setSelected(null)
      refetch()
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.id}</span> },
    { key: 'title', label: 'Directive', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'amount', label: 'Approved amount', render: (r) => formatCurrencyINR(r.approvedAmount) },
    { key: 'engineer', label: 'Field engineer', render: (r) => r.assignedFieldEngineer || '—' },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Line Department Portal · FR-LD-03"
        title="Directives inbox"
        description="Formal taskings issued by the DM/ADM office. Acknowledge and nominate a field engineer to proceed."
      />
      <div className="p-6">
        <div className="card">
          {loading ? <div className="p-6 text-[12.5px] text-ink-400">Loading…</div> : <DataTable columns={columns} rows={directives} onRowClick={setSelected} emptyLabel="No directives received yet" />}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        footer={
          selected?.state === 'tasked' ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button icon={CheckCircle2} loading={busy} disabled={!engineerId} onClick={acknowledgeAndAssign}>Acknowledge & assign</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2"><StatusBadge status={selected.state} /><span className="kbd-mono text-[12px] text-ink-500">{selected.id}</span></div>
            <p className="text-[13px] text-ink-700">Approved amount: <strong>{formatCurrencyINR(selected.approvedAmount)}</strong> · Village: <strong>{selected.village}</strong></p>

            {selected.state === 'tasked' && (
              <div>
                <label className="text-[12px] font-medium text-ink-600">Nominate field engineer</label>
                <Select
                  className="w-full mt-1"
                  value={engineerId}
                  onChange={setEngineerId}
                  options={[{ value: '', label: 'Select an engineer…' }, ...engineers.map((e) => ({ value: e.id, label: e.name }))]}
                />
              </div>
            )}

            <div className="h-px bg-ink-100" />
            <h4 className="text-[12.5px] font-semibold text-ink-800">Workflow history</h4>
            <ProposalTimeline history={selected.history} />
          </div>
        )}
      </Modal>
    </div>
  )
}
