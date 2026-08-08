import { useMemo, useState } from 'react'
import { Bookmark, ChevronDown, History, MapPin, X } from 'lucide-react'
import { formatCoord } from '../../utils/geo'

const TABS = [
  { id: 'results', label: 'Results' },
  { id: 'history', label: 'History' },
  { id: 'bookmarks', label: 'Bookmarks' },
]

export default function GISResultsDrawer({ outcome, history = [], bookmarks = [], open, onToggle, onSelect, onToggleBookmark, onClose }) {
  const [tab, setTab] = useState('results')
  const results = outcome?.results || []
  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((item) => item.id)), [bookmarks])

  const rows = tab === 'results' ? results : tab === 'bookmarks' ? bookmarks : history

  return (
    <section className="shrink-0 border-t border-ink-100 bg-white">
      <button onClick={onToggle} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 hover:text-ink-900">
        {tab === 'results' ? <MapPin size={13} className="text-saffron-600" /> : tab === 'bookmarks' ? <Bookmark size={13} className="text-saffron-600" /> : <History size={13} className="text-saffron-600" />}
        {TABS.find((item) => item.id === tab).label}
        <span className="ml-1 text-[10px] font-normal text-ink-400">{tab === 'results' ? `${results.length} spatial results` : tab === 'bookmarks' ? `${bookmarks.length} saved` : 'Recent queries'}</span>
        {onClose && results.length > 0 && tab === 'results' && (
          <button onClick={(event) => { event.stopPropagation(); onClose() }} className="ml-2 text-ink-400 hover:text-ink-700" aria-label="Clear results"><X size={13} /></button>
        )}
        <ChevronDown size={13} className={`ml-auto text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-ink-50 px-2 pt-1.5">
          <div className="flex gap-0.5">
            {TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${tab === item.id ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-100'}`}>{item.label}{item.id === 'bookmarks' && bookmarks.length ? ` · ${bookmarks.length}` : ''}{item.id === 'history' && history.length ? ` · ${history.length}` : ''}</button>)}
          </div>
          <div className="resize-y overflow-auto py-1" style={{ maxHeight: 132 }}>
            {rows.length === 0 ? (
              <p className="py-2.5 text-center text-[11.5px] text-ink-400">
                {tab === 'results' ? 'Run a search to populate results.' : tab === 'bookmarks' ? 'No bookmarks yet — star a result to pin it here.' : 'No queries yet.'}
              </p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {rows.map((row) => (
                  <li key={tab === 'history' ? `h-${row.at}` : row.id} className="flex items-center gap-2 py-1.5">
                  {tab === 'history' ? (
                    <span className="min-w-0 flex-1"><span className="block truncate text-[12px] text-ink-800">{row.query}</span><span className="block text-[10px] text-ink-400">{row.count} results · {new Date(row.at).toLocaleTimeString()}</span></span>
                  ) : (
                    <button onClick={() => onSelect(row)} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-ink-50">
                      <MapPin size={13} className="shrink-0 text-ink-400" />
                      <span className="min-w-0"><span className="block truncate text-[12px] font-medium text-ink-800">{row.name || row.title}</span><span className="block truncate text-[10px] text-ink-400">{row.categoryLabel || row.departmentId || row.type} · {row.position ? formatCoord(row.position) : null}</span></span>
                    </button>
                  )}
                  {tab !== 'history' && (
                    <button onClick={() => onToggleBookmark(row)} aria-label={bookmarkedIds.has(row.id) ? 'Remove bookmark' : 'Bookmark'} className="shrink-0 rounded-md p-1 text-ink-300 hover:bg-ink-100 hover:text-saffron-600"><Bookmark size={13} className={bookmarkedIds.has(row.id) ? 'fill-saffron-500 text-saffron-500' : ''} /></button>
                  )}
</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )}
  </section>
)
}