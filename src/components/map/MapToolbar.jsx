// MapToolbar — floating GIS tool palette for all portals.
// Provides: basemap switcher, radius draw (3km deficit coverage), distance measure,
// cluster toggle, fit-to-district, my-location, and map snapshot.
// Ref: LLD Vol 1 §10.3 GIS interaction requirements.
import { useState } from 'react'
import {
  Layers, Ruler, Circle, Navigation, Camera, Crosshair,
  Maximize2, Radio, ChevronDown, X,
} from 'lucide-react'
import clsx from 'clsx'
import { MAP_TOOLS, BASEMAPS } from '../../hooks/useMapTools'

const TOOL_BTNS = [
  { tool: MAP_TOOLS.RADIUS, icon: Circle, label: 'Draw radius (3km)', shortLabel: 'Radius' },
  { tool: MAP_TOOLS.MEASURE, icon: Ruler, label: 'Measure distance', shortLabel: 'Measure' },
]

export default function MapToolbar({
  activeTool,
  onSelectTool,
  clusterEnabled,
  onToggleCluster,
  basemapId,
  onBasemapChange,
  radiusKm,
  onRadiusKmChange,
  radiusCenter,
  onClearRadius,
  measureDistKm,
  measurePoints,
  onClearMeasure,
  onFitDistrict,
  onMyLocation,
  onSnapshot,
  className = '',
}) {
  const [basemapOpen, setBasemapOpen] = useState(false)

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {/* Tool strip */}
      <div className="card !p-1 flex flex-col gap-0.5 shadow-lg">
        {/* Basemap switcher */}
        <div className="relative">
          <button
            onClick={() => setBasemapOpen((o) => !o)}
            title="Switch basemap"
            className="flex items-center gap-1.5 w-full rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
          >
            <Layers size={14} className="shrink-0" />
            <span className="flex-1 text-left">{BASEMAPS.find((b) => b.id === basemapId)?.label || 'Basemap'}</span>
            <ChevronDown size={12} className={clsx('transition-transform', basemapOpen && 'rotate-180')} />
          </button>
          {basemapOpen && (
            <div className="absolute left-full top-0 ml-1.5 card !p-1 flex flex-col gap-0.5 w-28 z-50 shadow-xl animate-fade-in">
              {BASEMAPS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { onBasemapChange(b.id); setBasemapOpen(false) }}
                  className={clsx(
                    'rounded-lg px-2.5 py-1.5 text-left text-[11.5px] font-medium transition-colors flex items-center gap-1.5',
                    basemapId === b.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-100'
                  )}
                >
                  {b.id === 'satellite' && <span className="text-[10px]">🛰</span>}
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-ink-100" />

        {/* Tool buttons */}
        {TOOL_BTNS.map(({ tool, icon: Icon, label, shortLabel }) => (
          <button
            key={tool}
            onClick={() => onSelectTool(tool)}
            title={label}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium transition-colors',
              activeTool === tool
                ? 'bg-ink-900 text-white'
                : 'text-ink-700 hover:bg-ink-100'
            )}
          >
            <Icon size={14} className="shrink-0" />
            <span>{shortLabel}</span>
          </button>
        ))}

        {/* Cluster toggle */}
        <button
          onClick={onToggleCluster}
          title="Toggle clustering"
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium transition-colors',
            clusterEnabled ? 'bg-saffron-500 text-white' : 'text-ink-700 hover:bg-ink-100'
          )}
        >
          <Radio size={14} className="shrink-0" />
          <span>Cluster</span>
        </button>

        <div className="h-px bg-ink-100" />

        {/* Utility buttons */}
        <button
          onClick={onFitDistrict}
          title="Fit to district"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Maximize2 size={14} className="shrink-0" />
          <span>Fit</span>
        </button>
        <button
          onClick={onMyLocation}
          title="My location"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Navigation size={14} className="shrink-0" />
          <span>Locate</span>
        </button>
        <button
          onClick={onSnapshot}
          title="Download map snapshot"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Camera size={14} className="shrink-0" />
          <span>Snapshot</span>
        </button>
      </div>

      {/* Radius config panel */}
      {activeTool === MAP_TOOLS.RADIUS && (
        <div className="card !p-3 shadow-lg animate-fade-in text-[11.5px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-ink-800">Deficit radius</span>
            {radiusCenter && (
              <button onClick={onClearRadius} className="text-ink-400 hover:text-ink-700">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range" min={1} max={10} step={0.5}
              value={radiusKm}
              onChange={(e) => onRadiusKmChange(Number(e.target.value))}
              className="flex-1 accent-ink-900"
            />
            <span className="kbd-mono text-ink-700 w-10 text-right">{radiusKm}km</span>
          </div>
          <p className="text-ink-400 mt-1.5">
            {radiusCenter
              ? `Circle placed. Click map to reposition.`
              : 'Click on the map to place a coverage circle.'}
          </p>
        </div>
      )}

      {/* Measure result */}
      {activeTool === MAP_TOOLS.MEASURE && (
        <div className="card !p-3 shadow-lg animate-fade-in text-[11.5px]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-ink-800">Distance measure</span>
            {measurePoints.length > 0 && (
              <button onClick={onClearMeasure} className="text-ink-400 hover:text-ink-700">
                <X size={12} />
              </button>
            )}
          </div>
          {measureDistKm !== null ? (
            <p className="text-leaf-700 font-semibold">{measureDistKm} km</p>
          ) : (
            <p className="text-ink-400">
              {measurePoints.length === 0
                ? 'Click first point on map.'
                : 'Click second point to measure.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
