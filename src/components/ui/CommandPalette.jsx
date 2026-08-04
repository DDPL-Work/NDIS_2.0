// Command Palette (Cmd+K / Ctrl+K) — Vol 1 §10.2 Global Search & Quick Jump.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, FileText, AlertTriangle, ArrowRight, CornerDownLeft } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { gisApi, workflowApi } from '../../services/api'
import { DEPARTMENT_MAP } from '../../config/constants'

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else setQuery('')
      }
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([])
      return
    }

    const q = query.toLowerCase()
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const [facilities, proposals, grievances] = await Promise.all([
          gisApi.searchFacilities({ districtId: user?.districtId || 'nalanda' }),
          workflowApi.listProposals({ districtId: user?.districtId || 'nalanda' }),
          workflowApi.listGrievances({ districtId: user?.districtId || 'nalanda' }),
        ])

        const matchedFac = (facilities || [])
          .filter((f) => f.name.toLowerCase().includes(q) || f.categoryLabel.toLowerCase().includes(q))
          .slice(0, 4)
          .map((f) => ({
            id: f.id,
            title: f.name,
            subtitle: `${f.categoryLabel} · ${f.village}`,
            type: 'facility',
            icon: MapPin,
            path: `/citizen/facility/${f.id}`,
          }))

        const matchedProp = (proposals || [])
          .filter((p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
          .slice(0, 3)
          .map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: `${p.id} · ${DEPARTMENT_MAP[p.departmentId]?.label}`,
            type: 'proposal',
            icon: FileText,
            path: `/admin/approvals`,
          }))

        const matchedGrv = (grievances || [])
          .filter((g) => g.title.toLowerCase().includes(q) || g.trackingCode.toLowerCase().includes(q))
          .slice(0, 3)
          .map((g) => ({
            id: g.id,
            title: g.title,
            subtitle: `${g.trackingCode} · ${g.village}`,
            type: 'grievance',
            icon: AlertTriangle,
            path: `/admin/grievances`,
          }))

        setResults([...matchedFac, ...matchedProp, ...matchedGrv])
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query, open, user?.districtId])

  if (!open) return null

  function handleSelect(item) {
    onClose()
    navigate(item.path)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 bg-ink-950/50 backdrop-blur-xs flex items-start justify-center animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-ink-100 animate-slide-in-down">
        {/* Search Header Input */}
        <div className="p-4 border-b border-ink-100 flex items-center gap-3">
          <Search size={18} className="text-ink-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search facilities, proposals, grievances, or codes… (Cmd+K)"
            className="w-full text-[14px] text-ink-900 bg-transparent focus:outline-none placeholder:text-ink-400"
          />
          <kbd className="hidden sm:inline-block font-mono text-[10.5px] text-ink-400 bg-ink-100 px-2 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-80 overflow-y-auto divide-y divide-ink-50">
          {loading && <div className="p-6 text-center text-ink-400 text-[12.5px]">Searching NDISP data…</div>}

          {!loading && query.trim() && results.length === 0 && (
            <div className="p-6 text-center text-ink-400 text-[12.5px]">No results found matching "{query}".</div>
          )}

          {!query.trim() && (
            <div className="p-4 text-[12px] text-ink-400">
              <p className="font-semibold text-ink-700 mb-2">Quick Navigation Shortcuts</p>
              <div className="grid grid-cols-2 gap-2 text-ink-600">
                <button onClick={() => handleSelect({ path: '/admin/situation-matrix' })} className="p-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-left">
                  🗺️ Situation Matrix
                </button>
                <button onClick={() => handleSelect({ path: '/admin/analytics' })} className="p-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-left">
                  📊 Analytics Dashboard
                </button>
                <button onClick={() => handleSelect({ path: '/citizen' })} className="p-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-left">
                  📍 Citizen Map Explorer
                </button>
                <button onClick={() => handleSelect({ path: '/linedept/field-ops' })} className="p-2 rounded-lg bg-ink-50 hover:bg-ink-100 text-left">
                  🔧 Complaints & Field Ops
                </button>
              </div>
            </div>
          )}

          {!loading &&
            results.map((item) => {
              const ItemIcon = item.icon
              return (
                <button
                  key={item.id + item.type}
                  onClick={() => handleSelect(item)}
                  className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50/70 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-ink-100 text-ink-600 group-hover:bg-ink-900 group-hover:text-white transition-colors shrink-0">
                      <ItemIcon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink-900 truncate">{item.title}</p>
                      <p className="text-[11.5px] text-ink-500 truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <CornerDownLeft size={14} className="text-ink-300 group-hover:text-ink-700 transition-colors shrink-0" />
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
