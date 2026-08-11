import { Link } from 'react-router-dom'
import { Sparkles, Inbox } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import GapScoreRing from '../../../components/ui/GapScoreRing'
import Badge from '../../../components/ui/Badge'
import Icon from '../../../components/ui/Icon'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'

// Priority labels share the GapScoreRing thresholds (GapScoreRing.jsx) so a
// high deficit reads identically everywhere: ≥0.66 red / ≥0.33 amber / else green.
const gapTone = (score) => (score >= 0.66 ? 'negative' : score >= 0.33 ? 'warning' : 'neutral')
const gapLabel = (score) => (score >= 0.66 ? 'High' : score >= 0.33 ? 'Medium' : 'Low')

// "GIS Decision Support" — sectors with the highest average facility gap
// (shared facilityMapper deficit algorithm), ranked descending. The backend
// exposes no recommendation model, so the card surfaces real gap hotspots.
export default function GISDecisionSupportCard({ rows = [], loading, error, onRetry }) {
  return (
    <Card>
      <CardHeader title="GIS Decision Support" subtitle="Top ranked recommendations" icon={Sparkles} />
      <CardBody className="!py-2">
        {loading && (
          <div className="space-y-2.5 p-2" aria-label="Loading recommendations">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="px-2 pb-2 text-center">
            <p className="text-[12.5px] text-alert-700">Unable to load recommendations.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>Retry</Button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="py-6 text-center">
            <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-ink-100 text-ink-400 mb-2"><Inbox size={16} /></div>
            <p className="text-[12.5px] font-semibold text-ink-700">No gap data yet</p>
            <p className="text-[11.5px] text-ink-500 mt-1 px-2">Facility coverage scores appear once facilities are geocoded.</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="divide-y divide-ink-50">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center gap-3 py-2.5 px-2">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: row.color }}>
                  <Icon name={row.icon} size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-ink-900 truncate">{row.name}</p>
                  <Badge tone={gapTone(row.gapScore)}>{gapLabel(row.gapScore)} deficit</Badge>
                </div>
                <GapScoreRing score={row.gapScore} size={40} strokeWidth={4} />
              </div>
            ))}
          </div>
        )}

        <div className="px-2 pt-1 pb-2">
          <Button as={Link} to="/admin/recommendations" variant="ghost" size="sm" className="w-full justify-center">
            View all recommendations
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}