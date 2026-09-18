import { useState } from 'react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import { useUiStore } from '../../../app/store/uiStore'
import { backendInterventionApi } from '../../../api/interventionApi'
import { backendInspectionApi } from '../../../api/inspectionApi'
import { backendProposalApi } from '../../../api/proposalApi'
import { invalidateData, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { TASK_TYPES, TASK_STATUSES, PRIORITY_LEVELS, TASK_STATUS_LABELS, PRIORITY_LABELS } from './constants'

const STATUS_OPTIONS_BY_TYPE = {
  [TASK_TYPES.INTERVENTION]: [
    { value: '', label: 'Select status...' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  [TASK_TYPES.INSPECTION]: [
    { value: '', label: 'Select status...' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  [TASK_TYPES.PROPOSAL]: [
    { value: '', label: 'Select status...' },
    { value: 'DRAFT_DPR', label: 'Draft DPR' },
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'SANCTIONED', label: 'Sanctioned' },
    { value: 'IN_EXECUTION', label: 'In Execution' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'REJECTED', label: 'Rejected' },
  ],
  [TASK_TYPES.ESCALATION]: [
    { value: '', label: 'Select status...' },
    { value: 'DRAFT_DPR', label: 'Draft' },
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ],
}

export default function EditTaskModal({ task, open, onClose, onSave }) {
  const [status, setStatus] = useState(task?.status || TASK_STATUSES.PENDING)
  const [priority, setPriority] = useState(task?.priority || PRIORITY_LEVELS.MEDIUM)
  const [dueDate, setDueDate] = useState(task?.dueDate?.split('T')[0] || '')
  const [assignee, setAssignee] = useState(task?.assignee || '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const pushToast = useUiStore((s) => s.pushToast)

  if (!task) return null

  const statusOptions = STATUS_OPTIONS_BY_TYPE[task.type] || Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const sourceId = task.sourceId
      if (!sourceId) {
        onSave?.({ ...task, status, priority, dueDate: dueDate ? `${dueDate}T00:00:00` : null, assignee, notes })
        onClose?.()
        return
      }

      if (task.type === TASK_TYPES.INTERVENTION) {
        await backendInterventionApi.update(sourceId, { status, priority_level: priority })
      } else if (task.type === TASK_TYPES.INSPECTION) {
        const inspectionPayload = { status }
        if (dueDate) inspectionPayload.scheduled_date = dueDate
        if (assignee) inspectionPayload.inspector_name = assignee
        if (notes) inspectionPayload.remarks = notes
        await backendInspectionApi.update(sourceId, inspectionPayload)
      } else if (task.type === TASK_TYPES.PROPOSAL || task.type === TASK_TYPES.ESCALATION) {
        await backendProposalApi.update(sourceId, { status, priority })
      }

      invalidateData(DATA_SCOPES.INTERVENTIONS)
      invalidateData(DATA_SCOPES.INSPECTIONS)
      invalidateData(DATA_SCOPES.PROPOSALS)
      invalidateData(DATA_SCOPES.DASHBOARD)
      pushToast('Task updated successfully.', 'success')
      onSave?.({ ...task, status, priority, dueDate: dueDate ? `${dueDate}T00:00:00` : null, assignee, notes })
      onClose?.()
    } catch (error) {
      pushToast(error?.message || 'Failed to update task.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit / Reschedule Task"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Task info (read-only) */}
        <div className="rounded-lg bg-ink-50 p-3 text-[13px]">
          <p className="font-medium text-ink-800">{task.title}</p>
          {task.facilityName && (
            <p className="text-ink-500 mt-0.5">{task.facilityName}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ink-700 dark:text-ink-300">Status</label>
          <Select
            value={status}
            onChange={setStatus}
            options={statusOptions}
            className="w-full"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ink-700 dark:text-ink-300">Priority</label>
          <Select
            value={priority}
            onChange={setPriority}
            options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
            className="w-full"
          />
        </div>

        {/* Due date */}
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ink-700 dark:text-ink-300">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
          />
        </div>

        {/* Assignee */}
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ink-700 dark:text-ink-300">Assigned to</label>
          <input
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Enter assignee name"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder-ink-400 focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-[13px] font-medium text-ink-700 dark:text-ink-300">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any notes or instructions..."
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder-ink-400 focus:border-saffron-500 focus:outline-none focus:ring-1 focus:ring-saffron-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
          />
        </div>
      </div>
    </Modal>
  )
}
