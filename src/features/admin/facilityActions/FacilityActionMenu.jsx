// Facility action menu Ã¢â‚¬â€ the 3 clear decision options for any facility.
// Replaces raw action buttons with a contextual, plain-language interface.
// Facility-type agnostic Ã¢â‚¬â€ uses whatever data the backend provides.

import { useState, useEffect } from 'react'
import { ClipboardList, Calendar, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import { ACTION_TYPES, ACTION_LABELS, ACTION_DESCRIPTIONS, PRIORITY_BAND_TONES } from './constants'
import { checkExistingActions } from './facilityActionService'

const ACTION_ICONS = {
  [ACTION_TYPES.PROPOSE]: ClipboardList,
  [ACTION_TYPES.INSPECT]: Calendar,
  [ACTION_TYPES.ESCALATE]: ShieldAlert,
}

const ACTION_VARIANTS = {
  [ACTION_TYPES.PROPOSE]: 'primary',
  [ACTION_TYPES.INSPECT]: 'outline',
  [ACTION_TYPES.ESCALATE]: 'outline',
}

export default function FacilityActionMenu({ facility, onSelectAction }) {
  const [existingActions, setExistingActions] = useState(null)

  useEffect(() => {
    if (!facility?.id) return
    let cancelled = false
    checkExistingActions(facility.id).then((result) => {
      if (!cancelled) setExistingActions(result)
    })
    return () => { cancelled = true }
  }, [facility?.id])

  if (!facility) return null

  const actions = [
    ACTION_TYPES.PROPOSE,
    ACTION_TYPES.INSPECT,
    ACTION_TYPES.ESCALATE,
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-ink-900">What would you like to do?</h3>
        {facility.priority && (
          <Badge tone={PRIORITY_BAND_TONES[facility.priority.band] || 'neutral'} dot>
            {facility.priority.band} Ã¢â‚¬â€ {facility.priority.bandLabel}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {actions.map((actionType) => {
          const Icon = ACTION_ICONS[actionType]
          const isPropose = actionType === ACTION_TYPES.PROPOSE
          const hasExisting = isPropose && existingActions?.hasOpenProposal

          return (
            <button
              key={actionType}
              onClick={() => onSelectAction(actionType)}
              className="w-full text-left rounded-xl border border-ink-200 bg-white p-4 transition-all hover:border-ink-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 group"
            >
              <div className="flex items-start gap-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isPropose ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 group-hover:bg-ink-200'}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13.5px] font-semibold text-ink-900">{ACTION_LABELS[actionType]}</h4>
                    {hasExisting && (
                      <Badge tone="info" dot>Proposal exists</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-500 mt-0.5">{ACTION_DESCRIPTIONS[actionType]}</p>
                </div>
                <ArrowRight size={14} className="text-ink-300 mt-1 shrink-0 group-hover:text-ink-600 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
