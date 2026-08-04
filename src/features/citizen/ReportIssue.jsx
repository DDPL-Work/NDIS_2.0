import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Camera, ArrowLeft } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { gisApi, workflowApi } from '../../services/api'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { DEPARTMENTS } from '../../config/constants'
import { useUiStore } from '../../app/store/uiStore'

export default function ReportIssue() {
  const { facilityId } = useParams()
  const navigate = useNavigate()
  const pushToast = useUiStore((s) => s.pushToast)
  const { data: facility } = useAsync(() => (facilityId ? gisApi.getFacility(facilityId) : Promise.resolve(null)), [facilityId])

  const [departmentId, setDepartmentId] = useState(facility?.departmentId || DEPARTMENTS[0].id)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photoAttached, setPhotoAttached] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  useEffect(() => {
    if (facility) setDepartmentId(facility.departmentId)
  }, [facility])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const grievance = await workflowApi.submitGrievance({
        departmentId,
        title,
        description,
        linkedFacilityId: facility?.id || null,
        facilityName: facility?.name || 'Unlinked location',
        village: facility?.village || '—',
        hasPhoto: photoAttached,
      })
      setCreated(grievance)
      pushToast('Grievance submitted successfully.', 'success')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-leaf-100 text-leaf-600 mb-4">
          <CheckCircle2 size={26} />
        </div>
        <h2 className="text-lg font-display font-semibold text-ink-950">Grievance submitted</h2>
        <p className="text-[13px] text-ink-500 mt-1.5">
          It has been auto-routed to the relevant line department. Save your tracking code to follow progress.
        </p>
        <div className="mt-5 inline-block rounded-xl border border-dashed border-ink-300 px-5 py-3">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Tracking code</p>
          <p className="kbd-mono text-lg font-semibold text-ink-950">{created.trackingCode}</p>
        </div>
        <div className="flex justify-center gap-2.5 mt-6">
          <Button variant="outline" onClick={() => navigate('/citizen')}>Back to map</Button>
          <Button onClick={() => navigate('/citizen/grievance/track')}>Track this grievance</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-800 mb-4">
        <ArrowLeft size={14} /> Back
      </button>
      <Card>
        <CardHeader title="Report an issue" subtitle={facility ? `Linked to ${facility.name}, ${facility.village}` : 'Not linked to a specific facility'} />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-ink-600">Department</label>
              <Select
                className="w-full mt-1"
                value={departmentId}
                onChange={setDepartmentId}
                options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-ink-600">Issue title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken hand pump near primary school"
                required
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-ink-600">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what you observed…"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setPhotoAttached((v) => !v)}
              className={`w-full flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-[12.5px] font-medium transition-colors ${photoAttached ? 'border-leaf-400 bg-leaf-50 text-leaf-700' : 'border-ink-300 text-ink-500 hover:border-ink-400'}`}
            >
              <Camera size={15} /> {photoAttached ? 'Geo-tagged photo attached' : 'Attach geo-tagged photo (optional)'}
            </button>
            <p className="text-[11.5px] text-ink-400 leading-relaxed">
              Photo EXIF location is validated against the asset location (200m tolerance) to detect mis-tagged uploads before reaching the department.
            </p>
            <Button type="submit" className="w-full" loading={submitting} size="lg">Submit grievance</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
