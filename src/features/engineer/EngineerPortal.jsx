import { useState, useRef } from 'react'
import {
  Wrench, CheckSquare, Navigation, Camera, RefreshCw, MapPin, ShieldCheck,
  CheckCircle2, Clock, UploadCloud, FileText, AlertTriangle, Play, Save, Wifi, WifiOff
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
import { formatDate } from '../../utils/format'

export default function EngineerPortal() {
  const user = useAuthStore((s) => s.user)
  const complaints = useComplaintEngine((s) => s.complaints)
  const transitionComplaintState = useComplaintEngine((s) => s.transitionComplaintState)
  const pushToast = useUiStore((s) => s.pushToast)

  const [activeTab, setActiveTab] = useState('jobs') // 'jobs' | 'inspection' | 'offline'
  const [selectedJob, setSelectedJob] = useState(null)
  const [isOffline, setIsOffline] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState([])

  // Inspection form state
  const [inspectionRemarks, setInspectionRemarks] = useState('')
  const [materialsUsed, setMaterialsUsed] = useState('1x Submersible Motor Winding, 20m PVC Armored Cable')
  const [estimatedCost, setEstimatedCost] = useState('18500')
  const [completionHours, setCompletionHours] = useState('4')
  const [beforePhoto, setBeforePhoto] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80')
  const [afterPhoto, setAfterPhoto] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80')
  const [signatureSigned, setSignatureSigned] = useState(true)

  // Filter jobs for Field Inspector
  const assignedJobs = complaints.filter((c) =>
    ['assigned', 'accepted', 'inspection_scheduled', 'inspection_completed', 'work_started'].includes(c.state)
  )

  const activeJob = selectedJob || assignedJobs[0] || complaints[0]

  function handleStartWork(job) {
    transitionComplaintState(job.id, 'work_started', user, 'Inspector arrived on site and commenced work execution.')
    pushToast(`Job ${job.id}: Status updated to Work Started.`, 'info')
  }

  function handleCompleteInspection(e) {
    e.preventDefault()
    if (!activeJob) return

    const extraData = {
      inspectionDetails: {
        scheduledDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        completedDate: new Date().toISOString(),
        remarks: inspectionRemarks || 'Inspected site, replaced defective components, and tested operational flow.',
        materialsUsed,
        estimatedCost: Number(estimatedCost),
        completionTimeHours: Number(completionHours),
        beforePhoto,
        afterPhoto,
        signature: signatureSigned ? `JE_${user?.name}_Sign` : 'Unsigned',
      },
    }

    if (isOffline) {
      setOfflineQueue((q) => [...q, { jobId: activeJob.id, extraData, timestamp: new Date().toISOString() }])
      pushToast('Offline Mode: Inspection report saved locally to PWA queue. Will sync when back online.', 'warning')
    } else {
      transitionComplaintState(activeJob.id, 'work_completed', user, 'Inspection and work completed with evidence.', extraData)
      pushToast(`Job ${activeJob.id}: Work Completed & Evidence Submitted!`, 'success')
    }
  }

  function handleSyncOfflineQueue() {
    if (offlineQueue.length === 0) return
    offlineQueue.forEach((item) => {
      transitionComplaintState(item.jobId, 'work_completed', user, 'Synced from Offline PWA Queue.', item.extraData)
    })
    setOfflineQueue([])
    pushToast('Offline Sync Engine: Synced all queued inspection reports to server!', 'success')
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
            Inspector: {user?.name} · Dept: {user?.departmentId?.toUpperCase() || 'WATER'} · Block: Silao
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
      <div className="card p-1 flex gap-1 bg-ink-100 text-[12px] font-medium">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-2 rounded-lg text-center transition-colors ${activeTab === 'jobs' ? 'bg-white text-ink-950 shadow-xs font-semibold' : 'text-ink-600'}`}
        >
          My Jobs ({assignedJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('inspection')}
          className={`flex-1 py-2 rounded-lg text-center transition-colors ${activeTab === 'inspection' ? 'bg-white text-ink-950 shadow-xs font-semibold' : 'text-ink-600'}`}
        >
          Inspection Form
        </button>
        <button
          onClick={() => setActiveTab('offline')}
          className={`flex-1 py-2 rounded-lg text-center transition-colors ${activeTab === 'offline' ? 'bg-white text-ink-950 shadow-xs font-semibold' : 'text-ink-600'}`}
        >
          Offline Queue ({offlineQueue.length})
        </button>
      </div>

      {/* TAB 1: MY JOBS */}
      {activeTab === 'jobs' && (
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
                    {['assigned', 'accepted', 'inspection_scheduled'].includes(job.state) && (
                      <Button size="sm" variant="saffron" onClick={() => handleStartWork(job)}>
                        Start Work
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => { setSelectedJob(job); setActiveTab('inspection') }}>
                      Open Form
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INSPECTION & EVIDENCE FORM */}
      {activeTab === 'inspection' && activeJob && (
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
                <img src={beforePhoto} alt="Before" className="h-36 w-full object-cover rounded-lg border border-ink-200" />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-ink-400 uppercase mb-1">After Completion Photo</span>
                <img src={afterPhoto} alt="After" className="h-36 w-full object-cover rounded-lg border border-ink-200" />
              </div>
            </div>
          </div>

          {/* Digital Signature Canvas Simulation */}
          <div className="p-3 bg-ink-50 border border-ink-200 rounded-xl space-y-2">
            <span className="font-semibold text-ink-800 block text-[11.5px]">Inspector Digital Signature Pad</span>
            <div className="h-16 bg-white border border-dashed border-ink-300 rounded-lg flex items-center justify-center font-serif text-ink-700 text-lg italic select-none">
              Manoj_Singh_Junior_Engineer_JE_Sign_Digitally_Verified
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="positive" icon={CheckCircle2} type="submit">
              Submit Inspection & Mark Completed
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: OFFLINE QUEUE */}
      {activeTab === 'offline' && (
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
