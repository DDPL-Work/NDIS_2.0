import clsx from 'clsx'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { SkeletonCard } from '../../../components/ui/Skeleton'

export default function SectionCard({ id, title, subtitle, action, foot, children, className, loading, error, onRetry }) {
  return (
    <section id={id} className={clsx('card p-4 sm:p-5', className)}>
      <header className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="text-[12.5px] text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-alert-100 bg-alert-50/50 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] text-alert-700">
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
          {onRetry && (
            <Button size="xs" variant="outline" onClick={onRetry}>
              <RefreshCw size={12} /> Retry
            </Button>
          )}
        </div>
      ) : (
        children
      )}

      {foot && <footer className="mt-4 border-t border-ink-100 pt-3">{foot}</footer>}
    </section>
  )
}