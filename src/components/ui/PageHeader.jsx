export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 px-6 pt-6 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="text-xl font-display font-semibold text-ink-950 break-words">{title}</h2>
        {description && <p className="text-[13px] text-ink-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="w-full min-w-0 sm:w-auto sm:max-w-[70%]">{action}</div>}
    </div>
  )
}
