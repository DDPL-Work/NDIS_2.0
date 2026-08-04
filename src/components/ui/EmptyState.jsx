export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {Icon && <div className="grid h-11 w-11 place-items-center rounded-full bg-ink-100 text-ink-400 mb-3"><Icon size={20} /></div>}
      <h4 className="text-[14.5px] font-semibold text-ink-800">{title}</h4>
      {description && <p className="text-[13px] text-ink-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
