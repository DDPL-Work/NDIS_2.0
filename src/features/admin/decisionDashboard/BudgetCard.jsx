import { IndianRupee, Landmark, ArrowRightCircle } from 'lucide-react'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import EmptyState from '../../../components/ui/EmptyState'
import { formatCurrencyINR, formatDateTime } from '../../../utils/format'

// Section G — budget.  Sanctioned / allocated / utilized with utilization %.
// Data comes from the district allocations collection; when the backend
// returns no records (or denies access) the section renders an honest empty
// state instead of zeros.
export default function BudgetCard({ budget, status, error, onRetry, loadedAt }) {
  return (
    <SectionCard
      id="budget"
      title="Budget"
      subtitle="District allocation — sanctioned, allocated and spent."
      foot={<Provenance source="GET /api/district-allocations/" definition="Sum of records for the district: approved = sanctioned, allocated = district allocation, utilized = spent, balance = remaining." updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined} />}
    >
      {status === 'error' ? (
        <EmptyState
          icon={Landmark}
          title="Budget data unavailable"
          description={`The backend did not return district allocations for this session. ${error || ''}`}
          action={onRetry ? <button onClick={onRetry} className="text-sky-700 text-[13px] font-medium hover:underline">Retry</button> : undefined}
        />
      ) : !budget ? (
        <EmptyState
          icon={Landmark}
          title="No district allocations on record"
          description="No district allocation records were returned for the current session's district. The budget section will populate automatically when the backend serves them."
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Sanctioned', value: budget.sanctionedCr, tone: 'text-ink-950' },
            { label: 'Allocated', value: budget.allocatedCr, tone: 'text-ink-950' },
            { label: 'Utilized', value: budget.utilizedCr, tone: 'text-leaf-700' },
            { label: 'Balance', value: budget.balanceCr, tone: 'text-sky-700' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-ink-100 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{item.label}</p>
              <p className={`mt-1 text-xl font-display font-semibold ${item.tone}`}>{formatCurrencyINR(item.value)}</p>
            </div>
          ))}
          <div className="col-span-2 lg:col-span-4">
            <div className="flex items-center justify-between text-[12px] text-ink-500 mb-1">
              <span className="flex items-center gap-1"><ArrowRightCircle size={12} /> Utilization</span>
              <span className="font-semibold text-ink-800">{budget.utilizationPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full bg-leaf-500 rounded-full transition-all" style={{ width: `${Math.min(100, budget.utilizationPercent)}%` }} />
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}