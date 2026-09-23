// Propose Intervention — complete workflow for creating a DPR/proposal.
// Uses TanStack Query mutation hooks. No fabricated data.

import { useState, useCallback, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'
import { useUiStore } from '../../../app/store/uiStore'
import { useCreateIntervention } from '../dmSchedule/hooks/useInterventionMutations'
import FacilityActionSummary from './FacilityActionSummary'
import ActionSuccessModal from './ActionSuccessModal'
import { INTERVENTION_CATEGORIES, TIMELINE_OPTIONS } from './constants'
import { validateProposal, hasErrors } from './facilityActionValidation'
import { buildProblemStatement } from './facilityActionMapper'
import { formatScorePercent } from '../../../utils/format'


const emptyForm = () => ({
  interventionType: '',
  description: '',
  estimatedCost: '',
  timeline: '30',
})

export default function ProposeInterventionModal({ open, onClose, facility }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const pushToast = useUiStore((s) => s.pushToast)
  const createIntervention = useCreateIntervention()

  const defaultDescription = useMemo(() => buildProblemStatement(facility), [facility])

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setErrors({})
    setResult(null)
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
const payload = {
        facility_name: facility.name,
        facility_type: facility.category || facility.categoryLabel || '',
        intervention_type: form.interventionType || '',
        description: form.description || '',
        estimated_cost: form.estimatedCost ? Number(form.estimatedCost) : null,
        expected_timeline: form.timeline || null,
        coverage_gap_score: facility.gapScore != null ? Math.round(facility.gapScore) : null,
      }
    createIntervention.mutate(payload, {
      onSuccess: (data) => {
        setResult(data)
        pushToast('Intervention proposal created successfully.', 'success')
      },
      onError: (error) => {
        const msg = error?.message || 'Failed to create proposal.'
        setErrors({ submit: msg })
        pushToast(msg, 'error')
      },
    })
  }, [facility, form, createIntervention, pushToast])

  const patch = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, submit: undefined }))
  }, [])

  if (!open) return null

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
        <Button size="sm" variant="ghost" onClick={handleClose} disabled={createIntervention.isPending}>Cancel</Button>
        <Button size="sm" variant="primary" loading={createIntervention.isPending} disabled={createIntervention.isPending} onClick={handleSubmit}>
          {createIntervention.isPending ? 'Creating proposal...' : 'Create Intervention Proposal'}
        </Button>
      </>
    }>
      <div className="space-y-5">
        <FacilityActionSummary facility={facility} />

        {errors.submit && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="proposal-form">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-semibold text-ink-900">Description</label>
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

          {facility?.priority && (
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-ink-900">System priority</label>
              <div className="flex items-center gap-2">
                <Badge tone={facility.priority.band === 'P1' ? 'negative' : facility.priority.band === 'P2' ? 'warning' : 'info'} dot>
                  {facility.priority.band} — {facility.priority.bandLabel}
                </Badge>
                {facility.priority.score != null && (
                  <span className="text-[12px] text-ink-500">Score: {facility.priority.score}</span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12.5px] font-semibold text-ink-900">Estimated cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-400">₹</span>
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

          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Supporting evidence</label>
            <div className="rounded-lg border border-ink-100 divide-y divide-ink-100 text-[12px]">
              {facility?.gapScore != null && (
                <div className="flex justify-between px-3 py-2">
                  <span className="text-ink-500">Gap score</span>
                  <span className="text-ink-800 font-medium">{formatScorePercent(facility.gapScore, 0)}</span>
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
