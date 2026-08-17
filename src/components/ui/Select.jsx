import { ChevronDown } from 'lucide-react'
export default function Select({ value, onChange, options, className = '', small }) {
  return (
    <div className={`relative inline-flex items-center min-w-0 max-w-full ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-lg border border-ink-200 bg-white pr-8 pl-3 font-medium text-ink-800 hover:border-ink-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 max-w-full text-ellipsis ${small ? 'py-1.5 text-[12.5px]' : 'py-2 text-[13.5px]'}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 text-ink-400" />
    </div>
  )
}