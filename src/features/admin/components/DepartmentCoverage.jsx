import { Link } from 'react-router-dom'
import { ArrowRight, Inbox } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import GapScoreRing from '../../../components/ui/GapScoreRing'
import Icon from '../../../components/ui/Icon'
import Button from '../../../components/ui/Button'
import Skeleton from '../../../components/ui/Skeleton'
import DepartmentTrend from '../../../components/charts/DepartmentTrend'
import { formatNumber } from '../../../utils/format'

// "Department coverage" — real facility counts, open grievances, facility gap
// scores and complaint trend per sector (aggregated by useDepartmentCoverage).
export default function DepartmentCoverage({ rows = [], loading, error, onRetry }) {
  return (
    <Card>
      <CardHeader
        title="Department coverage"
        subtitle="Gap score & facility coverage by sector"
        action={
          <Link to="/admin/situation-matrix" className="text-[12px] font-semibold text-ink-600 hover:text-ink-900 flex items-center gap-1">
            Situation Matrix <ArrowRight size={13} />
          </Link>
        }
      />
      <CardBody className="!py-2">
        {loading && (
          <div className="divide-y divide-ink-50" aria-label="Loading department coverage">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 py-3 px-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-64 max-w-full" />
                </div>
                <Skeleton className="h-8 w-24 hidden md:block" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="px-2 py-6 text-center">
            <p className="text-[12.5px] text-alert-700">Unable to load department coverage.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>Retry</Button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="py-8 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ink-100 text-ink-400 mb-2.5"><Inbox size={18} /></div>
            <p className="text-[13px] font-semibold text-ink-700">No department coverage data</p>
            <p className="text-[12px] text-ink-500 mt-1">Departments, facilities or complaints were not returned by the backend.</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="divide-y divide-ink-50">
            {rows.map((row) => (
              <DepartmentCoverageRow key={row.id} row={row} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function DepartmentCoverageRow({ row }) {
  const counts = `${formatNumber(row.facilityCount)} facilities · ${row.openProposals == null ? '—' : formatNumber(row.openProposals)} open proposals · ${formatNumber(row.openGrievances)} open grievances`
  return (
    <Link
      to={`/department/${row.id}`}
      aria-label={`${row.name}, ${counts}${row.gapScore == null ? '' : `, average gap score ${row.gapScore.toFixed(2)}`}`}
      className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-ink-50 transition-colors group"
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: row.color }}>
        <Icon name={row.icon} size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink-900 truncate">{row.name}</p>
        <p className="text-[11.5px] text-ink-500 truncate">{counts}</p>
      </div>
      <div className="w-24 hidden md:block" aria-hidden>
        <DepartmentTrend data={row.trend} color={row.color} height={36} />
      </div>
      {row.gapScore == null ? (
        <div className="grid h-10 w-10 place-items-center rounded-full bg-ink-50 text-[11px] font-semibold text-ink-400" title="No position data to score coverage">
          —
        </div>
      ) : (
        <GapScoreRing score={row.gapScore} size={40} strokeWidth={4} />
      )}
    </Link>
  )
}