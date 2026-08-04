import clsx from 'clsx'
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1 border-b border-ink-100 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'relative px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
            active === tab.value ? 'text-ink-950' : 'text-ink-500 hover:text-ink-800'
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="ml-1.5 text-[11px] text-ink-400">{tab.count}</span>}
          {active === tab.value && <span className="absolute left-2 right-2 -bottom-px h-[2px] rounded-full bg-saffron-500" />}
        </button>
      ))}
    </div>
  )
}
