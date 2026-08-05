import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export default function Select({ value, onChange, options, className = '', small, dark = false }) {
  return (
    <div className={clsx('relative inline-flex items-center', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'appearance-none rounded-lg border pr-8 pl-3 font-medium focus:outline-none focus-visible:ring-2',
          dark
            ? 'border-royal-800 bg-royal-900/70 text-royal-100 hover:border-royal-600 focus-visible:ring-royal-500/40'
            : 'border-ink-200 bg-white text-ink-800 hover:border-ink-300 focus-visible:ring-ink-900/20',
          small ? 'py-1.5 text-[12.5px]' : 'py-2 text-[13.5px]'
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className={clsx('pointer-events-none absolute right-2.5', dark ? 'text-royal-300' : 'text-ink-400')} />
    </div>
  )
}