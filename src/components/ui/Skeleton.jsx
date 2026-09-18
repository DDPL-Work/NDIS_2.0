import clsx from 'clsx'

export function Skeleton({ className, ...rest }) {
  return (
    <div
      className={clsx('animate-pulse rounded bg-ink-200/70', className)}
      {...rest}
    />
  )
}

export function SkeletonCard({ className }) {
  return (
    <div className={clsx('card p-4 space-y-3', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export default Skeleton
