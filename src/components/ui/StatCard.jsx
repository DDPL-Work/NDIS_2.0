import clsx from 'clsx'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function StatCard({ label, value, sub, icon: Icon, tone = 'ink', delta, className }) {
  const positive = delta > 0
  return (
    <div className={clsx('card px-4 py-3.5', className)}>
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        {Icon && <div className={clsx('grid h-7 w-7 place-items-center rounded-md', {
          'bg-ink-100 text-ink-700': tone === 'ink', 'bg-leaf-100 text-leaf-700': tone === 'leaf',
          'bg-saffron-100 text-saffron-700': tone === 'saffron', 'bg-alert-50 text-alert-600': tone === 'alert',
          'bg-sky-100 text-sky-700': tone === 'sky',
        })}><Icon size={14} /></div>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-2xl font-display font-semibold text-ink-950">{value}</span>
        {delta !== undefined && (
          <span className={clsx('inline-flex items-center text-[11.5px] font-semibold', positive ? 'text-leaf-600' : 'text-alert-600')}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && <p className="text-[12px] text-ink-500 mt-1">{sub}</p>}
    </div>
  )
}
