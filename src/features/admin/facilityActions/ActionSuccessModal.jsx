// Shared success confirmation shown after a successful action submission.
// Shows generated ID, status, facility, and next step.

import { CheckCircle2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'

export default function ActionSuccessModal({ actionType, result, facility, onClose, onView }) {
  if (!result) return null

  const titles = {
    propose: 'Intervention proposal created',
    inspect: 'Field inspection scheduled',
    escalate: 'Issue escalated to district administration',
  }

  const descriptions = {
    propose: 'Your proposal has been created and is now awaiting review.',
    inspect: 'The inspection has been scheduled and the field team will be notified.',
    escalate: 'This issue has been sent to district administration for attention.',
  }

  const id = result.proposalId || result.id || result.inspectionId || 'Ã¢â‚¬â€'
  const status = result.status || 'Created'

  return (
    <div className="space-y-5">
      {/* Success icon */}
      <div className="flex flex-col items-center text-center py-2">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-leaf-100 text-leaf-600 mb-3">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="text-[16px] font-semibold text-ink-950">{titles[actionType] || 'Action completed'}</h3>
        <p className="text-[13px] text-ink-500 mt-1 max-w-sm">{descriptions[actionType] || 'The action has been completed successfully.'}</p>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-4 space-y-2 text-[12.5px]">
        <div className="flex justify-between gap-4">
          <span className="text-ink-500">ID</span>
          <span className="text-ink-800 font-medium kbd-mono">{id}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-500">Facility</span>
          <span className="text-ink-800 font-medium text-right">{facility?.name || 'Ã¢â‚¬â€'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-500">Status</span>
          <Badge tone="info">{status}</Badge>
        </div>
        {result.createdAt && (
          <div className="flex justify-between gap-4">
            <span className="text-ink-500">Created</span>
            <span className="text-ink-800 font-medium">{new Date(result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
        {onView && <Button size="sm" variant="outline" onClick={onView}>View Details</Button>}
      </div>
    </div>
  )
}
