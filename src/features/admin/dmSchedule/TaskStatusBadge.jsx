import Badge from '../../../components/ui/Badge'
import { TASK_STATUS_LABELS, TASK_STATUS_TONES } from './constants'

export default function TaskStatusBadge({ status }) {
  return (
    <Badge tone={TASK_STATUS_TONES[status] || 'neutral'}>
      {TASK_STATUS_LABELS[status] || status}
    </Badge>
  )
}
