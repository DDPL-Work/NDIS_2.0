import clsx from 'clsx'
import EmptyState from './EmptyState'
import { Inbox } from 'lucide-react'

export default function DataTable({ columns, rows, onRowClick, emptyLabel = 'No records found', keyField = 'id' }) {
  if (!rows?.length) {
    return <EmptyState icon={Inbox} title={emptyLabel} description="Try adjusting your filters." />
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-ink-100">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={clsx('border-b border-ink-50 last:border-0', onRowClick && 'cursor-pointer hover:bg-ink-50')}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[13px] text-ink-700 align-middle">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
