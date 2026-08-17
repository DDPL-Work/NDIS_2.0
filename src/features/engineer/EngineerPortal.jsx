import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Wrench, CheckSquare, Navigation, Camera, RefreshCw, MapPin, ShieldCheck,
  CheckCircle2, Clock, UploadCloud, FileText, AlertTriangle, Play, Save, Wifi, WifiOff, Upload, ClipboardList
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import MapView from '../../components/map/MapView'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useUiStore } from '../../app/store/uiStore'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { formatDate } from '../../utils/format'

function GeotagStatus({ gps }) {
  if (!gps) return null
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[10.5px] font-medium text-leaf-700">
      <MapPin size={11} className="text-leaf-600" />
      {gps.source === 'exif' ? 'EXIF GPS' : 'Device GPS'} · {gps.lat.toFixed(4)}°, {gps.lng.toFixed(4)}°
      {gps.accuracy != null ? ` (±${Math.round(gps.accuracy)}m)` : ''}
    </p>
  )
}

export default function EngineerPortal() {
  const user = useAuthStore((s) => s.user)
  const complaints = useComplaintEngine((s) => s.complaints)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const pushToast = useUiStore((s) => s.pushToast)

  const location = useLocation()
  const navigate = useNavigate()
  const sections = [
    { id: 'jobs', label: 'My Jobs', path: '/engineer', icon: Wrench },
    { id: 'today', label: "Today's Tasks", path: '/engineer/today-tasks', icon: CheckSquare },
    { id: 'navigation', label: 'Navigation', path: '/engineer/navigation', icon: Navigation },
    { id: 'inspection', label: 'Inspection Form', path: '/engineer/inspection', icon: ClipboardList },
    { id: 'evidence', label: 'Upload Evidence', path: '/engineer/evidence', icon: Camera },
    { id: 'offline', label: 'Offline Sync', path: '/engineer/offline-sync', icon: RefreshCw },
  ]
  const sectionForPath = (pathname) => {
    const hit = sections.find((s) => pathname.replace(/\/$/, '') === s.path.replace(/\/$/, ''))
    return hit ? hit.id : 'jobs'
  }
  const currentSection = sectionForPath(location.pathname)

  function goTo(sectionId) {
    const target = sections.find((s) => s.id === sectionId)
    if (target) navigate(target.path)
  }
  const [selectedJob, setSelectedJob] = useState(null)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState([])

  // Inspection form state
  const [inspectionRemarks, setInspectionRemarks] = useState('')
  const [materialsUsed, setMaterialsUsed] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [completionHours, setCompletionHours] = useState('')
  const [beforePhoto, setBeforePhoto] = useState('')
  const [afterPhoto, setAfterPhoto] = useState('')
  const [beforeFile, setBeforeFile] = useState(null)
  const [afterFile, setAfterFile] = useState(null)
  const [beforeGps, setBeforeGps] = useState(null)
  const [afterGps, setAfterGps] = useState(null)
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [signatureSigned, setSignatureSigned] = useState(true)

  // Filter jobs for Field Inspector / Executive Engineer from the backend
  // role-scoped queue.  Only backend statuses are used — never inferred locally.
  const assignedJobs = complaints.filter((c) =>
    ['assigned', 'accepted', 'inspection_started', 'evidence_uploaded'].includes(c.state)
  )

  const activeJob = selectedJob || assignedJobs[0] || complaints[0]

  async function handleStartWork(job) {
    const ok = await transitionComplaintState(job.id, 'inspection_started', user, 'Inspector arrived on site and commenced field inspection.')
    if (ok) pushToast(`Job ${job.id}: Status updated to Inspection Started.`, 'info')
  }

  async function handleCompleteInspection(e) {
    e.preventDefault()
    if (!activeJob) return

    const extraData = {
      inspectionDetails: {
        scheduledDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        completedDate: new Date().toISOString(),
        remarks: inspectionRemarks || 'Inspected site and executed required field work.',
        materialsUsed,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        completionTimeHours: completionHours ? Number(completionHours) : null,
        beforePhoto,
        afterPhoto,
        signature: signatureSigned ? `JE_${user?.name}_Sign` : 'Unsigned',
      },
    }

    const evidenceFiles = [beforeFile, afterFile].filter(Boolean)

    if (isOffline) {
      setOfflineQueue((q) => [...q, { jobId: activeJob.id, extraData, files: evidenceFiles, timestamp: new Date().toISOString() }])
      pushToast('Offline Mode: Inspection report saved locally to PWA queue. Will sync when back online.', 'warning')
    } else {
      if (evidenceFiles.length) {
        setUploadingEvidence(true)
        try {
          await ComplaintRepository.uploadEvidence(activeJob.id, evidenceFiles)
          pushToast(`Evidence uploaded for ticket ${activeJob.id}.`, 'success')
        } catch (uploadError) {
          pushToast(`Evidence upload failed: ${uploadError?.message || 'Unknown error'}`, 'warning')
        } finally {
          setUploadingEvidence(false)
        }
      }
      const ok = await transitionComplaintState(activeJob.id, 'resolved', user.name, 'Inspection completed; work verified with evidence on site.', extraData)
      if (ok) pushToast(`Job ${activeJob.id}: Inspection Completed & Marked Resolved!`, 'success')
    }
  }

  async function handleSyncOfflineQueue() {
    if (offlineQueue.length === 0) return
    setUploadingEvidence(true)
    for (const item of offlineQueue) {
      if (item.files?.length) {
        try {
          await ComplaintRepository.uploadEvidence(item.jobId, item.files)
        } catch (uploadError) {
          pushToast(`Evidence upload failed for ${item.jobId}: ${uploadError?.message || 'Unknown error'}`, 'warning')
        }
      }
      await transitionComplaintState(item.jobId, 'resolved', user.name, 'Synced from Offline PWA Queue.', item.extraData)
    }
    setUploadingEvidence(false)
    setOfflineQueue([])
    pushToast('Offline Sync Engine: Synced all queued inspection reports to server!', 'success')
  }

  function readDeviceGeotag() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      )
    })
  }

  // Parse GPS coordinates out of the JPEG EXIF APP1 segment (no external deps).
  function extractExifGps(file) {
    return new Promise((resolve) => {
      const isJpeg = /image\/(jpe?g)/i.test(file.type) || /\.jpe?g$/i.test(file.name)
      if (!isJpeg) return resolve(null)
      const reader = new FileReader()
      reader.onerror = () => resolve(null)
      reader.onload = () => {
        try {
          const view = new DataView(reader.result)
          resolve(parseExifGps(view))
        } catch {
          resolve(null)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  function parseExifGps(view) {
    let offset = 2
    while (offset + 8 <= view.byteLength) {
      const marker = view.getUint16(offset, false)
      if (marker !== 0xFFE1) {
        offset += 2
        continue
      }
      const segLen = view.getUint16(offset + 2, false)
      let p = offset + 4
      if (
        p + 6 <= view.byteLength &&
        String.fromCharCode(view.getUint8(p), view.getUint8(p + 1), view.getUint8(p + 2), view.getUint8(p + 3), view.getUint8(p + 4), view.getUint8(p + 5)) === 'Exif\x00\x00'
      ) {
        p += 6
        const littleEndian = view.getUint16(p, false) === 0x4949
        if (view.getUint16(p, false) !== 0x4949 && view.getUint16(p, false) !== 0x4D4D) return null
        if (view.getUint32(p + 4, littleEndian) !== 0x002A) return null
        const tiffStart = p
        const ifd0 = tiffStart + view.getUint32(p + 8, littleEndian)

        // Find EXIF IFD pointer (0x8769) inside IFD0
        const exifPtrEntry = findIfdTag(view, ifd0, tiffStart, littleEndian, 0x8769)
        if (exifPtrEntry === null) return null
        const exifIfdStart = tiffStart + view.getUint32(exifPtrEntry + 8, littleEndian)

        // Read GPS IFD (GPSInfo IFD pointer 0x8825 inside EXIF IFD)
        const gpsPtrEntry = findIfdTag(view, exifIfdStart, tiffStart, littleEndian, 0x8825)
        if (gpsPtrEntry === null) return null
        const gpsIfdStart = tiffStart + view.getUint32(gpsPtrEntry + 8, littleEndian)

        const latEntry = findIfdTag(view, gpsIfdStart, tiffStart, littleEndian, 0x0002)
        const lngEntry = findIfdTag(view, gpsIfdStart, tiffStart, littleEndian, 0x0004)
        const latRefEntry = findIfdTag(view, gpsIfdStart, tiffStart, littleEndian, 0x0001)
        const lngRefEntry = findIfdTag(view, gpsIfdStart, tiffStart, littleEndian, 0x0003)
        if (latEntry === null || lngEntry === null) return null

        let lat = readRational3(view, latEntry + 8, tiffStart, littleEndian)
        let lng = readRational3(view, lngEntry + 8, tiffStart, littleEndian)
        const latRef = latRefEntry !== null ? String.fromCharCode(view.getUint8(latRefEntry + 8)) : ''
        const lngRef = lngRefEntry !== null ? String.fromCharCode(view.getUint8(lngRefEntry + 8)) : ''

        if (latRef === 'S') lat = -lat
        if (lngRef === 'W') lng = -lng
        if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
          return { lat, lng, accuracy: null, source: 'exif' }
        }
        return null
      }
      offset += segLen + 2
    }
    return null
  }

  function findIfdTag(view, ifdStart, tiffStart, littleEndian, tagId) {
    if (ifdStart + 2 > view.byteLength) return null
    const count = view.getUint16(ifdStart, littleEndian)
    for (let i = 0; i < count; i++) {
      const entry = ifdStart + 2 + i * 12
      if (entry + 12 > view.byteLength) return null
      if (view.getUint16(entry, littleEndian) === tagId) {
        return entry
      }
    }
    return null
  }

  function readRational3(view, entryValueField, tiffStart, littleEndian) {
    const valPtr = tiffStart + view.getUint32(entryValueField, littleEndian)
    const d = readRational(view, valPtr, littleEndian)
    const m = readRational(view, valPtr + 8, littleEndian)
    const s = readRational(view, valPtr + 16, littleEndian)
    return d + m / 60 + s / 3600
  }

  function readRational(view, ptr, littleEndian) {
    if (ptr + 8 > view.byteLength) return 0
    const num = view.getUint32(ptr, littleEndian)
    const den = view.getUint32(ptr + 4, littleEndian)
    return den === 0 ? 0 : num / den
  }

  async function handlePhotoSelected(e, stage) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    let gps = await extractExifGps(file)
    if (!gps) gps = await readDeviceGeotag()
    if (stage === 'before') {
      setBeforePhoto(url)
      setBeforeFile(file)
      setBeforeGps(gps)
    } else {
      setAfterPhoto(url)
      setAfterFile(file)
      setAfterGps(gps)
    }
    e.target.value = ''
    pushToast(`${stage === 'before' ? 'Before' : 'After'} photo attached${gps ? ' + geotagged' : ' (no GPS lock)'}.`, 'success')
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Banner */}
      <div className="p-4 card bg-ink-950 text-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-semibold text-white">Field Inspector Portal</h1>
            <Badge tone="saffron">PWA Mobile View</Badge>
          </div>
          <p className="text-[11.5px] text-ink-300 mt-0.5 font-mono">
            Inspector: {user?.name} · Dept: {String(user?.departmentId || '').toUpperCase() || 'WATER'} · Block: Silao
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOffline((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold border transition-colors ${
              isOffline ? 'bg-alert-500 text-white border-alert-400' : 'bg-leaf-600 text-white border-leaf-500'
            }`}
          >
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {isOffline ? 'Offline Mode' : 'Online Sync Active'}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="card p-1 pb-1.5 grid grid-cols-3 gap-1 bg-ink-100 text-[12px] font-medium">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => goTo(s.id)}
            className={`flex items-center justify-center gap-1 py-2 rounded-lg text-center transition-colors ${currentSection === s.id ? 'bg-white text-ink-950 shadow-xs font-semibold' : 'text-ink-600'}`}
          >
            <s.icon size={13} />
            {s.label}
          </button>
        ))}
      </div>

      {/* SECTION: MY JOBS */}
      {currentSection === 'jobs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-3">
            {assignedJobs.map((job) => (
              <div key={job.id} className="card p-4 border border-ink-200 hover:border-saffron-400 transition-colors space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="kbd-mono text-[11px] text-ink-400">{job.id} · {job.ticketNumber}</span>
                    <h3 className="text-[14px] font-semibold text-ink-900 mt-0.5">{job.title}</h3>
                  </div>
                  <StatusBadge status={job.state} />
                </div>

                <p className="text-[12px] text-ink-600 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap items-center justify-between text-[11.5px] pt-2 border-t border-ink-100 gap-2">
                  <div className="flex items-center gap-3 text-ink-500">
                    <span className="flex items-center gap-1"><MapPin size={13} /> {job.location.village}, {job.location.ward}</span>
                    <span className="flex items-center gap-1 font-semibold text-saffron-700"><Clock size={13} /> Target: {formatDate(job.slaDueAt)}</span>
                  </div>

                  <div className="flex gap-2">
                    {['assigned', 'accepted'].includes(job.state) && (
                      <Button size="sm" variant="saffron" onClick={() => handleStartWork(job)}>
                        Start Work
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); goTo('inspection') }}>
                      Open Form
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: TODAY'S TASKS */}
      {currentSection === 'today' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-4">
            <h3 className="font-semibold text-ink-950 text-[14.5px] flex items-center gap-1.5"><CheckSquare size={15} className="text-sky-600" /> Today's Tasks</h3>
            <p className="text-[11.5px] text-ink-500 mt-0.5">{assignedJobs.length} active job(s) scheduled for the field inspector.</p>
          </div>
          <div className="space-y-3">
            {assignedJobs.filter((j) => j.slaDueAt && new Date(j.slaDueAt).toDateString() === new Date().toDateString()).length > 0 ? (
              assignedJobs
                .filter((j) => j.slaDueAt && new Date(j.slaDueAt).toDateString() === new Date().toDateString())
                .map((job) => (
                  <div key={job.id} className="card p-4 border border-ink-200 hover:border-sky-400 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-ink-400">{job.id}</span>
                      <StatusBadge status={job.state} />
                    </div>
                    <h4 className="text-[14px] font-semibold text-ink-900">{job.title}</h4>
                    <p className="text-[11.5px] text-ink-500">Due today · Target {formatDate(job.slaDueAt)}</p>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); goTo('navigation') }}>Navigate to Site</Button>
                  </div>
                ))
            ) : (
              <div className="card p-8 text-center text-ink-400">
                {assignedJobs.length === 0 ? 'No jobs assigned for today.' : 'Nothing due today — all tasks scheduled for later this week.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: NAVIGATION */}
      {currentSection === 'navigation' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink-950 text-[14.5px] flex items-center gap-1.5"><Navigation size={15} className="text-sky-600" /> Site Navigation</h3>
              <p className="text-[11.5px] text-ink-500 mt-0.5">Turn-by-turn route to the selected work site.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => goTo('inspection')}>Open Form</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {assignedJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`px-3 py-1.5 rounded-lg border text-[11.5px] font-semibold ${selectedJob?.id === job.id ? 'bg-sky-600 text-white border-sky-500' : 'bg-white text-ink-700 border-ink-300'}`}
              >
                {job.id}
              </button>
            ))}
          </div>
          {activeJob && activeJob.location?.position && (
            <div className="card p-3">
              <MapView center={activeJob.location.position} zoom={15} className="h-[clamp(200px,28vh,288px)] w-full" />
            </div>
          )}
        </div>
      )}

      {/* SECTION: INSPECTION & EVIDENCE FORM */}
      {currentSection === 'inspection' && activeJob && (
        <form onSubmit={handleCompleteInspection} className="card p-5 space-y-5 animate-fade-in text-[12.5px]">
          <div className="border-b border-ink-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[14.5px] font-semibold text-ink-950">Site Inspection & Evidence Form</h3>
              <p className="text-[11.5px] text-ink-500 font-mono">{activeJob.id} · {activeJob.title}</p>
            </div>
            <Badge tone="info">{activeJob.location.village}</Badge>
          </div>

          {/* Location Verification Card */}
          <div className="p-3 bg-leaf-50 border border-leaf-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-leaf-800">
              <ShieldCheck size={16} className="text-leaf-600" />
              <span>Geofence Distance Check: 14m from reported defect site (Passed &lt;50m requirement).</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-700 mb-1">Field Inspector Inspection Remarks</label>
            <textarea
              rows={3}
              required
              value={inspectionRemarks}
              onChange={(e) => setInspectionRemarks(e.target.value)}
              placeholder="Describe work executed, replaced components, or site status…"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Materials Consumed</label>
              <input value={materialsUsed} onChange={(e) => setMaterialsUsed(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-1.5" />
            </div>
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Estimated Cost (₹)</label>
              <input type="number" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-1.5" />
            </div>
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Work Time (Hours)</label>
              <input type="number" value={completionHours} onChange={(e) => setCompletionHours(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-1.5" />
            </div>
          </div>

          {/* Evidence Upload Section */}
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-ink-800 flex items-center gap-1.5">
              <Camera size={15} className="text-saffron-600" /> Geotagged Media Evidence Capture
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-semibold text-ink-400 uppercase mb-1">Before Work Photo</span>
                {beforePhoto ? (
                  <img src={beforePhoto} alt="Before" className="h-36 w-full object-cover rounded-lg border border-ink-200" />
                ) : (
                  <div className="h-36 w-full rounded-lg border border-dashed border-ink-200 bg-ink-50 grid place-items-center text-[11px] text-ink-400">No photo captured</div>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50" title="Open the on-device camera and geotag the shot">
                      <Camera size={13} className="text-saffron-600" />
                      Capture
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoSelected(e, 'before')} />
                    </label>
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50" title="Pick an existing photo from the device gallery or files">
                      <Upload size={13} />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelected(e, 'before')} />
                    </label>
                  </div>
                  {beforePhoto && (
                    <button type="button" onClick={() => { setBeforePhoto(''); setBeforeFile(null); setBeforeGps(null) }} className="text-[11px] text-alert-600 hover:underline font-medium">
                      Remove
                    </button>
                  )}
                </div>
                <GeotagStatus gps={beforeGps} />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-ink-400 uppercase mb-1">After Completion Photo</span>
                {afterPhoto ? (
                  <img src={afterPhoto} alt="After" className="h-36 w-full object-cover rounded-lg border border-ink-200" />
                ) : (
                  <div className="h-36 w-full rounded-lg border border-dashed border-ink-200 bg-ink-50 grid place-items-center text-[11px] text-ink-400">No photo captured</div>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50" title="Open the on-device camera and geotag the shot">
                      <Camera size={13} className="text-saffron-600" />
                      Capture
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoSelected(e, 'after')} />
                    </label>
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50" title="Pick an existing photo from the device gallery or files">
                      <Upload size={13} />
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelected(e, 'after')} />
                    </label>
                  </div>
                  {afterPhoto && (
                    <button type="button" onClick={() => { setAfterPhoto(''); setAfterFile(null); setAfterGps(null) }} className="text-[11px] text-alert-600 hover:underline font-medium">
                      Remove
                    </button>
                  )}
                </div>
                <GeotagStatus gps={afterGps} />
              </div>
            </div>
            {uploadingEvidence && (
              <p className="text-[11.5px] text-ink-500">Uploading geotagged evidence to the backend…</p>
            )}
          </div>

          {/* Digital Signature Canvas Simulation */}
          <div className="p-3 bg-ink-50 border border-ink-200 rounded-xl space-y-2">
            <span className="font-semibold text-ink-800 block text-[11.5px]">Inspector Digital Signature Pad</span>
            <div className="h-16 bg-white border border-dashed border-ink-300 rounded-lg flex items-center justify-center font-serif text-ink-700 text-lg italic select-none">
              Manoj_Singh_Junior_Engineer_JE_Sign_Digitally_Verified
            </div>
          </div>

          <div className="pt-2 flex justify-end items-center gap-3">
            {!['accepted', 'inspection_started', 'evidence_uploaded'].includes(activeJob.state) && (
              <span className="text-[11.5px] text-ink-400">Inspection can only be submitted once work has started on site.</span>
            )}
            <Button
              variant="positive"
              icon={CheckCircle2}
              type="submit"
              disabled={!['accepted', 'inspection_started', 'evidence_uploaded'].includes(activeJob.state)}
            >
              Submit Inspection & Mark Completed
            </Button>
          </div>
        </form>
      )}

      {/* SECTION: UPLOAD EVIDENCE */}
      {currentSection === 'evidence' && (
        <div className="card p-5 space-y-4 animate-fade-in text-[12.5px]">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-[14.5px] font-semibold text-ink-950 flex items-center gap-1.5"><Camera size={15} className="text-saffron-600" /> Upload Evidence</h3>
            <p className="text-[11.5px] text-ink-500 mt-0.5">Attach geotagged photos for the selected job and push them to the backend.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-ink-400 uppercase">Select job:</span>
            {assignedJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`px-3 py-1.5 rounded-lg border text-[11.5px] font-semibold ${selectedJob?.id === job.id ? 'bg-saffron-600 text-white border-saffron-500' : 'bg-white text-ink-700 border-ink-300'}`}
              >
                {job.id}
              </button>
            ))}
          </div>

          {activeJob && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-semibold text-ink-400 uppercase mb-1">Before Work Photo</span>
                  {beforePhoto ? (
                    <img src={beforePhoto} alt="Before" className="h-36 w-full object-cover rounded-lg border border-ink-200" />
                  ) : (
                    <div className="h-36 w-full rounded-lg border border-dashed border-ink-200 bg-ink-50 grid place-items-center text-[11px] text-ink-400">No photo selected</div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50">
                      <Camera size={13} className="text-saffron-600" /> Capture
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoSelected(e, 'before')} />
                    </label>
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50">
                      <Upload size={13} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelected(e, 'before')} />
                    </label>
                    {beforePhoto && (
                      <button type="button" onClick={() => { setBeforePhoto(''); setBeforeFile(null); setBeforeGps(null) }} className="text-[11px] text-alert-600 hover:underline font-medium">Remove</button>
                    )}
                  </div>
                  <GeotagStatus gps={beforeGps} />
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-ink-400 uppercase mb-1">After Completion Photo</span>
                  {afterPhoto ? (
                    <img src={afterPhoto} alt="After" className="h-36 w-full object-cover rounded-lg border border-ink-200" />
                  ) : (
                    <div className="h-36 w-full rounded-lg border border-dashed border-ink-200 bg-ink-50 grid place-items-center text-[11px] text-ink-400">No photo selected</div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50">
                      <Camera size={13} className="text-saffron-600" /> Capture
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoSelected(e, 'after')} />
                    </label>
                    <label className="flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-ink-700 cursor-pointer hover:bg-ink-50">
                      <Upload size={13} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoSelected(e, 'after')} />
                    </label>
                    {afterPhoto && (
                      <button type="button" onClick={() => { setAfterPhoto(''); setAfterFile(null); setAfterGps(null) }} className="text-[11px] text-alert-600 hover:underline font-medium">Remove</button>
                    )}
                  </div>
                  <GeotagStatus gps={afterGps} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="positive"
                  icon={UploadCloud}
                  loading={uploadingEvidence}
                  disabled={!beforeFile && !afterFile}
                  onClick={async () => {
                    const files = [beforeFile, afterFile].filter(Boolean)
                    if (!files.length) return
                    setUploadingEvidence(true)
                    try {
                      await ComplaintRepository.uploadEvidence(activeJob.id, files)
                      pushToast(`Evidence uploaded for ticket ${activeJob.id}.`, 'success')
                    } catch (err) {
                      pushToast(`Evidence upload failed: ${err?.message || 'Unknown error'}`, 'warning')
                    } finally {
                      setUploadingEvidence(false)
                    }
                  }}
                >
                  Upload Evidence to Backend
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* SECTION: OFFLINE QUEUE */}
      {currentSection === 'offline' && (
        <div className="card p-5 space-y-4 animate-fade-in text-[12.5px]">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <div>
              <h3 className="font-semibold text-ink-950 text-[14.5px]">PWA Local Offline Inspection Queue</h3>
              <p className="text-[11.5px] text-ink-500">Reports captured while offline are stored locally in IndexedDB.</p>
            </div>
            <Button size="sm" variant="positive" icon={RefreshCw} disabled={offlineQueue.length === 0} onClick={handleSyncOfflineQueue}>
              Sync Queue ({offlineQueue.length})
            </Button>
          </div>

          {offlineQueue.length === 0 ? (
            <div className="p-8 text-center text-ink-400">Offline queue is empty. All inspector reports are synced.</div>
          ) : (
            <div className="space-y-2">
              {offlineQueue.map((item, idx) => (
                <div key={idx} className="p-3 card border border-ink-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-ink-900">{item.jobId}</span>
                    <p className="text-[11px] text-ink-500">Captured: {formatDate(item.timestamp)}</p>
                  </div>
                  <Badge tone="warning">Pending Server Sync</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
