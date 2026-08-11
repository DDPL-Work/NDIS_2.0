// Shared form/UI helpers for State Administration workspaces.
import clsx from 'clsx'
import Select from '../../../components/ui/Select'
import Badge from '../../../components/ui/Badge'

export function Field({ label, hint, className = '', ...props }) {
  return (
    <label className={clsx('block', className)}>
      {label && <span className="mb-1 block text-[12px] font-medium text-ink-700">{label}</span>}
      <input className="input-field px-3 py-2 text-[13px]" {...props} />
      {hint && <span className="mt-0.5 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  )
}

export function SelectField({ label, value, onChange, options, placeholder, className = '' }) {
  return (
    <label className={clsx('block', className)}>
      {label && <span className="mb-1 block text-[12px] font-medium text-ink-700">{label}</span>}
      <Select
        value={value}
        onChange={(next) => onChange(next)}
        options={placeholder ? [{ value: '', label: placeholder }, ...options] : options}
      />
    </label>
  )
}

// Rich textarea for remarks/reasons (mandatory for most approvals).
export function TextAreaField({ label, hint, className = '', rows = 3, ...props }) {
  return (
    <label className={clsx('block', className)}>
      {label && <span className="mb-1 block text-[12px] font-medium text-ink-700">{label}</span>}
      <textarea rows={rows} className="input-field w-full px-3 py-2 text-[13px]" {...props} />
      {hint && <span className="mt-0.5 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  )
}

export function StatusPill({ label, tone = 'neutral' }) {
  return <Badge tone={tone}>{label}</Badge>
}

export function Kbd({ children, className }) {
  return <span className={clsx('font-mono text-[12px] text-ink-600 bg-ink-50 border border-ink-100 rounded px-1.5 py-0.5', className)}>{children}</span>
}

// Small inline amount chip (raw rupees displayed in Crore/Lakh).
export function Amount({ value, className, tone }) {
  const formatted = formatAmount(value)
  return <span className={clsx('font-mono text-[12.5px]', tone && `text-${tone}-600`, className)}>{formatted}</span>
}

export function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`
  return `₹${new Intl.NumberFormat('en-IN').format(value)}`
}

// Filter strip used across workspaces.
export function FilterStrip({ children, className }) {
  return <div className={clsx('flex flex-wrap items-end gap-3', className)}>{children}</div>
}

export function SummaryPill({ label, value, tone = 'neutral' }) {
  return (
    <div className="flex items-baseline gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</span>
      <span className={clsx('font-display text-[15px] font-semibold', tone === 'leaf' ? 'text-leaf-700' : tone === 'alert' ? 'text-alert-600' : tone === 'saffron' ? 'text-saffron-600' : 'text-ink-950')}>{value}</span>
    </div>
  )
}
