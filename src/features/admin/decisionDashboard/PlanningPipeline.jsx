import { useState } from 'react'
import { ChevronRight, FolderGit2 } from 'lucide-react'
import clsx from 'clsx'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import StatusBadge from '../../../components/ui/StatusBadge'
import { formatCurrencyINR } from '../../../utils/format'

// Section F — the planning pipeline.  Priority → Intervention → DPR → Budget →
// Sanction → Execution → Monitoring.  Every stage is a live count drawn from
// the proposals collection; clicking a stage opens the proposals in it.
export default function PlanningPipeline({ pipeline, onOpenProposal, loadedAt }) {
  const [openStage, setOpenStage] = useState(null)
  const stages = pipeline || []
  const total = stages.reduce((sum, stage) => sum + stage.count, 0)

  return (
    <SectionCard
      id="planning-pipeline"
      title="Planning pipeline"
      subtitle={`${total} proposals in flight across the district's intervention pipeline.`}
      foot={<Provenance source="GET /api/proposals/" definition="Proposals bucketed by backend status. 'Priority' = urgent/high in draft/review/approved; 'Intervention' = complaint-linked." updatedAt={loadedAt} />}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {stages.map((stage, index) => (
          <button
            key={stage.key}
            onClick={() => setOpenStage(stage)}
            className={clsx(
              'group rounded-xl border p-3 text-left transition hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
              stage.count > 0 ? 'border-ink-200 bg-white hover:border-ink-300' : 'border-ink-100 bg-ink-50/40 opacity-70'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{stage.label}</span>
              <ChevronRight size={12} className="text-ink-300 group-hover:text-ink-600" />
            </div>
            <p className="mt-1 text-2xl font-display font-semibold text-ink-950">{stage.count}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-400 leading-snug line-clamp-2">{stage.hint}</p>
            {index < stages.length - 1 && <span className="sr-only">→</span>}
          </button>
        ))}
      </div>

      <Modal open={Boolean(openStage)} onClose={() => setOpenStage(null)} title={openStage ? `${openStage.label} (${openStage.count})` : ''}>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          <p className="text-[12px] text-ink-500 mb-2">{openStage?.hint}</p>
          {!openStage?.items?.length ? (
            <p className="text-[13px] text-ink-400 py-6 text-center">No proposals in this stage.</p>
          ) : (
            openStage.items.map((proposal) => (
              <button
                key={proposal.proposalId}
                onClick={() => { onOpenProposal?.(proposal); setOpenStage(null) }}
                className="w-full flex items-start justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3 text-left hover:bg-ink-50"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink-900 leading-snug">{proposal.title}</p>
                  <p className="text-[11.5px] text-ink-500 mt-0.5">
                    {proposal.departmentName || 'Department'} · {proposal.village || proposal.block || 'Location not tagged'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={proposal.status} />
                    <Badge tone="ink" className="kbd-mono text-[10.5px]">
                      {proposal.estimatedCost ? formatCurrencyINR(proposal.estimatedCost) : 'cost not stated'}
                    </Badge>
                  </div>
                </div>
                <FolderGit2 size={15} className="text-ink-300 shrink-0 mt-0.5" />
              </button>
            ))
          )}
        </div>
      </Modal>
    </SectionCard>
  )
}