import { useState, useRef } from 'react'
import clsx from 'clsx'

export function Tooltip({ content, children, className }) {
  const [visible, setVisible] = useState(false)

  if (!content) return children

  return (
    <div
      className={clsx('relative inline-block', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-ink-900 text-white rounded shadow-md whitespace-nowrap z-50 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ink-900" />
        </div>
      )}
    </div>
  )
}

export default Tooltip
