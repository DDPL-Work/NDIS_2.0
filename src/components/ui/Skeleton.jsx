import clsx from 'clsx'
export default function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-md bg-ink-100', className)} />
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  )
}
