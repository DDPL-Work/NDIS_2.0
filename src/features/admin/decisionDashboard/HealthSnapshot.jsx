import { HeartPulse, Stethoscope, Pill, Syringe, Activity } from 'lucide-react'
import clsx from 'clsx'
import SectionCard from './SectionCard'
import Provenance from './Provenance'
import Badge from '../../../components/ui/Badge'

const ICONS = {
  hr_gaps: Stethoscope,
  infrastructure_readiness: HeartPulse,
  medicine_risk: Pill,
  vaccination: Syringe,
  high_risk_indicators: Activity,
}

// Section D — the health snapshot.  Rendered ONLY when the backend supplies the
// underlying telemetry.  The health module is currently config-only, so each
// metric reports an honest "data not available" state instead of inventing
// figures.
export default function HealthSnapshot({ health, loadedAt }) {
  const available = (health.metrics || []).filter((m) => m.status === 'available')
  return (
    <SectionCard
      id="health-snapshot"
      title="Health snapshot"
      subtitle={`${health.totalHealthFacilities || 0} health facilities in the district · ${health.telemetryFacilities || 0} with operational telemetry.`}
      action={available.length > 0
        ? <Badge tone="leaf">{available.length} of {health.metrics?.length || 5} metrics live</Badge>
        : <Badge tone="ink">No live telemetry</Badge>}
      foot={<Provenance source="GET /api/facilities/ (attributes: bed_count, staff_count)" definition="Readiness = share of health facilities reporting staff + beds. Other metrics require telemetry endpoints not yet deployed." updatedAt={loadedAt} />}
    >
      {/* This card lives in a one-third dashboard column.  Do not key its
          internal grid to the viewport: at desktop widths it would otherwise
          create five unusably narrow metric cards. */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
        {(health.metrics || []).map((metric) => {
          const Icon = ICONS[metric.key] || Activity
          const live = metric.status === 'available'
          return (
            <div key={metric.key} className={clsx('rounded-xl border p-3', live ? 'border-leaf-100 bg-leaf-50/40' : 'border-ink-100 bg-ink-50/40')}>
              <div className="flex items-center justify-between">
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500"><Icon size={13} className="shrink-0" /> <span>{metric.label}</span></span>
                <span className={clsx('inline-block h-2 w-2 rounded-full', live ? 'bg-leaf-500' : 'bg-ink-300')} title={live ? 'Live' : 'Not available'} />
              </div>
              <p className={clsx('mt-2 text-[12.5px] font-semibold leading-snug', live ? 'text-leaf-800' : 'text-ink-400')}>
                {live ? metric.detail : 'Data not available'}
              </p>
              {!live && <p className="mt-1 text-[10.5px] text-ink-400 leading-snug">{metric.detail}</p>}
            </div>
          )
        })}
      </div>
      {available.length === 0 && (
        <p className="mt-3 rounded-lg border border-ink-100 bg-ink-50/50 px-3 py-2 text-[12px] text-ink-500">
          Health telemetry endpoints are not deployed yet. This section will light up automatically the moment the backend starts serving HR, medicine, vaccination or risk data — no dashboard change required.
        </p>
      )}
    </SectionCard>
  )
}
