import { MessageSquareText, ShieldAlert, Clock3, MapPin, ArrowRight } from 'lucide-react'
import clsx from 'clsx'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import Badge from '../../../components/ui/Badge'
import { formatDate } from '../../../utils/format'

// Section E — citizen signals.  Recurring location/service feedback is shown
// separately from administrative workflow facts (SLA / escalation) so citizen
// perception is never presented as administrative fact and vice versa.
export default function CitizenSignals({ signals, onOpenComplaint, loadedAt }) {
  const { signals: recurring, administrative } = signals || { signals: [], administrative: {} }
  return (
    <SectionCard
      id="citizen-signals"
      title="Citizen signals"
      subtitle="What citizens keep reporting, and what the workflow records say — kept deliberately separate."
      foot={<Provenance source="GET /api/complaints/ (open records)" definition="Recurring signals group open complaints by village + category. Administrative facts read workflow fields (is_sla_breached, state=escalated)." updatedAt={loadedAt} />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Citizen perception */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquareText size={13} className="text-saffron-600" />
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-600">Citizen-reported (perception)</p>
          </div>
          {!recurring.length ? (
            <p className="text-[12.5px] text-ink-400 py-6 text-center">No recurring citizen reports in the current open complaints.</p>
          ) : (
            <div className="space-y-2">
              {recurring.map((signal) => (
                <div key={`${signal.village}-${signal.category}`} className="rounded-xl border border-saffron-100 bg-saffron-50/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink-900 flex items-center gap-1.5">
                        <MapPin size={12} className="text-saffron-600 shrink-0" /> {signal.village === 'Unspecified location' ? 'Location not specified' : signal.village} <Badge tone="saffron">{signal.category}</Badge>
                      </p>
                      <p className="text-[11.5px] text-ink-500 mt-0.5">
                        {signal.count} open report{signal.count > 1 ? 's' : ''} · latest {signal.latestAt ? formatDate(signal.latestAt) : '—'}
                      </p>
                    </div>
                    <button onClick={() => onOpenComplaint?.(signal.complaintIds?.[0])} className="shrink-0 text-saffron-700 hover:underline text-[11.5px] font-medium flex items-center gap-0.5">View <ArrowRight size={11} /></button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {signal.samples.map((title, index) => (
                      <span key={index} className="rounded-full bg-white border border-saffron-100 px-2 py-0.5 text-[11px] text-ink-600 truncate max-w-[240px]">“{title}”</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Administrative facts */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldAlert size={13} className="text-sky-700" />
            <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-600">Administrative facts (workflow)</p>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-800"><Clock3 size={13} className="text-sky-700" /> SLA breaches</p>
              <p className="text-2xl font-display font-semibold text-ink-950 mt-0.5">{administrative.slaBreached ?? 0}</p>
              <p className="text-[11px] text-ink-500 mt-0.5">open complaints past their backend SLA deadline</p>
            </div>
            <div className="rounded-xl border border-alert-100 bg-alert-50/40 p-3">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-800"><ShieldAlert size={13} className="text-alert-600" /> Escalated</p>
              <p className="text-2xl font-display font-semibold text-ink-950 mt-0.5">{administrative.escalated ?? 0}</p>
              <p className="text-[11px] text-ink-500 mt-0.5">complaints escalated beyond the department</p>
            </div>
            <p className={clsx('text-[11px] text-ink-400 px-1')}>These are workflow records, not citizen perception — a complaint counted here may not be repeated in the citizen-reported column.</p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
