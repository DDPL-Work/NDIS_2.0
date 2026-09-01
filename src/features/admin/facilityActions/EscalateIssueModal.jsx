// Escalate Issue Ã¢â‚¬â€ workflow for sending facility issues to district administration.
// Intentionally simpler than the DPR workflow.
// Facility-type agnostic. No fabricated data.

import { useState, useCallback, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useUiStore } from '../../../app/store/uiStore'
import FacilityActionSummary from './FacilityActionSummary'
import ActionSuccessModal from './ActionSuccessModal'
import { PRIORITY_BAND_TONES } from './constants'
import { validateEscalation, hasErrors } from './facilityActionValidation'
import { buildEscalationReason } from './facilityActionMapper'
import { escalateIssue } from './facilityActionService'

const emptyForm = () => ({
  reason: '',
  additionalMessage: '',
})

export default function EscalateIssueModal({ open, onClose, facility }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const pushToast = useUiStore((s) => s.pushToast)

  const defaultReason = useMemo(() => buildEscalationReason(facility), [facility])

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setErrors({})
    setResult(null)
    setConfirmed(false)
    setSubmitting(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const reason = form.reason || defaultReason
    const validationErrors = validateEscalation({ ...form, reason })
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors)
      return
    }
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const response = await escalateIssue({ facility, form: { ...form, reason } })
      if (response.success) {
        setResult(response.data)
        pushToast('Issue escalated to district administration successfully.', 'success')
      } else {
        setErrors({ submit: response.error })
        pushToast(response.error || 'Failed to escalate issue.', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }, [facility, form, defaultReason, confirmed, pushToast])

  const patch = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, submit: undefined }))
    setConfirmed(false)
  }, [])

  if (!open) return null

  // Success state
  if (result) {
    return (
      <Modal open onClose={handleClose} title="Escalate Issue" width="max-w-lg">
        <ActionSuccessModal
          actionType="escalate"
          result={result}
          facility={facility}
          onClose={handleClose}
        />
      </Modal>
    )
  }

  return (
    <Modal open onClose={handleClose} title="Escalate Issue" width="max-w-xl" footer={
      <>
        <Button size="sm" variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button
          size="sm"
          variant={confirmed ? 'danger' : 'primary'}
          loading={submitting}
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting escalation...' : confirmed ? 'Confirm Escalation' : 'Escalate Issue'}
        </Button>
      </>
    }>
      <div className="space-y-5">
        {/* Facility summary */}
        <FacilityActionSummary facility={facility} />

        <p className="text-[12.5px] text-ink-500">
          Send this facility issue to district administration for attention.
        </p>

        {/* Submit error */}
        {errors.submit && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="escalation-form">
          {/* Why is this being escalated? */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Why is this being escalated?</label>
            <textarea
              value={form.reason || defaultReason}
              onChange={(e) => patch('reason', e.target.value)}
              rows={2}
              placeholder="Describe the reason for escalation..."
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none"
            />
            {errors.reason && <p className="text-[11.5px] text-alert-600">{errors.reason}</p>}
          </div>

          {/* Additional message */}
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Additional message</label>
            <textarea
              value={form.additionalMessage}
              onChange={(e) => patch('additionalMessage', e.target.value)}
              rows={2}
              placeholder="Any additional context for district administration (optional)"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none"
            />
          </div>

          {/* Priority display */}
          {facility?.priority && (
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-ink-900">System priority</label>
              <Badge tone={PRIORITY_BAND_TONES[facility.priority.band] || 'neutral'} dot>
                {facility.priority.band} Ã¢â‚¬â€ {facility.priority.bandLabel}
              </Badge>
            </div>
          )}

          {/* Confirmation prompt */}
          {confirmed && (
            <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 px-4 py-3">
              <p className="text-[12.5px] text-saffron-800 font-medium">
                You are about to escalate this issue to district administration.
              </p>
              <p className="text-[11.5px] text-saffron-600 mt-1">
                This action will notify the district administration team.
              </p>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
