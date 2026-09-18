// Escalate Issue — workflow for sending facility issues to district administration.
// Uses the real complaint escalation API: POST /api/complaints/{id}/escalate/
// If no linked complaint exists, shows appropriate message.

import { useState, useCallback, useMemo } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useUiStore } from '../../../app/store/uiStore'
import { useEscalateComplaint } from '../dmSchedule/hooks/useEscalationMutation'
import FacilityActionSummary from './FacilityActionSummary'
import ActionSuccessModal from './ActionSuccessModal'
import { PRIORITY_BAND_TONES } from './constants'
import { validateEscalation, hasErrors } from './facilityActionValidation'
import { buildEscalationReason } from './facilityActionMapper'

const emptyForm = () => ({
  reason: '',
  additionalMessage: '',
})

export default function EscalateIssueModal({ open, onClose, facility }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [result, setResult] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const pushToast = useUiStore((s) => s.pushToast)
  const escalateMutation = useEscalateComplaint()

  const defaultReason = useMemo(() => buildEscalationReason(facility), [facility])

  const linkedComplaintId = facility?.linkedComplaintId || facility?.linkedComplaint || null

  const handleClose = useCallback(() => {
    setForm(emptyForm)
    setErrors({})
    setResult(null)
    setConfirmed(false)
    onClose()
  }, [onClose])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const reason = form.reason || defaultReason

    if (!linkedComplaintId) {
      setErrors({ submit: 'Escalation requires a linked complaint record. This facility does not have an associated complaint.' })
      return
    }

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
    escalateMutation.mutate(
      { complaintId: linkedComplaintId, reason },
      {
        onSuccess: (data) => {
          setResult(data)
          pushToast('Issue escalated to district administration successfully.', 'success')
        },
        onError: (error) => {
          const msg = error?.message || 'Failed to escalate issue.'
          setErrors({ submit: msg })
          pushToast(msg, 'error')
        },
      }
    )
  }, [facility, form, defaultReason, linkedComplaintId, confirmed, escalateMutation, pushToast])

  const patch = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined, submit: undefined }))
    setConfirmed(false)
  }, [])

  if (!open) return null

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

  const noLinkedComplaint = !linkedComplaintId

  return (
    <Modal open onClose={handleClose} title="Escalate to District Administration" width="max-w-xl" footer={
      <>
        <Button size="sm" variant="ghost" onClick={handleClose} disabled={escalateMutation.isPending}>Cancel</Button>
        <Button
          size="sm"
          variant={confirmed ? 'danger' : 'primary'}
          loading={escalateMutation.isPending}
          disabled={escalateMutation.isPending || noLinkedComplaint}
          onClick={handleSubmit}
        >
          {escalateMutation.isPending ? 'Submitting escalation...' : confirmed ? 'Confirm Escalation' : 'Escalate'}
        </Button>
      </>
    }>
      <div className="space-y-5">
        <FacilityActionSummary facility={facility} />

        <p className="text-[12.5px] text-ink-500">
          Send this facility issue to district administration for attention.
        </p>

        {noLinkedComplaint && (
          <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 px-4 py-3">
            <p className="text-[12.5px] text-saffron-800 font-medium">
              This facility does not have a linked complaint record.
            </p>
            <p className="text-[11.5px] text-saffron-600 mt-1">
              Escalation requires an existing complaint. Please register a complaint for this facility first, or use the Propose Intervention action instead.
            </p>
          </div>
        )}

        {errors.submit && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-700">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="escalation-form">
          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Why is this being escalated?</label>
            <textarea
              value={form.reason || defaultReason}
              onChange={(e) => patch('reason', e.target.value)}
              rows={2}
              placeholder="Describe the reason for escalation..."
              disabled={noLinkedComplaint}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none disabled:opacity-50"
            />
            {errors.reason && <p className="text-[11.5px] text-alert-600">{errors.reason}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[12.5px] font-semibold text-ink-900">Additional remarks</label>
            <textarea
              value={form.additionalMessage}
              onChange={(e) => patch('additionalMessage', e.target.value)}
              rows={2}
              placeholder="Any additional context for district administration (optional)"
              disabled={noLinkedComplaint}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 resize-none disabled:opacity-50"
            />
          </div>

          {facility?.priority && (
            <div className="space-y-1">
              <label className="text-[12.5px] font-semibold text-ink-900">System priority</label>
              <Badge tone={PRIORITY_BAND_TONES[facility.priority.band] || 'neutral'} dot>
                {facility.priority.band} — {facility.priority.bandLabel}
              </Badge>
            </div>
          )}

          {confirmed && !noLinkedComplaint && (
            <div className="rounded-xl border border-saffron-200 bg-saffron-50/60 px-4 py-3">
              <p className="text-[12.5px] text-saffron-800 font-medium">
                This issue will be escalated to district administration.
              </p>
              <p className="text-[11.5px] text-saffron-600 mt-1">
                Complaint ID: {linkedComplaintId}
              </p>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
