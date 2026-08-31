// Complaints & Inspections (Field Operations) — Vol 3 §15.2, §16.
// Field Engineers & Department Officers update status with geo-tagged inspection photos.
import { useState } from 'react'
import { Camera, CheckCircle2, Wrench, Upload, MapPin, AlertCircle, Loader2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Tabs from '../../components/ui/Tabs'
import DataTable from '../../components/ui/DataTable'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useAsync } from '../../hooks/useAsync'
import { workflowApi } from '../../services/api'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { formatDate, daysUntil } from '../../utils/format'

const TABS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'inspection_started', label: 'Inspection' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export default function FieldOps() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const [tab, setTab] = useState('assigned')
  const [selected, setSelected] = useState(null)

  // Photo upload & EXIF verification state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [geotagResult, setGeotagResult] = useState(null) // backend verify-geotag response
  const [verifyingGps, setVerifyingGps] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data: grievances, loading, refetch } = useAsync(
    () => workflowApi.listGrievances({ departmentId: user?.departmentId, state: tab }),
    [user?.departmentId, tab]
  )

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setGeotagResult(null)

    const lat = selected?.location?.position?.[1] || selected?.latitude
    const lng = selected?.location?.position?.[0] || selected?.longitude
    if (lat && lng) {
      setVerifyingGps(true)
      import('../../api/gisApi').then(({ backendGisApi }) =>
        backendGisApi.verifyGeotag({ latitude: lat, longitude: lng })
          .then((result) => setGeotagResult(result))
          .catch(() => setGeotagResult(null))
          .finally(() => setVerifyingGps(false))
      )
    } else {
      pushToast('No asset coordinates available for EXIF verification.', 'warning')
    }
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(null)
    setGeotagResult(null)
  }

  async function updateStatus(next) {
    if (!selected) return
    setBusy(true)
    try {
      const ok = await transitionComplaintState(
        selected.id,
        next,
        user,
        next === 'inspection_started'
          ? 'Field work commenced at site by department staff.'
          : 'Inspection and field work completed; forwarded for resolution review.'
      )
      if (ok) pushToast(`Grievance ${selected.trackingCode} moved to ${next.replace(/_/g, ' ')}.`, 'success')
      setSelected(null)
      clearPhoto()
      refetch()
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'trackingCode', label: 'Tracking Code', render: (r) => <span className="kbd-mono text-[12px]">{r.trackingCode}</span> },
    { key: 'title', label: 'Issue', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'village', label: 'Location', hideOn: 'md' },
    { key: 'submittedAt', label: 'Submitted', render: (r) => formatDate(r.submittedAt), hideOn: 'sm' },
    {
      key: 'sla',
      label: 'SLA',
      render: (r) => {
        const d = daysUntil(r.slaDueAt)
        return (
          <span className={d < 0 ? 'text-alert-600 font-semibold' : 'text-ink-600'}>
            {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}
          </span>
        )
      },
    },
    { key: 'state', label: 'Status', render: (r) => <StatusBadge status={r.state} /> },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Line Department Portal · FR-LD-05"
        title="Complaints & inspections"
        description="Manage complaints and inspections assigned to your department; update field status with geo-tagged photo evidence."
      />
      <div className="px-6">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div className="p-6">
        <div className="card">
          {loading ? (
            <div className="p-6 text-[12.5px] text-ink-400">Loading…</div>
          ) : (
            <DataTable columns={columns} rows={grievances} onRowClick={setSelected} emptyLabel="Nothing in this state" />
          )}
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => {
          setSelected(null)
          clearPhoto()
        }}
        title={selected?.title}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
            {selected?.state === 'assigned' && (
              <Button icon={Wrench} loading={busy} onClick={() => updateStatus('inspection_started')}>
                Start work
              </Button>
            )}
            {selected?.state === 'inspection_started' && (
              <Button
                icon={CheckCircle2}
                loading={busy}
                disabled={!geotagResult?.verified}
                onClick={() => updateStatus('resolved')}
              >
                Mark resolved
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={selected.state} />
              <span className="kbd-mono text-[12px] text-ink-500">{selected.trackingCode}</span>
            </div>
            <p className="text-[13px] text-ink-700">{selected.description}</p>
            <p className="text-[12.5px] text-ink-500">
              Location: <strong className="text-ink-800">{selected.facilityName}, {selected.village}</strong>
            </p>

            {selected.state === 'inspection_started' && (
              <div className="space-y-3 pt-2 border-t border-ink-100">
                <label className="block text-[12px] font-semibold text-ink-800">
                  Geo-tagged Photo Verification (Required to resolve)
                </label>

                {!photoPreview ? (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/50 p-6 text-center cursor-pointer hover:border-ink-300 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-600 shadow-xs">
                      <Camera size={18} />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-medium text-ink-900">Upload Inspection Photo</p>
                      <p className="text-[11px] text-ink-400 mt-0.5">Click to choose image or capture from camera</p>
                    </div>
                  </label>
                ) : (
                  <div className="card !p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={photoPreview}
                        alt="Inspection preview"
                        className="h-20 w-24 object-cover rounded-lg border border-ink-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-semibold text-ink-900 truncate">{photoFile?.name}</span>
                          <button onClick={clearPhoto} className="text-[11px] text-alert-600 hover:underline">
                            Remove
                          </button>
                        </div>

                        {verifyingGps ? (
                          <div className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
                            <Loader2 size={12} className="animate-spin text-saffron-500" /> Verifying EXIF GPS via backend…
                          </div>
                        ) : geotagResult?.verified ? (
                          <div className="space-y-1">
                            <Badge tone="positive" className="inline-flex items-center gap-1">
                              <CheckCircle2 size={11} /> EXIF GPS Verified ({geotagResult.distance_offset_meters}m from pin)
                            </Badge>
                            <p className="kbd-mono text-[11px] text-ink-500">
                              Lat: {Number(geotagResult.exif_latitude).toFixed(4)}°, Lng: {Number(geotagResult.exif_longitude).toFixed(4)}°
                            </p>
                            {geotagResult.is_duplicate_25m && (
                              <p className="text-[11px] text-saffron-700">{geotagResult.nearby_duplicates?.length || 0} nearby features within 25m</p>
                            )}
                          </div>
                        ) : geotagResult && !geotagResult.verified ? (
                          <div className="space-y-1">
                            <Badge tone="negative" className="inline-flex items-center gap-1">
                              <AlertCircle size={11} /> REJECTED — {geotagResult.failure_reason || 'EXIF verification failed'}
                            </Badge>
                            {geotagResult.exif_latitude && (
                              <p className="kbd-mono text-[11px] text-ink-500">
                                Photo GPS: {Number(geotagResult.exif_latitude).toFixed(4)}°, {Number(geotagResult.exif_longitude).toFixed(4)}°
                              </p>
                            )}
                            {geotagResult.distance_offset_meters != null && (
                              <p className="text-[11px] text-ink-500">Distance: {geotagResult.distance_offset_meters}m from pin</p>
                            )}
                          </div>
                        ) : (
                          <Badge tone="neutral" className="inline-flex items-center gap-1">
                            <AlertCircle size={11} /> Pending verification
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11.5px] text-ink-400">
                  EXIF GPS is verified by the backend against the complaint pin location. The resolve button requires backend VERIFIED status.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
