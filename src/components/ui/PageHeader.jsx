export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-3 px-6 pt-6 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="text-xl font-display font-semibold text-ink-950 break-words">{title}</h2>
        {description && <p className="text-[13px] text-ink-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}