import { ListTodo, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'

const URGENCY_META = {
  critical: { label: 'Critical', tone: 'alert' },
  high: { label: 'High', tone: 'saffron' },
  medium: { label: 'Medium', tone: 'sky' },
  low: { label: 'Low', tone: 'ink' },
}

// Section H — the action queue.  Items that require DM attention, most urgent
// first.  Each item carries a concrete recommended action and opens the
// relevant detail when clicked.
export default function ActionQueue({ actions, onAction, loadedAt }) {
  return (
    <SectionCard
      id="action-queue"
      title="Action queue"
      subtitle="Items requiring DM attention, ranked by urgency."
      foot={<Provenance source="GET /api/complaints/ · /api/proposals/ · /api/projects/summary/" definition="Escalated complaints, SLA breaches, proposals awaiting review/sanction and due inspections, sorted by urgency." updatedAt={loadedAt} />}
    >
      {!actions.length ? (
        <EmptyState icon={ListTodo} title="Nothing needs your attention right now" description="New escalations, breaches, review requests and due inspections will appear here automatically." />
      ) : (
        <ol className="space-y-2">
          {actions.map((item) => {
            const meta = URGENCY_META[item.urgency] || URGENCY_META.medium
            return (
              <li key={item.key}>
                <button
                  onClick={() => onAction(item)}
                  className="group w-full flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 text-left transition hover:border-ink-200 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                  <span className={clsx('w-1.5 self-stretch rounded-full shrink-0', {
                    'bg-alert-500': item.urgency === 'critical',
                    'bg-saffron-500': item.urgency === 'high',
                    'bg-sky-400': item.urgency === 'medium',
                    'bg-ink-300': item.urgency === 'low',
                  })} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={meta.tone}>{item.typeLabel}</Badge>
                      {item.location && <span className="text-[11px] text-ink-400">{item.location}</span>}
                    </div>
                    <p className="text-[13px] font-semibold text-ink-900 mt-1 leading-snug">{item.title}</p>
                    <p className="text-[11.5px] text-ink-500 mt-0.5 leading-snug">{item.recommendedAction}</p>
                  </div>
                  <ChevronRight size={15} className="text-ink-300 group-hover:text-ink-600 shrink-0" />
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </SectionCard>
  )
}