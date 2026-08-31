export default function EmptyState({ icon: Icon, title, description, action, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}>
      {Icon && <div className={`grid h-10 w-10 place-items-center rounded-full bg-ink-100 text-ink-400 ${compact ? 'mb-2' : 'mb-3'}`}><Icon size={18} /></div>}
      <h4 className="text-[14px] font-semibold text-ink-800">{title}</h4>
      {description && <p className="text-[12.5px] text-ink-500 mt-1 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className={`mt-3`}>{action}</div>}
    </div>
  )
}
