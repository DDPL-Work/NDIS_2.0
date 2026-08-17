import clsx from 'clsx'

export function Card({ className, children, ...rest }) {
  return <div className={clsx('card', className)} {...rest}>{children}</div>
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-ink-100">
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-white shrink-0"><Icon size={16} /></div>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-ink-950 truncate">{title}</h3>
          {subtitle && <p className="text-[12.5px] text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>
}