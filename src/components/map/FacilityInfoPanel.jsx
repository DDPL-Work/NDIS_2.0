// FacilityInfoPanel — right-side facility inspection panel shared by the
// Executive GIS (SituationMatrix) and the role-aware Citizen GIS for
// administrative roles (DM/ADM/Executive/Department Officer).  Data comes
// exclusively from backend-mapped facility fields + grievance API.
// NOW WITH: Facility action workflows (propose, inspect, escalate).
import { useState } from 'react'
import { X, MapPin, AlertTriangle, ShieldCheck, ClipboardCheck, ArrowRight } from 'lucide-react'
import GapScoreRing from '../ui/GapScoreRing'
import StatusBadge from '../ui/StatusBadge'
import Badge from '../ui/Badge'
import { formatDate } from '../../utils/format'
import { mapFacilityForAction, mapPriorityForAction } from '../../features/admin/facilityActions/facilityActionMapper'
import FacilityActionMenu from '../../features/admin/facilityActions/FacilityActionMenu'
import ProposeInterventionModal from '../../features/admin/facilityActions/ProposeInterventionModal'
import ScheduleInspectionModal from '../../features/admin/facilityActions/ScheduleInspectionModal'
import EscalateIssueModal from '../../features/admin/facilityActions/EscalateIssueModal'

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-ink-500 shrink-0">{label}</span>
      <span className="text-ink-800 font-medium text-right">{children}</span>
    </div>
  )
}

export default function FacilityInfoPanel({ facility, grievances = [], onClose, onOpenGrievance, department }) {
  const [showActions, setShowActions] = useState(false)
  const [activeWorkflow, setActiveWorkflow] = useState(null)

  if (!facility) return null

  const normalizedFacility = mapFacilityForAction(facility)
  const normalizedPriority = mapPriorityForAction(facility.priority || facility)

  return (
    <>
      <div className="w-full max-w-[360px] shrink-0 card overflow-y-auto animate-slide-in-right shadow-xl">
        <div className="flex items-start justify-between p-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-ink-950 leading-snug truncate">{facility.name}</h3>
            <p className="text-[12px] text-ink-500 mt-0.5 truncate">{facility.categoryLabel}</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 ml-2 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Gap score ring */}
          <div className="flex items-center gap-4">
            <GapScoreRing score={facility.gapScore} size={64} strokeWidth={7} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Gap score</p>
              <p className="text-[13px] font-semibold text-ink-900 mt-0.5">
                {facility.gapScore >= 0.66 ? 'High deficit' : facility.gapScore >= 0.33 ? 'Moderate' : 'Well served'}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-[12.5px]">
            <Row label="Status"><StatusBadge status={facility.status} /></Row>
            <Row label="Department">
              <span className="flex items-center gap-1.5">
                {department && (
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: department.color }} />
                )}
                {department?.label || facility.departmentName || '—'}
              </span>
            </Row>
            <Row label="Village">{facility.village || '—'}</Row>
            <Row label="Block">{facility.raw?.block_name || facility.village || '—'}</Row>
            <Row label="Geo-tagged">
              <span className={facility.position ? 'text-leaf-600 font-medium' : 'text-ink-400'}>
                {facility.position ? '✓ Yes' : 'No'}
              </span>
            </Row>
            <Row label="Last inspection">
              {facility.lastInspectionAt ? formatDate(facility.lastInspectionAt) : (
                <span className="text-ink-400">Never</span>
              )}
            </Row>
            <Row label="Hazard">
              {facility.hazardSafe === true ? (
                <span className="inline-flex items-center gap-1 text-leaf-600 font-medium"><ShieldCheck size={12} /> Safe</span>
              ) : facility.hazardSafe === false ? (
                <span className="inline-flex items-center gap-1 text-alert-600 font-medium"><AlertTriangle size={12} /> At risk</span>
              ) : (
                <span className="text-ink-400">—</span>
              )}
            </Row>
          </div>

          {/* Open grievances */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2 flex items-center gap-1.5">
              <ClipboardCheck size={11} /> Open complaints
            </p>
            {!grievances || grievances.length === 0 ? (
              <p className="text-[12px] text-ink-400">No open complaints</p>
            ) : (
              <div className="space-y-1.5">
                {grievances.slice(0, 3).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onOpenGrievance?.(g)}
                    className="w-full flex items-center justify-between text-[12px] bg-alert-50 rounded-lg px-2.5 py-1.5 text-left"
                  >
                    <span className="text-ink-700 truncate">{g.title}</span>
                    <StatusBadge status={g.state} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates */}
          {facility.position && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-1 flex items-center gap-1.5">
                <MapPin size={11} /> Coordinates
              </p>
              <p className="kbd-mono text-[11px] text-ink-600">
                {facility.position[1].toFixed(5)}°N, {facility.position[0].toFixed(5)}°E
              </p>
            </div>
          )}

          {/* Action toggle */}
          <div className="pt-2 border-t border-ink-100">
            {!showActions ? (
              <button
                onClick={() => setShowActions(true)}
                className="w-full flex items-center justify-between rounded-xl border border-ink-200 bg-white p-3 text-left hover:border-ink-300 hover:shadow-sm transition group"
              >
                <div>
                  <p className="text-[13px] font-semibold text-ink-900">Take action</p>
                  <p className="text-[11.5px] text-ink-500">Propose intervention, schedule inspection, or escalate</p>
                </div>
                <ArrowRight size={14} className="text-ink-300 group-hover:text-ink-600 transition-colors" />
              </button>
            ) : (
              <FacilityActionMenu
                facility={normalizedFacility}
                onSelectAction={(actionType) => setActiveWorkflow(actionType)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Action modals */}
      <ProposeInterventionModal
        open={activeWorkflow === 'propose'}
        onClose={() => setActiveWorkflow(null)}
        facility={{ ...normalizedFacility, priority: normalizedPriority }}
      />
      <ScheduleInspectionModal
        open={activeWorkflow === 'inspect'}
        onClose={() => setActiveWorkflow(null)}
        facility={{ ...normalizedFacility, priority: normalizedPriority }}
      />
      <EscalateIssueModal
        open={activeWorkflow === 'escalate'}
        onClose={() => setActiveWorkflow(null)}
        facility={{ ...normalizedFacility, priority: normalizedPriority }}
      />
    </>
  )
}
