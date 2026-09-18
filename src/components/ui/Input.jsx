import { forwardRef } from 'react'
import clsx from 'clsx'

export const Input = forwardRef(function Input(
  { className, type = 'text', ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={clsx(
        'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-ink-50 disabled:text-ink-400',
        className
      )}
      {...rest}
    />
  )
})

export default Input
