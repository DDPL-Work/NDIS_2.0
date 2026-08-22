import { X, Users, Building2, Lightbulb, ClipboardList, FolderGit2 } from 'lucide-react'
import GapScoreRing from '../../../components/ui/GapScoreRing'
import StatusBadge from '../../../components/ui/StatusBadge'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { isOpenComplaint } from './priorityScoring'
import { formatCurrencyINR } from '../../../utils/format'

const TYPE_META = {
  facility_gap: { label: 'Facility gap', tone: 'alert' },
  complaint_hotspot: { label: 'Citizen hotspot', tone: 'saffron' },
  planning: { label: 'Planning pressure', tone: 'sky' },
}

function EvidenceRow({ title, onOpen }) {
  return (
    <button onClick={onOpen} className="w-full flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-ink-50/40 px-2.5 py-1.5 text-left text-[12px] hover:bg-ink-50">
      <span className="text-ink-700 truncate">{title}</span>
      <span className="text-sky-700 shrink-0 font-medium">Open →</span>
    </button>
  )
}

// Decision detail panel — explains WHY a location is a priority: the score, its
// components, the evidence that produced it, the department owner and the
// concrete next action.  All values are traced to backend collections.
export default function PriorityDetailPanel({ area, complaints = [], proposals = [], deptMap = {}, onOpenComplaint, onOpenProposal, onClose }) {
  if (!area) return null
  const meta = TYPE_META[area.type] || TYPE_META.facility_gap

  const linkedComplaints = (() => {
    if (!area) return []
    if (area.complaintIds?.length) {
      return (complaints || []).filter((c) => area.complaintIds.includes(String(c.id)))
    }
    if (area.village) {
      return (complaints || []).filter((c) => String(c.location?.village || '').toLowerCase() === String(area.village).toLowerCase() && isOpenComplaint(c))
    }
    return []
  })()

  const linkedProposals = (() => {
    if (!area) return []
    if (area.proposalIds?.length) return (proposals || []).filter((p) => area.proposalIds.includes(p.proposalId))
    if (area.village) return (proposals || []).filter((p) => String(p.village || '').toLowerCase() === String(area.village).toLowerCase() && String(p.status) !== 'completed')
    return []
  })()

  const department = area.departmentId ? deptMap[area.departmentId] : null

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Badge tone={meta.tone} className="mb-1.5">{meta.label}</Badge>
          <h3 className="text-[14px] font-semibold text-ink-950 leading-snug">{area.title}</h3>
          {area.village && <p className="text-[12px] text-ink-500 mt-0.5">{area.village}{area.block && area.block !== area.village ? `, ${area.block}` : ''}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 ml-2 shrink-0">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Score + components */}
      <div className="flex items-start gap-4">
        <GapScoreRing score={area.score} size={64} strokeWidth={7} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1">Why is this a priority?</p>
          <div className="space-y-1">
            {area.scoreComponents?.map((component) => (
              <div key={component.label} className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="text-ink-500 shrink-0">{component.label}</span>
                <span className="text-ink-800 font-semibold text-right">{component.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Affected population + department */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-ink-100 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 uppercase tracking-wide"><Users size={11} /> Affected population</p>
          <p className="text-[13px] font-semibold text-ink-900 mt-1">
            {area.affectedPopulation != null ? Number(area.affectedPopulation).toLocaleString('en-IN') : 'Not available'}
          </p>
        </div>
        <div className="rounded-lg border border-ink-100 p-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 uppercase tracking-wide"><Building2 size={11} /> Department</p>
          <p className="text-[13px] font-semibold text-ink-900 mt-1 flex items-center gap-1.5">
            {department && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: department.color }} />}
            {area.departmentName || department?.label || '—'}
          </p>
        </div>
      </div>

      {/* Recommended action */}
      <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 mb-1"><Lightbulb size={11} /> Recommended action</p>
        <p className="text-[12.5px] text-ink-800 leading-snug">{area.recommendedAction}</p>
        <p className="text-[10.5px] text-ink-400 mt-1.5">System suggestion derived from the evidence below — final decision rests with the DM.</p>
      </div>

      {/* Evidence */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2 flex items-center gap-1.5"><ClipboardList size={11} /> Evidence · citizen-reported</p>
        {!linkedComplaints.length ? (
          <p className="text-[12px] text-ink-400">No open complaints at this location.</p>
        ) : (
          <div className="space-y-1.5">
            {linkedComplaints.slice(0, 5).map((complaint) => (
              <div key={complaint.id} className="flex items-center justify-between gap-2">
                <EvidenceRow title={complaint.title || complaint.ticketNumber} onOpen={() => onOpenComplaint?.(complaint)} />
                <StatusBadge status={complaint.state} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing intervention */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2 flex items-center gap-1.5"><FolderGit2 size={11} /> Existing intervention</p>
        {!linkedProposals.length ? (
          <p className="text-[12px] text-ink-400">No active proposal/project recorded for this location.</p>
        ) : (
          <div className="space-y-1.5">
            {linkedProposals.slice(0, 4).map((proposal) => (
              <button key={proposal.proposalId} onClick={() => onOpenProposal?.(proposal)} className="w-full flex items-center justify-between gap-2 rounded-lg border border-ink-100 bg-ink-50/40 px-2.5 py-1.5 text-left text-[12px] hover:bg-ink-50">
                <div className="min-w-0">
                  <p className="text-ink-800 font-medium truncate">{proposal.title}</p>
                  <p className="text-ink-400 text-[11px]">{proposal.statusDisplay || String(proposal.status).replace(/_/g, ' ')} · {proposal.estimatedCost ? formatCurrencyINR(proposal.estimatedCost) : 'cost not stated'}</p>
                </div>
                <Button size="xs" variant="outline">Open</Button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}