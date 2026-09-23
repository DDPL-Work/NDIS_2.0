export function formatNumber(n) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatPercent(n, decimals = 0) {
  if (n === null || n === undefined) return '—'
  return `${n.toFixed(decimals)}%`
}

/**
 * Format a gap/priority score that is already on a 0-100 scale.
 * Does NOT multiply by 100 - backend already provides 0-100 values.
 * @param {number|null|undefined} score - Score on 0-100 scale (e.g., 72.8)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string (e.g., "72.8%")
 */
export function formatScorePercent(score, decimals = 1) {
  if (score === null || score === undefined || Number.isNaN(score)) return '—'
  return `${Number(score).toFixed(decimals)}%`
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}


export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function daysUntil(iso) {
  const diffMs = new Date(iso).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function formatCurrencyINR(n) {
  if (n === null || n === undefined) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  return `₹${formatNumber(n)}`
}

export function titleCase(str = '') {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
