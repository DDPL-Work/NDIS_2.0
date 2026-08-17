import clsx from 'clsx'

const TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  info: 'bg-sky-100 text-sky-700',
  positive: 'bg-leaf-100 text-leaf-700',
  negative: 'bg-alert-50 text-alert-600',
  warning: 'bg-saffron-100 text-saffron-700',
}

export default function Badge({ tone = 'neutral', children, className, dot }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold max-w-full', TONES[tone] || TONES.neutral, className)}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', {
        'bg-ink-500': tone === 'neutral', 'bg-sky-500': tone === 'info', 'bg-leaf-500': tone === 'positive',
        'bg-alert-500': tone === 'negative', 'bg-saffron-500': tone === 'warning',
      })} />}
      {children}
    </span>
  )
}
