import clsx from 'clsx'
export default function IconButton({ icon: Icon, className, size = 16, ...rest }) {
  return (
    <button className={clsx('grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800 transition-colors', className)} {...rest}>
      <Icon size={size} />
    </button>
  )
}
