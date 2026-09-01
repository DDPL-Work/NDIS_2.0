// Propose Intervention Ã¢â‚¬â€ complete workflow for creating a DPR/proposal.
// Facility-type agnostic. Uses existing backendProposalApi.
// No fabricated data. No hardcoded facility-specific logic.

import { useState, useCallback, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import { useUiStore } from '../../../app/store/uiStore'
import FacilityActionSummary from './FacilityActionSummary'
import ActionSuccessModal from './ActionSuccessModal'
import { INTERVENTION_CATEGORIES, TIMELINE_OPTIONS, PRIORITY_BAND_LABELS } from './constants'
import { validateProposal, hasErrors } from './facilityActionValidation'
import { buildProblemStatement } from './facilityActionMapper'
import { createProposal, checkExistingActions } from './facilityActionService'

const emptyForm = () => ({
  interventionType: '',
  description: '',
  estimatedCost: '',
  timeline: '30',
})

export default function ProposeInterventionModal({ open, onClose, facility }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [existingProposal, setExistingProposal] = useState(null)
  const pushToast = useUiStore((s) => s.pushToast)

  // Pre-populate from facility data when modal opens
  const defaultDescription = useMemo(() => buildProblemStatement(facility), [facility])

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setErrors({})
    setResult(null)
    setExistingProposal(null)
    setSubmitting(false)
    onClose()
  }, [onClose])

  const handleUseRecommended = useCallback(() => {
    if (facility?.recommendedAction) {
      setForm((f) => ({ ...f, description: facility.recommendedAction }))
      setErrors((e) => ({ ...e, description: undefined }))
    }
  }, [facility])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const validationErrors = validateProposal(form)
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const response = await createProposal({ facility, form })
      if (response.success) {
        setResult(response.data)
        pushToast('Intervention proposal created successfully.', 'success')
      } else {
        setErrors({ submit: response.error })
        pushToast(response.error || 'Failed to create proposal.', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }, [facility, form, pushToast])

  const patch = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, submit: undefined }))
  }, [])

  if (!open) return null

  // Success state
  if (result) {
    return (
      <Modal open onClose={handleClose} title="Intervention Proposal" width="max-w-lg">
        <ActionSuccessModal
          actionType="propose"
          result={result}
          facility={facility}
          onClose={handleClose}
        />
      </Modal>
    )
  }

  return (
    <Modal open onClose={handleClose} title="Propose Intervention" width="max-w-xl" footer={
      <>
        <Button size="sm" variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button size="sm" variant="primary" loading={submitting} disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Creating proposal...' : 'Create Intervention Proposal'}
        </Button>
      </>
    }>
      <div className="space-y-5">
        {/* Facility summary */}
        <FacilityActionSummary facility={facility} />

        {/* Existing proposal warning */}
        {existingProposal && (
          <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 px-4 py-3">
            <p className="text-[12.5px] text-saffron-800 font-medium">
              An intervention proposal is already under review for this facility.
            </p>
            <p className="text-[11.5px] text-saffron-600 mt-1">
              Proposal ID: {existingProposal.proposalId || existingProposal.id}
            </p>
          </div>
        )}

        {/* Submit error */}
        {errors.submit && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="proposal-form">
          {/* Section 1: What needs to be done? */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">What needs to be done?</label>
            <Select
              value={form.interventionType}
              onChange={(v) => patch('interventionType', v)}
              options={[{ value: '', label: 'Select intervention type...' }, ...INTERVENTION_CATEGORIES]}
              className="w-full"
            />
            {errors.interventionType && <p className="text-[11.5px] text-alert-600">{errors.interventionType}</p>}
          </div>

          {/* Section 2: Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-semibold text-ink-900">What needs to be done?</label>
              {facility?.recommendedAction && (
                <button type="button" onClick={handleUseRecommended} className="text-[11.5px] text-sky-600 hover:text-sky-800 font-medium">
                  Use recommended action
                </button>
              )}
            </div>
            <textarea
              value={form.description}
              onChange={(e) => patch('description', e.target.value)}
              rows={3}
              placeholder="Describe the intervention needed..."
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none"
            />
            {errors.description && <p className="text-[11.5px] text-alert-600">{errors.description}</p>}
          </div>

          {/* Section 3: Priority (read-only) */}
          {facility?.priority && (
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-ink-900">System priority</label>
              <div className="flex items-center gap-2">
                <Badge tone={facility.priority.band === 'P1' ? 'negative' : facility.priority.band === 'P2' ? 'warning' : 'info'} dot>
                  {facility.priority.band} Ã¢â‚¬â€ {facility.priority.bandLabel}
                </Badge>
                {facility.priority.score != null && (
                  <span className="text-[12px] text-ink-500">Score: {facility.priority.score}</span>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Estimated requirement */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12.5px] font-semibold text-ink-900">Estimated cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-400">Ã¢â€šÂ¹</span>
                <input
                  type="number"
                  min={0}
                  value={form.estimatedCost}
                  onChange={(e) => patch('estimatedCost', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-ink-200 bg-white pl-7 pr-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                />
              </div>
              {errors.estimatedCost && <p className="text-[11.5px] text-alert-600">{errors.estimatedCost}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[12.5px] font-semibold text-ink-900">Expected timeline</label>
              <Select
                value={form.timeline}
                onChange={(v) => patch('timeline', v)}
                options={TIMELINE_OPTIONS}
                className="w-full"
              />
            </div>
          </div>

          {/* Section 5: Supporting information */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Supporting evidence</label>
            <div className="rounded-lg border border-ink-100 divide-y divide-ink-100 text-[12px]">
              {facility?.gapScore != null && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-ink-500">Gap score</span>
                  <span className="text-ink-800 font-medium">{Math.round(facility.gapScore * 100)}%</span>
                </div>
              )}
              {facility?.hazardSafe != null && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-ink-500">Hazard status</span>
                  <span className="text-ink-800 font-medium">{facility.hazardSafe ? 'Safe' : 'At risk'}</span>
                </div>
              )}
              {facility?.district && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-ink-500">Location</span>
                  <span className="text-ink-800 font-medium">{[facility.village, facility.block, facility.district].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {facility?.category && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-ink-500">Facility type</span>
                  <span className="text-ink-800 font-medium">{facility.category}</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
