import { useState } from 'react'
import clsx from 'clsx'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { Inbox } from 'lucide-react'

// Responsive column strategy: columns may declare `hideOn: 'sm' | 'md' | 'lg'`
// to drop low-priority columns below that breakpoint (Strategy B). The table
// itself stays horizontally scrollable inside its wrapper.
const HIDE_ON = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

export default function DataTable({ columns, rows, onRowClick, emptyLabel = 'No records found', keyField = 'id', pageSize = 25 }) {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(pageSize)
  if (!rows?.length) {
    return <EmptyState icon={Inbox} title={emptyLabel} description="Try adjusting your filters." />
  }
  const pages = Math.max(1, Math.ceil(rows.length / size))
  const safePage = Math.min(page, pages)
  const pageRows = rows.slice((safePage - 1) * size, safePage * size)
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink-100">
              {columns.map((col) => (
                <th key={col.key} className={clsx('px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400 whitespace-nowrap', col.hideOn && HIDE_ON[col.hideOn])}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick?.(row)}
                className={clsx('border-b border-ink-50 last:border-0', onRowClick && 'cursor-pointer hover:bg-ink-50')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={clsx('px-4 py-3 text-[13px] text-ink-700 align-middle', col.hideOn && HIDE_ON[col.hideOn])}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > size && (
        <Pagination total={rows.length} page={safePage} onPage={setPage} pageSize={size} onPageSize={setSize} />
      )}
    </div>
  )
}
