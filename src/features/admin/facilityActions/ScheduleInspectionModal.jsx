// Schedule Field Inspection — workflow for arranging a field visit.
// Uses TanStack Query mutation hooks. No fabricated data.

import { useState, useCallback, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import { useUiStore } from '../../../app/store/uiStore'
import { useCreateInspection } from '../dmSchedule/hooks/useInspectionMutations'
import FacilityActionSummary from './FacilityActionSummary'
import ActionSuccessModal from './ActionSuccessModal'
import { validateInspection, hasErrors } from './facilityActionValidation'
import { buildInspectionPurpose } from './facilityActionMapper'

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
  const [result, setResult] = useState(null)
  const pushToast = useUiStore((s) => s.pushToast)
  const createInspection = useCreateInspection()

  const defaultPurpose = useMemo(() => buildInspectionPurpose(facility), [facility])

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setErrors({})
    setResult(null)
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
    const payload = {
      title: `Inspection — ${facility.name}`,
      location_name: [facility.village, facility.block, facility.district].filter(Boolean).join(', '),
      department_code: facility.departmentId || facility.department || '',
      inspection_purpose: purpose,
      preferred_date: form.preferredDate || null,
      scheduled_date: form.preferredDate || null,
      inspection_team: form.team || '',
      inspector_name: '',
      instructions: form.notes || '',
      remarks: '',
    }
    createInspection.mutate(payload, {
      onSuccess: (data) => {
        setResult(data)
        pushToast('Field inspection scheduled successfully.', 'success')
      },
      onError: (error) => {
        const msg = error?.message || 'Failed to schedule inspection.'
        setErrors({ submit: msg })
        pushToast(msg, 'error')
      },
    })
  }, [facility, form, defaultPurpose, createInspection, pushToast])

  const patch = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, submit: undefined }))
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const submitting = createInspection.isPending

  if (!open) return null

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
        <FacilityActionSummary facility={facility} />
        <p className="text-[12.5px] text-ink-500">
          Arrange a field visit to verify the situation at this facility.
        </p>

        {errors.submit && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="inspection-form">
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

          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Inspection team</label>
            <Select
              value={form.team}
              onChange={(v) => patch('team', v)}
              options={TEAM_OPTIONS}
              className="w-full"
            />
          </div>

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
