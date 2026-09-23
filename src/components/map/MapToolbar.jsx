// MapToolbar — floating GIS tool palette for all portals.
// Provides: basemap switcher, radius draw (3km deficit coverage), distance measure,
// cluster toggle, fit-to-district, my-location, and map snapshot.
// Ref: LLD Vol 1 §10.3 GIS interaction requirements.
import { useState } from 'react'
import {
  Layers, Ruler, Circle, Navigation, Camera,
  Maximize2, Radio, ChevronDown, X, MoreHorizontal,
  RotateCcw, Trash2, Edit3,
} from 'lucide-react'
import clsx from 'clsx'
import { MAP_TOOLS, MEASURE_STATES, BASEMAPS } from '../../hooks/useMapTools'

const TOOL_BTNS = [
  { tool: MAP_TOOLS.RADIUS, icon: Circle, label: 'Draw radius (3km)', shortLabel: 'Radius' },
  { tool: MAP_TOOLS.MEASURE, icon: Ruler, label: 'Measure distance', shortLabel: 'Measure' },
]

// Google-Maps-style distance formatting: metres below 1 km, one decimal km
// below 10, whole km above.
function formatMeasure(km) {
  if (km == null || !Number.isFinite(km)) return null
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

function formatArea(squareMeters) {
  if (squareMeters == null || !Number.isFinite(squareMeters)) return null
  if (squareMeters >= 1000000) return `${(squareMeters / 1000000).toFixed(2)} km²`
  if (squareMeters >= 10000) return `${Math.round(squareMeters).toLocaleString('en-IN')} m²`
  if (squareMeters >= 1) return `${squareMeters.toFixed(2)} m²`
  return `${(squareMeters * 10.7639).toFixed(2)} sq ft`
}

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
  measureAreaSqm,
  measurePoints,
  measureMode,
  measureState,
  onClearMeasure,
  onRemoveMeasurePoint,
  onFinishMeasure,
  onUndoMeasure,
  onDeleteVertex,
  onEnterEditMode,
  onFitDistrict,
  onMyLocation,
  onSnapshot,
  className = '',
  // Citizen mode: only the everyday tools stay on the strip — Locate, Fit,
  // Basemap, Snapshot.  Measure / Radius / Cluster move behind "More tools",
  // a popover that opens upward so it never collides with the bottom bar.
  groupAdvanced = false,
}) {
  const [basemapOpen, setBasemapOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const advancedToolActive = TOOL_BTNS.some(({ tool }) => tool === activeTool)

  const advancedTools = (
    <div className="absolute bottom-full right-0 mb-1.5 card !p-1 flex flex-col gap-0.5 w-44 z-50 border-ink-200 shadow-popover animate-fade-in">
      {TOOL_BTNS.map(({ tool, icon: Icon, label, shortLabel }) => (
        <button
          key={tool}
          onClick={() => { onSelectTool(tool); setMoreOpen(false) }}
          title={label}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium transition-colors',
            activeTool === tool ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-ink-100'
          )}
        >
          <Icon size={14} className="shrink-0" />
          {shortLabel}
        </button>
      ))}
      <div className="h-px bg-ink-100" />
      <button
        onClick={() => { onToggleCluster(); setMoreOpen(false) }}
        title="Toggle clustering"
        className={clsx(
          'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium transition-colors',
          clusterEnabled ? 'bg-saffron-500 text-white' : 'text-ink-700 hover:bg-ink-100'
        )}
      >
        <Radio size={14} className="shrink-0" />
        Cluster
      </button>
    </div>
  )

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
            <span className="hidden sm:inline flex-1 text-left">{BASEMAPS.find((b) => b.id === basemapId)?.label || 'Basemap'}</span>
            <ChevronDown size={12} className={clsx('transition-transform', basemapOpen && 'rotate-180')} />
          </button>
          {basemapOpen && (
            <div className="absolute right-full top-0 mr-1.5 card !p-1 flex flex-col gap-0.5 w-32 z-50 border-ink-200 shadow-popover animate-fade-in">
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
        {!groupAdvanced && TOOL_BTNS.map(({ tool, icon: Icon, label, shortLabel }) => (
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
            <span className="hidden sm:inline">{shortLabel}</span>
          </button>
        ))}

        {/* Cluster toggle (un-grouped mode only) */}
        {!groupAdvanced && (
          <button
            onClick={onToggleCluster}
            title="Toggle clustering"
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium transition-colors',
              clusterEnabled ? 'bg-saffron-500 text-white' : 'text-ink-700 hover:bg-ink-100'
            )}
          >
            <Radio size={14} className="shrink-0" />
            <span className="hidden sm:inline">Cluster</span>
          </button>
        )}

        <div className="h-px bg-ink-100" />

        {/* Utility buttons */}
        <button
          onClick={onFitDistrict}
          title="Fit to district"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Maximize2 size={14} className="shrink-0" />
          <span className="hidden sm:inline">Fit</span>
        </button>
        <button
          onClick={onMyLocation}
          title="My location"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Navigation size={14} className="shrink-0" />
          <span className="hidden sm:inline">Locate</span>
        </button>
        <button
          onClick={onSnapshot}
          title="Download map snapshot"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-100 transition-colors"
        >
          <Camera size={14} className="shrink-0" />
          <span className="hidden sm:inline">Snapshot</span>
        </button>

        {/* Citizen mode: "More tools" popover for the advanced tools */}
        {groupAdvanced && (
          <>
            <div className="h-px bg-ink-100" />
            <div className="relative">
              <button
                onClick={() => setMoreOpen((o) => !o)}
                title="More tools"
                aria-expanded={moreOpen}
                className={clsx(
                  'flex items-center gap-1.5 w-full rounded-lg px-2 py-1.5 text-[11.5px] font-medium transition-colors',
                  moreOpen || advancedToolActive || clusterEnabled
                    ? 'bg-saffron-500 text-white'
                    : 'text-ink-700 hover:bg-ink-100'
                )}
              >
                <MoreHorizontal size={14} className="shrink-0" />
                <span className="hidden sm:inline">More tools</span>
              </button>
              {moreOpen && advancedTools}
            </div>
          </>
        )}
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

      {/* Measure result — Google-Maps-style multi-point path */}
      {(activeTool === MAP_TOOLS.MEASURE || activeTool === MAP_TOOLS.MEASURE_AREA) && (
        <div className="card !p-3 shadow-lg animate-fade-in text-[11.5px] min-w-44">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-ink-800">
              {activeTool === MAP_TOOLS.MEASURE_AREA ? 'Area measure' : 'Distance measure'}
            </span>
            {measurePoints.length > 0 && (
              <button onClick={onClearMeasure} title="Clear measurement" className="text-ink-400 hover:text-ink-700">
                <X size={12} />
              </button>
            )}
          </div>
          {(measureMode === 'area' ? measureAreaSqm : measureDistKm) !== null && measurePoints.length >= (measureMode === 'area' ? 3 : 2) ? (
            <p className="text-leaf-700 font-semibold">
              {measureMode === 'area' ? formatArea(measureAreaSqm) : formatMeasure(measureDistKm)}
            </p>
          ) : (
            <p className="text-ink-400">
              {measurePoints.length === 0
                ? 'Click the map to start.'
                : measurePoints.length === 1
                  ? 'Click to add second point.'
                  : measureMode === 'area' && measurePoints.length === 2
                    ? 'Click to add third point for area.'
                    : 'Keep clicking to add points.'}
            </p>
          )}
          {measurePoints.length > 0 && (
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {/* Drawing mode buttons */}
              {measureState === MEASURE_STATES.DRAWING && (
                <>
                  <button
                    onClick={onRemoveMeasurePoint}
                    title="Remove last point"
                    disabled={measurePoints.length <= (measureMode === 'area' ? 3 : 2)}
                    className={clsx(
                      'flex-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-medium transition-colors',
                      measurePoints.length <= (measureMode === 'area' ? 3 : 2)
                        ? 'text-ink-300 cursor-not-allowed'
                        : 'text-ink-700 hover:bg-ink-50'
                    )}
                  >
                    Remove point
                  </button>
                  <button
                    onClick={onUndoMeasure}
                    title="Undo last action"
                    disabled={measurePoints.length === 0}
                    className={clsx(
                      'flex-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-medium transition-colors',
                      measurePoints.length === 0
                        ? 'text-ink-300 cursor-not-allowed'
                        : 'text-ink-700 hover:bg-ink-50'
                    )}
                  >
                    <RotateCcw size={12} className="inline-block mr-1" /> Undo
                  </button>
                  <button
                    onClick={onFinishMeasure}
                    title="Finish measurement"
                    disabled={measurePoints.length < (measureMode === 'area' ? 3 : 2)}
                    className={clsx(
                      'flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
                      measurePoints.length < (measureMode === 'area' ? 3 : 2)
                        ? 'bg-ink-300 text-ink-500 cursor-not-allowed'
                        : 'bg-ink-900 text-white hover:bg-ink-950'
                    )}
                  >
                    Done
                  </button>
                </>
              )}
              
              {/* Completed/Editing mode buttons */}
              {(measureState === MEASURE_STATES.COMPLETED || measureState === MEASURE_STATES.EDITING) && (
                <>
                  <button
                    onClick={onEnterEditMode}
                    title={measureState === MEASURE_STATES.EDITING ? 'Exit edit mode' : 'Edit vertices'}
                    className={clsx(
                      'flex-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors',
                      measureState === MEASURE_STATES.EDITING
                        ? 'bg-saffron-500 text-white hover:bg-saffron-600'
                        : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                    )}
                  >
                    <Edit3 size={12} className="inline-block mr-1" />
                    {measureState === MEASURE_STATES.EDITING ? 'Done editing' : 'Edit vertices'}
                  </button>
                  <button
                    onClick={onUndoMeasure}
                    title="Undo last action"
                    disabled={measurePoints.length === 0}
                    className={clsx(
                      'flex-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-medium transition-colors',
                      measurePoints.length === 0
                        ? 'text-ink-300 cursor-not-allowed'
                        : 'text-ink-700 hover:bg-ink-50'
                    )}
                  >
                    <RotateCcw size={12} className="inline-block mr-1" /> Undo
                  </button>
                  <button
                    onClick={onClearMeasure}
                    title="Clear measurement"
                    className="flex-1 rounded-lg border border-alert-200 px-2 py-1 text-[11px] font-medium text-alert-600 hover:bg-alert-50 transition-colors"
                  >
                    <Trash2 size={12} className="inline-block mr-1" /> Clear
                  </button>
                </>
              )}
            </div>
          )}
          <p className="text-ink-400 mt-2">
            {measureState === MEASURE_STATES.DRAWING
              ? 'Click to add points · double-click to finish.'
              : measureState === MEASURE_STATES.EDITING
                ? 'Drag vertices to move · click edges to insert · right-click vertex to delete.'
                : 'Click "Edit vertices" to modify.'}
          </p>
        </div>
      )}
    </div>
  )
}
