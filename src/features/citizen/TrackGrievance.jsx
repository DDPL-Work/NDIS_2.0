import { useState } from 'react'
import { Search, AlertCircle } from 'lucide-react'
import { workflowApi } from '../../services/api'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import GrievanceTimeline from '../shared/GrievanceTimeline'
import { DEPARTMENT_MAP } from '../../config/constants'
import { useI18n } from '../../i18n/i18n'

export default function TrackGrievance() {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [result, setResult] = useState(undefined) // undefined = not searched, null = not found
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    try {
      const found = await workflowApi.trackGrievance(code)
      setResult(found)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-display font-semibold text-ink-950">{t('citizen.trackGrievance')}</h2>
        <p className="text-[13px] text-ink-500 mt-1">Enter the tracking code you received when submitting a grievance.</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2.5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. NDISP-HE100001"
            className="w-full rounded-lg border border-ink-200 pl-9 pr-3 py-2.5 text-[13px] kbd-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
          />
        </div>
        <Button type="submit" loading={loading}>Track</Button>
      </form>

      {result === null && (
        <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-alert-200 bg-alert-50 px-4 py-3 text-[13px] text-alert-600">
          <AlertCircle size={16} /> No grievance found for that tracking code. Double-check and try again.
        </div>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader
            title={result.title}
            subtitle={`${DEPARTMENT_MAP[result.departmentId]?.label} · ${result.facilityName}, ${result.village}`}
            action={<Badge tone="neutral" className="kbd-mono">{result.trackingCode}</Badge>}
          />
          <CardBody>
            <GrievanceTimeline state={result.state} submittedAt={result.submittedAt} slaDueAt={result.slaDueAt} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
