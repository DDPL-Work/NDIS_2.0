// Schedule Field Inspection Ã¢â‚¬â€ workflow for arranging a field visit.
// Facility-type agnostic. Uses the project engine store for local scheduling.
// No fabricated data. No hardcoded facility-specific logic.

import { useState, useCallback, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import { useUiStore } from '../../../app/store/uiStore'
import FacilityActionSummary from './FacilityActionSummary'
import ActionSuccessModal from './ActionSuccessModal'
import { validateInspection, hasErrors } from './facilityActionValidation'
import { buildInspectionPurpose } from './facilityActionMapper'
import { scheduleInspection } from './facilityActionService'

const emptyForm = () => ({
  purpose: '',
  preferredDate: '',
  team: '',
  notes: '',
})

const TEAM_OPTIONS = [
  { value: '', label: 'Select team...' },
  { value: 'field_inspection', label: 'Field Inspection Team' },
  { value: 'technical', label: 'Technical Team' },
  { value: 'joint', label: 'Joint Inspection Team' },
]

export default function ScheduleInspectionModal({ open, onClose, facility }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const pushToast = useUiStore((s) => s.pushToast)

  const defaultPurpose = useMemo(() => buildInspectionPurpose(facility), [facility])

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setErrors({})
    setResult(null)
    setSubmitting(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const purpose = form.purpose || defaultPurpose
    const validationErrors = validateInspection({ ...form, purpose })
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const response = await scheduleInspection({ facility, form: { ...form, purpose } })
      if (response.success) {
        setResult(response.data)
        pushToast('Field inspection scheduled successfully.', 'success')
      } else {
        setErrors({ submit: response.error })
        pushToast(response.error || 'Failed to schedule inspection.', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }, [facility, form, defaultPurpose, pushToast])

  const patch = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, submit: undefined }))
  }, [])

  // Get today's date for min date validation
  const today = new Date().toISOString().split('T')[0]

  if (!open) return null

  // Success state
  if (result) {
    return (
      <Modal open onClose={handleClose} title="Schedule Field Inspection" width="max-w-lg">
        <ActionSuccessModal
          actionType="inspect"
          result={result}
          facility={facility}
          onClose={handleClose}
        />
      </Modal>
    )
  }

  return (
    <Modal open onClose={handleClose} title="Schedule Field Inspection" width="max-w-xl" footer={
      <>
        <Button size="sm" variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button size="sm" variant="primary" loading={submitting} disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Scheduling inspection...' : 'Schedule Inspection'}
        </Button>
      </>
    }>
      <div className="space-y-5">
        {/* Facility summary */}
        <FacilityActionSummary facility={facility} />

        <p className="text-[12.5px] text-ink-500">
          Arrange a field visit to verify the situation at this facility.
        </p>

        {/* Submit error */}
        {errors.submit && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="inspection-form">
          {/* Section 1: Purpose */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Inspection purpose</label>
            <textarea
              value={form.purpose || defaultPurpose}
              onChange={(e) => patch('purpose', e.target.value)}
              rows={2}
              placeholder="What should the field team verify?"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none"
            />
            {errors.purpose && <p className="text-[11.5px] text-alert-600">{errors.purpose}</p>}
          </div>

          {/* Section 2: Date */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Preferred date</label>
            <input
              type="date"
              min={today}
              value={form.preferredDate}
              onChange={(e) => patch('preferredDate', e.target.value)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
            />
            {errors.preferredDate && <p className="text-[11.5px] text-alert-600">{errors.preferredDate}</p>}
          </div>

          {/* Section 3: Team */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Inspection team</label>
            <Select
              value={form.team}
              onChange={(v) => patch('team', v)}
              options={TEAM_OPTIONS}
              className="w-full"
            />
          </div>

          {/* Section 4: Notes */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Instructions / notes for field team</label>
            <textarea
              value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
              rows={2}
              placeholder="Any specific instructions for the field team (optional)"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none"
            />
          </div>
        </form>
      </div>
    </Modal>
  )
}
