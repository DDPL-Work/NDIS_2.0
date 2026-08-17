// Reusable pagination controls for long registers/tables.
// "Showing X–Y of Z" + page size select + prev/next with page numbers.
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const PAGE_SIZES = [10, 25, 50, 100]

export function usePagination(initialPageSize = 25) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  return { page, setPage, pageSize, setPageSize }
}

export function usePagedRows(rows, initialPageSize = 25) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(page, pages)
  const start = (safePage - 1) * pageSize
  return { page: safePage, setPage, pageSize, setPageSize, pageRows: rows.slice(start, start + pageSize), total: rows.length }
}

function paginate(rows, page, pageSize) {
  if (!rows) return rows
  return rows.slice((page - 1) * pageSize, page * pageSize)
}

export default function Pagination({ total, page, onPage, onChange, pageSize = 25, onPageSize, className = '' }) {
  // Accept both call conventions used across the app (onPage and onChange).
  const handlePage = onPage || onChange || (() => {})
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, pages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  const nums = []
  for (let i = Math.max(1, safePage - 2); i <= Math.min(pages, safePage + 2); i++) nums.push(i)

  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-5 py-3', className)}>
      <p className="text-[12px] text-ink-500">
        Showing <span className="font-mono font-medium text-ink-800">{from}–{to}</span> of <span className="font-mono font-medium text-ink-800">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {onPageSize && (
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-[12px] font-medium text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => handlePage(safePage - 1)}
          className="grid h-7 w-7 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handlePage(n)}
            className={clsx(
              'h-7 min-w-7 px-1.5 rounded-lg text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20',
              n === safePage ? 'bg-ink-900 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          disabled={safePage >= pages}
          onClick={() => handlePage(safePage + 1)}
          className="grid h-7 w-7 place-items-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export { paginate }