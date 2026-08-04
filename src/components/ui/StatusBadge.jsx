import Badge from './Badge'
import { STATUS_TONE, PROPOSAL_STATE_LABELS, GRIEVANCE_STATE_LABELS } from '../../config/constants'
import { titleCase } from '../../utils/format'

export default function StatusBadge({ status }) {
  const label = PROPOSAL_STATE_LABELS[status] || GRIEVANCE_STATE_LABELS[status] || titleCase(status)
  return <Badge tone={STATUS_TONE[status] || 'neutral'} dot>{label}</Badge>
}
