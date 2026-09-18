export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-ink-100 bg-white p-4 animate-pulse">
          <div className="h-3 w-16 bg-ink-100 rounded mb-2" />
          <div className="h-7 w-10 bg-ink-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-ink-100 bg-white p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 bg-ink-100 rounded" />
        <div className="h-5 w-20 bg-ink-100 rounded" />
      </div>
      <div className="h-4 w-3/4 bg-ink-100 rounded mb-2" />
      <div className="h-3 w-1/2 bg-ink-100 rounded mb-3" />
      <div className="flex gap-3">
        <div className="h-3 w-24 bg-ink-100 rounded" />
        <div className="h-3 w-20 bg-ink-100 rounded" />
      </div>
    </div>
  )
}

export function DrawerSkeleton() {
  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col border-l border-ink-200 bg-white animate-pulse">
      <div className="border-b border-ink-200 px-5 py-4">
        <div className="h-5 w-32 bg-ink-100 rounded mb-2" />
        <div className="h-4 w-48 bg-ink-100 rounded" />
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div className="h-4 w-full bg-ink-100 rounded" />
        <div className="h-4 w-3/4 bg-ink-100 rounded" />
        <div className="h-20 w-full bg-ink-100 rounded" />
        <div className="h-4 w-full bg-ink-100 rounded" />
        <div className="h-4 w-2/3 bg-ink-100 rounded" />
      </div>
    </div>
  )
}
