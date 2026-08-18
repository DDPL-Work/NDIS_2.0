import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Building2, Clock, MapPin, RefreshCw, Search } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import CitizenComplaintDetail from './CitizenComplaintDetail'
import ComplaintStatusStepper, { complaintStateLabel } from './ComplaintStatusStepper'
import { workflowApi } from '../../services/api'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { formatDateTime } from '../../utils/format'

export default function TrackGrievance() {
  const [params] = useSearchParams()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Full-screen complaint sheet on mobile: lock page scroll, hide the bottom
  // navigation, close on Escape, and let the Android back button close the
  // sheet without breaking browser history (pushState marker + popstate).
  useEffect(() => {
    if (!detailOpen || !isMobile) return
    document.body.classList.add('citizen-modal-open')
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => {
      document.getElementById('citizen-complaint-sheet')?.querySelector('button')?.focus()
    })
    const onKey = (e) => { if (e.key === 'Escape') setDetailOpen(false) }
    document.addEventListener('keydown', onKey)
    window.history.pushState({ citizenSheet: true }, '')
    const onPop = () => setDetailOpen(false)
    window.addEventListener('popstate', onPop)
    return () => {
      cancelAnimationFrame(frame)
      document.body.classList.remove('citizen-modal-open')
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
      if (window.history.state?.citizenSheet) window.history.back()
    }
  }, [detailOpen, isMobile])

  async function search(term) {
    const trackingCode = String(term || code || '').trim()
    if (!trackingCode) return
    setLoading(true)
    setError(null)
    try {
      setResult(await workflowApi.trackGrievance(trackingCode))
    } catch (requestError) {
      setError(requestError)
      setResult(undefined)
    } finally {
      setLoading(false)
    }
  }

  // Deep link: /citizen/track?code=… auto-searches (used by dashboard cards).
  useEffect(() => {
    const fromUrl = params.get('code')
    if (fromUrl) {
      setCode(fromUrl)
      search(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6" data-tour="citizen-track-page">
      <div className="text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-saffron-600">Citizen Portal</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">Track Complaint</h1>
        <p className="mt-2 text-[13.5px] text-ink-500">Enter the tracking number you received after submitting your complaint.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); search() }} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            data-tour="citizen-track-input"
            className="input-field w-full !pl-9 kbd-mono"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter tracking number"
            aria-label="Tracking number"
          />
        </div>
        <Button type="submit" data-tour="citizen-track-button" loading={loading}>Track</Button>
      </form>

      {error && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-alert-200 bg-alert-50 p-3.5 text-[13px] text-alert-700">
          <span className="flex items-center gap-2"><AlertCircle size={16} />Something went wrong while tracking this complaint.</span>
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => search()}>Try Again</Button>
        </div>
      )}
      {result === null && (
        <div className="mt-5 rounded-xl border border-alert-200 bg-alert-50 p-3.5 text-[13px] text-alert-700 flex items-center gap-2">
          <AlertCircle size={16} />No complaint found. Please check the tracking number.
        </div>
      )}

      {loading && (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {result && !loading && (
        <div className="card mt-6 border p-4 sm:p-5">
          <span className="kbd-mono text-[11px] text-ink-400">Tracking number · {result.trackingCode || result.id}</span>
          <h2 className="mt-1 text-[16px] font-semibold text-ink-950">{result.title}</h2>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-50/60 p-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400"><Building2 size={11} /> Department</p>
              <p className="mt-1 text-[12.5px] font-medium text-ink-800">{result.departmentName || '—'}</p>
            </div>
            <div className="rounded-xl bg-ink-50/60 p-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400"><MapPin size={11} /> Location</p>
              <p className="mt-1 text-[12.5px] font-medium text-ink-800 line-clamp-2">{result.location?.village || result.location?.address || '—'}</p>
            </div>
            <div className="rounded-xl bg-ink-50/60 p-3">
              <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400"><Clock size={11} /> Last update</p>
              <p className="mt-1 text-[12.5px] font-medium text-ink-800">{result.updatedAt || result.createdAt ? formatDateTime(result.updatedAt || result.createdAt) : '—'}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-ink-100 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Status · {complaintStateLabel(result.state)}
            </p>
            <ComplaintStatusStepper state={result.state} size="full" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setDetailOpen(true)}>View Details</Button>
          </div>
        </div>
      )}

      {detailOpen && result && (
        isMobile ? (
          <CitizenComplaintDetail fullscreen complaintId={result.id} onClose={() => setDetailOpen(false)} />
        ) : (
          <Modal open={detailOpen} onClose={() => setDetailOpen(false)} width="max-w-3xl">
            <CitizenComplaintDetail complaintId={result.id} onClose={() => setDetailOpen(false)} />
          </Modal>
        )
      )}
    </div>
  )
}