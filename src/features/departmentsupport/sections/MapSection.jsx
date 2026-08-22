// Generic department GIS map (§6) — the SAME MapView engine for every
// department, populated from the config's entity groups and context layers.
// Layer availability is honest: a config layer the catalog lacks is listed
// but never rendered.
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Layers, Filter } from 'lucide-react'
import MapView from '../../../components/map/MapView'
import { GapScoreLegend } from '../../../components/map/MapLegend'
import { Card, CardHeader } from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Provenance from '../../admin/decisionDashboard/Provenance'
import { formatDateTime } from '../../../utils/format'

export default function MapSection({ plan, loadedAt, onSelectEntity, onOpenSpatial }) {
  const [colorBy, setColorBy] = useState('gap')
  const [showContext, setShowContext] = useState(false)
  const [showHazard, setShowHazard] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const facilities = useMemo(() => (plan?.entities || []).map((entity) => ({
    id: entity.id,
    name: entity.name,
    position: entity.position,
    categoryLabel: entity.categoryLabel,
    departmentId: plan.config.departmentId,
    departmentName: plan.config.departmentName,
    village: entity.village,
    gapScore: entity.gapScore || 0,
  })), [plan])

  const entityVectorLayers = useMemo(() => (plan?.resolvedEntityGroups || [])
    .filter((group) => group.source === 'gis-layer' && group.available)
    .map((group) => ({ features: (plan.layersByName?.[group.layerName]?.features || []), layerName: group.layerName, category: group.label }))
    .filter((entry) => entry.features.length), [plan])

  const contextVectorLayers = useMemo(() => (showContext ? (plan?.resolvedContextLayers || [])
    .filter((layer) => layer.available && layer.role === 'boundary')
    .map((layer) => ({ features: (plan.boundaryLayers?.[layer.layerName]?.features || []), layerName: layer.layerName, category: layer.label }))
    .filter((entry) => entry.features.length) : []), [plan, showContext])

  const hazardVectorLayers = useMemo(() => (showHazard ? (plan?.resolvedHazardLayers || [])
    .filter((layer) => layer.available)
    .map((layer) => ({ features: (plan.hazardLayerData?.find((d) => d.layerName === layer.layerName)?.features || []), layerName: layer.layerName, category: layer.label }))
    .filter((entry) => entry.features.length) : []), [plan, showHazard])

  const vectorLayers = [...entityVectorLayers, ...contextVectorLayers, ...hazardVectorLayers]

  const missingGroups = (plan?.resolvedEntityGroups || []).filter((group) => !group.available)
  const missingContext = (plan?.resolvedContextLayers || []).filter((layer) => !layer.available)

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader
        title="Department situation map"
        subtitle={`${plan?.config.departmentName} layers on the shared GIS engine. Click any marker for the explainable drilldown.`}
        action={onOpenSpatial ? (
          <Button size="sm" variant="outline" icon={Filter} onClick={onOpenSpatial}>Spatial analysis</Button>
        ) : undefined}
      />
      <div className="relative h-[420px] lg:h-[520px]">
        <MapView
          center={[85.4434, 25.1372]}
          zoom={10.2}
          facilities={facilities}
          colorBy={colorBy}
          vectorLayers={vectorLayers}
          className="h-full"
          onFacilityClick={(facility) => {
            setSelectedId(facility.id)
            const entity = (plan?.entities || []).find((e) => e.id === facility.id)
            onSelectEntity?.(entity)
          }}
          onMapClick={() => { setSelectedId(null); onSelectEntity?.(null) }}
          selectedId={selectedId}
        />

        {/* Controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 w-[min(280px,calc(100%-24px))]">
          <div className="card p-1.5 flex gap-1 w-fit">
            <button onClick={() => setColorBy('gap')} className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium', colorBy === 'gap' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}>By gap</button>
            <button onClick={() => setColorBy('department')} className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium', colorBy === 'department' ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}>By dept</button>
          </div>
          {colorBy === 'gap' && <GapScoreLegend />}
          <div className="card p-2 flex flex-wrap gap-1.5">
            <button onClick={() => setShowHazard((v) => !v)} className={clsx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium', showHazard ? 'bg-alert-50 text-alert-700 ring-1 ring-alert-200' : 'bg-ink-50 text-ink-600 hover:bg-ink-100')}>
              <Layers size={12} /> Hazards
            </button>
            <button onClick={() => setShowContext((v) => !v)} className={clsx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium', showContext ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' : 'bg-ink-50 text-ink-600 hover:bg-ink-100')}>
              <Layers size={12} /> Boundaries
            </button>
            {missingGroups.length > 0 && <Badge tone="neutral">{missingGroups.length} layer(s) absent</Badge>}
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-ink-100">
        <Provenance
          source="GET /api/facilities/ · GET /api/gis/layers/{name}/ (entity, hazard, boundary layers)"
          definition="Markers are real entity records colored by gap score; vector overlays are real catalog layers. Layers named by the config but absent from the catalog are listed, never synthesized."
          updatedAt={loadedAt ? formatDateTime(loadedAt) : undefined}
        />
        {missingContext.length > 0 && (
          <p className="text-[11px] text-ink-400 mt-1">Context layers not in catalog: {missingContext.map((l) => l.layerName).join(', ')}</p>
        )}
      </div>
    </Card>
  )
}