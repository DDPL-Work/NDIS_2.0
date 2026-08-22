// Generic entity drilldown — the UNIVERSAL data model (§5), rendered for any
// department: Entity + Location + Indicator (Current/Required/Deficit) +
// Coverage + Accessibility + Priority (explainable) + Evidence + Action.
import { MapPin, ShieldAlert, Users, Gauge, ClipboardList, Crosshair, Scale } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { resolveIndicators } from '../departmentModel'

const bandTone = (band) => (band === 'P1' ? 'negative' : band === 'P2' ? 'warning' : band === 'P3' ? 'info' : 'neutral')

export default function DrilldownPanel({ entity, config, onClose, onAction }) {
  if (!entity) return null
  const { priority, exposure, populationServed } = entity
  const indicators = resolveIndicators(entity, config.indicators || [])
  const actionButtons = (config.actions || []).filter((a) => a.appliesTo === 'priority')

  return (
    <Modal open={Boolean(entity)} onClose={onClose} title={`${entity.name} — ${config.terminology?.entity || 'Entity'}`} width="max-w-2xl">
      <div className="space-y-5">
        {/* Priority headline */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={bandTone(priority?.band)} dot>{priority?.band ? `${priority.band} · ${priority.bandLabel}` : 'No priority data'}</Badge>
          {priority?.score != null && <Badge tone="info">Score {priority?.score}</Badge>}
          <Badge tone="neutral">{entity.categoryLabel}</Badge>
        </div>

        {/* Location */}
        <div className="grid gap-1.5 text-[12.5px] text-ink-600">
          <p className="flex items-center gap-1.5"><MapPin size={13} className="text-ink-400" /> {entity.village || entity.block || 'Location unknown'} {Array.isArray(entity.position) ? `· ${entity.position[1].toFixed(4)}, ${entity.position[0].toFixed(4)}` : ''}</p>
          {populationServed && <p className="flex items-center gap-1.5"><Users size={13} className="text-ink-400" /> Nearest census population: <span className="font-semibold text-ink-900">{(populationServed.population).toLocaleString()}</span> <span className="text-ink-400">({populationServed.blockName})</span></p>}
          <p className="flex items-center gap-1.5"><Scale size={13} className="text-ink-400" /> Coverage gap score: <span className="font-semibold text-ink-900">{Math.round((entity.gapScore || 0) * 100)}%</span> <span className="text-ink-400">(Phase 1 coverage-isolation heuristic)</span></p>
          {exposure && (
            <p className="flex items-center gap-1.5">
              <ShieldAlert size={13} className={exposure.exposed ? 'text-alert-500' : 'text-ink-400'} />
              {exposure.exposed ? `Exposed: ${exposure.hazardLayers.map((h) => h.layerName).join(', ')}` : 'Not inside any served hazard layer'}
            </p>
          )}
        </div>

        {/* Explainable priority (§9) */}
        <div>
          <h4 className="text-[12.5px] font-semibold text-ink-900 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Gauge size={13} /> Why is this a priority?</h4>
          {priority?.components?.length ? (
            <div className="rounded-lg border border-ink-100 divide-y divide-ink-100">
              {priority.components.map((component) => (
                <div key={component.key} className="flex items-center justify-between gap-3 px-3 py-2 text-[12.5px]">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-800">{component.label} <span className="text-ink-400 font-normal">(weight {component.weight})</span></p>
                    <p className="text-[11px] text-ink-400 truncate">{component.source}</p>
                  </div>
                  {component.available
                    ? <span className="kbd-mono text-[12px] font-semibold text-ink-900">{Math.round(component.raw * 100)}% → +{component.contribution}</span>
                    : <Badge tone="neutral">no data</Badge>}
                </div>
              ))}
            </div>
          ) : null}
          <p className="text-[11.5px] text-ink-500 mt-2">{priority?.basis}</p>
        </div>

        {/* Indicators — Current / Required / Deficit (§5) */}
        <div>
          <h4 className="text-[12.5px] font-semibold text-ink-900 uppercase tracking-wide mb-2 flex items-center gap-1.5"><ClipboardList size={13} /> Indicators</h4>
          {indicators.length ? (
            <div className="rounded-lg border border-ink-100 divide-y divide-ink-100 max-h-56 overflow-y-auto">
              {indicators.map((indicator) => (
                <div key={indicator.key} className="px-3 py-2 text-[12.5px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink-800">{indicator.label}</span>
                    {indicator.status === 'available'
                      ? <span className="kbd-mono font-semibold text-leaf-700">{String(indicator.value)}</span>
                      : <Badge tone="neutral">Data not available</Badge>}
                  </div>
                  {indicator.status === 'unavailable' && (
                    <p className="text-[11px] text-ink-400 mt-1">Requires {indicator.requiredKeys.map((k) => <span key={k} className="kbd-mono">{k}</span>).reduce((prev, el) => [prev, ', ', el])}</p>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-[12.5px] text-ink-500">No indicators configured for this department.</p>}
        </div>

        {/* Evidence */}
        <div>
          <h4 className="text-[12.5px] font-semibold text-ink-900 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Crosshair size={13} /> Evidence</h4>
          <ul className="space-y-1 text-[12px] text-ink-600 list-disc list-inside">
            {populationServed && <li>Real census block <span className="kbd-mono">{populationServed.blockName}</span> with {populationServed.population.toLocaleString()} residents is nearest.</li>}
            <li>Real hazard layers evaluated: {config.hazardLayers?.length ? config.hazardLayers.join(', ') : 'none configured'}.</li>
            <li>Facility/layer record id <span className="kbd-mono">{entity.id}</span> from GET /api/facilities/ or GET /api/gis/layers/.</li>
          </ul>
        </div>

        {/* Recommended action */}
        {actionButtons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actionButtons.map((action) => (
              <Button key={action.key} size="sm" variant={action.key === 'escalate' ? 'outline' : 'primary'} icon={action.key === 'escalate' ? ShieldAlert : ClipboardList} onClick={() => onAction?.(action, entity)}>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}