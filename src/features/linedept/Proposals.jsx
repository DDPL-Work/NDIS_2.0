// Proposals Page — Vol 3 §15.3 Upward Proposal Lifecycle & Itemized Budgeting Engine.
import { useState } from 'react'
import { Plus, CheckCircle2, ShieldAlert, FileText, MapPin, Calculator } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import WorkflowStepper from '../../components/ui/WorkflowStepper'
import ProposalTimeline from '../shared/ProposalTimeline'
import { useAsync } from '../../hooks/useAsync'
import { workflowApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatCurrencyINR, formatDate, formatNumber } from '../../utils/format'

export default function Proposals() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const dept = DEPARTMENT_MAP[user?.departmentId] || DEPARTMENT_MAP.health

  const [selected, setSelected] = useState(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Itemized proposal form state
  const [form, setForm] = useState({
    title: '',
    village: 'Silao',
    civilCost: '2500000',
    equipmentCost: '1200000',
    contingencyCost: '300000',
    targetBeneficiaries: '15000',
    envClearance: true,
    justification: '',
  })

  const totalRequested = (Number(form.civilCost) || 0) + (Number(form.equipmentCost) || 0) + (Number(form.contingencyCost) || 0)

  const { data: proposals, loading, refetch } = useAsync(
    () => workflowApi.listProposals({ departmentId: dept.id, districtId: user?.districtId }),
    [dept.id, user?.districtId]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await workflowApi.submitProposal({
        departmentId: dept.id,
        districtId: user?.districtId || 'nalanda',
        title: form.title,
        village: form.village,
        requestedAmount: totalRequested,
        targetBeneficiaries: Number(form.targetBeneficiaries) || 10000,
        envClearance: form.envClearance,
        costBreakdown: {
          civil: Number(form.civilCost),
          equipment: Number(form.equipmentCost),
          contingency: Number(form.contingencyCost),
        },
        submittedBy: user?.name,
        gapScoreRef: 0.68,
      })
      pushToast('Proposal submitted successfully for DM financial review.', 'success')
      setComposeOpen(false)
      setForm({
        title: '',
        village: 'Silao',
        civilCost: '2500000',
        equipmentCost: '1200000',
        contingencyCost: '300000',
        targetBeneficiaries: '15000',
        envClearance: true,
        justification: '',
      })
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[12px]">{r.id}</span> },
    { key: 'title', label: 'Proposal', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'requestedAmount', label: 'Requested Amount', render: (r) => formatCurrencyINR(r.requestedAmount) },
    {
      key: 'delegation',
      label: 'Authority',
      render: (r) => (
        <Badge tone={r.requestedAmount > 5000000 ? 'warning' : 'info'}>
          {r.requestedAmount > 5000000 ? 'State Govt' : 'DM Limit'}
        </Badge>
      ),
    },
    { key: 'submittedAt', label: 'Submitted', render: (r) => formatDate(r.submittedAt) },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Line Department Portal · FR-LD-04"
        title="Resource expansion proposals"
        description={`Author, itemize, and submit upward development proposals for ${dept.label} infrastructure expansion.`}
        action={
          <Button icon={Plus} onClick={() => setComposeOpen(true)}>
            New Proposal
          </Button>
        }
      />

      <div className="p-6">
        <div className="card">
          {loading ? (
            <div className="p-6 text-[12.5px] text-ink-400">Loading proposals…</div>
          ) : (
            <DataTable columns={columns} rows={proposals} onRowClick={setSelected} />
          )}
        </div>
      </div>

      {/* Detail Modal with Workflow Stepper */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        width="max-w-2xl"
        footer={<Button variant="outline" onClick={() => setSelected(null)}>Close</Button>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="p-3 bg-ink-50/50 rounded-xl border border-ink-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Lifecycle State Progress</p>
              <WorkflowStepper currentState={selected.state} history={selected.history} />
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={selected.state} />
              <span className="kbd-mono text-[12px] text-ink-500">{selected.id}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[12.5px] p-3 bg-white border border-ink-100 rounded-xl">
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Location</p><p className="font-medium text-ink-900">{selected.village}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Total Amount</p><p className="font-medium text-ink-900">{formatCurrencyINR(selected.requestedAmount)}</p></div>
              <div><p className="text-[10.5px] text-ink-400 uppercase tracking-wide">Submitted By</p><p className="font-medium text-ink-900">{selected.submittedBy}</p></div>
            </div>

            {selected.remarks && (
              <div className="rounded-lg bg-alert-50 border border-alert-200 p-3 text-[12.5px] text-alert-700">
                <strong className="block text-[11px] uppercase tracking-wide text-alert-800">Administrative Remarks:</strong>
                {selected.remarks}
              </div>
            )}

            <div className="h-px bg-ink-100" />
            <h4 className="text-[12.5px] font-semibold text-ink-800">Audit History Timeline</h4>
            <ProposalTimeline history={selected.history} />
          </div>
        )}
      </Modal>

      {/* Itemized Proposal Creation Modal */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={`New ${dept.label} Resource Proposal`}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button form="new-proposal-form" type="submit" loading={submitting}>Submit Proposal for Review</Button>
          </>
        }
      >
        <form id="new-proposal-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-ink-700 mb-1">Proposal Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={`e.g. Upgrade ${dept.label} Infrastructure at Silao`}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Target Village / Settlement</label>
              <input
                required
                value={form.village}
                onChange={(e) => setForm((f) => ({ ...f, village: e.target.value }))}
                placeholder="Village name"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Target Beneficiary Count</label>
              <input
                type="number"
                value={form.targetBeneficiaries}
                onChange={(e) => setForm((f) => ({ ...f, targetBeneficiaries: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"
              />
            </div>
          </div>

          {/* Itemized Budget Breakdown Section */}
          <div className="p-3.5 bg-ink-50/70 border border-ink-100 rounded-xl space-y-3">
            <span className="text-[12px] font-semibold text-ink-900 flex items-center gap-1.5">
              <Calculator size={14} className="text-saffron-600" /> Itemized Financial Estimation
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-ink-500 font-medium mb-1">Civil Works (₹)</label>
                <input
                  type="number"
                  value={form.civilCost}
                  onChange={(e) => setForm((f) => ({ ...f, civilCost: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-[12.5px] bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-500 font-medium mb-1">Equipment (₹)</label>
                <input
                  type="number"
                  value={form.equipmentCost}
                  onChange={(e) => setForm((f) => ({ ...f, equipmentCost: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-[12.5px] bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-500 font-medium mb-1">Contingency (₹)</label>
                <input
                  type="number"
                  value={form.contingencyCost}
                  onChange={(e) => setForm((f) => ({ ...f, contingencyCost: e.target.value }))}
                  className="w-full rounded-lg border border-ink-200 px-2.5 py-1.5 text-[12.5px] bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-ink-200">
              <span className="text-[12px] text-ink-600">Calculated Total Request:</span>
              <span className="text-[15px] font-display font-semibold text-ink-950">{formatCurrencyINR(totalRequested)}</span>
            </div>
          </div>

          {/* Delegation Notice Banner */}
          {totalRequested > 5000000 ? (
            <div className="p-2.5 rounded-lg bg-saffron-50 border border-saffron-200 text-[11.5px] text-saffron-800 flex items-center gap-2">
              <ShieldAlert size={14} className="shrink-0 text-saffron-600" />
              <span>Request exceeds ₹50 Lakhs. Requires State Government approval escalation after DM review.</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-leaf-50 border border-leaf-200 text-[11.5px] text-leaf-800 flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0 text-leaf-600" />
              <span>Within DM delegated sanctioning limit (≤ ₹50 Lakhs).</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="envClearance"
              checked={form.envClearance}
              onChange={(e) => setForm((f) => ({ ...f, envClearance: e.target.checked }))}
              className="accent-ink-900 rounded"
            />
            <label htmlFor="envClearance" className="text-[12px] text-ink-700 font-medium cursor-pointer">
              Environmental & Land Acquisition clearance preliminary check completed
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
