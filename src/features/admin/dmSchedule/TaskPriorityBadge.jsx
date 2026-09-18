import Badge from '../../../components/ui/Badge'
import { PRIORITY_LABELS, PRIORITY_TONES } from './constants'

export default function TaskPriorityBadge({ priority }) {
  return (
    <Badge tone={PRIORITY_TONES[priority] || 'neutral'}>
      {PRIORITY_LABELS[priority] || priority}
    </Badge>
  )
}
