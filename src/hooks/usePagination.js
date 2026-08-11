import { useState, useEffect, useMemo, useCallback } from 'react'

// Client-side pagination for locally filtered lists. `rows` may change
// (filters, refetch): the page clamps back automatically so an empty page is
// never shown. Returns the sliced entries plus the controls the UI needs.
export function usePagination(rows = [], pageSize = 10) {
  const total = rows.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const pageEntries = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [rows, page, pageSize])

  const reset = useCallback(() => setPage(1), [])

  return { page, setPage, pageEntries, pageCount, total, pageSize, reset }
}