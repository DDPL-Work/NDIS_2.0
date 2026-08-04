import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-ink-900 text-white hover:bg-ink-950 focus-visible:ring-ink-900/30',
  saffron: 'bg-saffron-500 text-white hover:bg-saffron-600 focus-visible:ring-saffron-500/30',
  outline: 'border border-ink-200 text-ink-800 bg-white hover:bg-ink-50',
  ghost: 'text-ink-700 hover:bg-ink-100',
  positive: 'bg-leaf-600 text-white hover:bg-leaf-700',
  danger: 'bg-alert-500 text-white hover:bg-alert-600',
}

const SIZES = {
  sm: 'text-[12.5px] px-2.5 py-1.5 gap-1.5',
  md: 'text-[13.5px] px-3.5 py-2 gap-2',
  lg: 'text-[15px] px-5 py-2.5 gap-2',
}

export default function Button({ as: Comp = 'button', variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, ...rest }) {
  return (
    <Comp
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2',
        VARIANTS[variant], SIZES[size], className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : Icon ? <Icon size={15} /> : null}
      {children}
    </Comp>
  )
}
