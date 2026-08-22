import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { MapPin, Play, Save, Download, AlertTriangle, Info, ChevronDown } from 'lucide-react'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import MapView from '../../../components/map/MapView'
import { SPATIAL_CONDITIONS, DERIVED_FIELDS, DEFAULT_RESULT_LIMIT, MAX_RESULT_LIMIT } from '../spatialAnalysisModel'
import LayerPicker from './LayerPicker'
import AttributeFilters from './AttributeFilters'

function Step({ number, title, description, error, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={clsx('card p-4', error && 'border-alert-200')}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <span className={clsx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold', error ? 'bg-alert-500 text-white' : 'bg-ink-900 text-white')}>{number}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-ink-900">{title}</span>
          {description && <span className="block text-[12px] text-ink-500 mt-0.5">{description}</span>}
        </span>
        {error && <AlertTriangle size={14} className="text-alert-500 shrink-0" />}
        <ChevronDown size={16} className={clsx('text-ink-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && <div className="mt-3 pt-3 border-t border-ink-100">{children}</div>}
      {error && !open && <p className="mt-1.5 text-[11.5px] text-alert-600">{error}</p>}
    </section>
  )
}

const STEP_TITLES = {
  1: 'Target layer',
  2: 'Spatial condition',
  3: 'Reference layer / geometry',
  4: 'Distance / buffer',
  5: 'Attribute filters',
  6: 'Output fields',
  7: 'Sort / ranking',
  8: 'Result limit',
  9: 'Execute query',
  10: 'Save query',
  11: 'Export',
}

const STEP_DESCRIPTIONS = {
  1: 'Which layer are you analysing?',
  2: 'How should the target relate to the reference?',
  3: 'The geometry to measure against.',
  4: 'Radius or buffer size in kilometres.',
  5: 'field = / != / > / >= / < / <= / contains / in, joined with AND / OR.',
  6: 'Fields returned in the table, map and export.',
  7: 'Rank the results.',
  8: 'How many rows to return (max 500).',
  9: 'Run the query now.',
  10: 'Store the query for reuse.',
  11: 'Download the result set.',
}

export default function QueryBuilder({
  query, setQuery, layers, targetFieldCatalog,
  errors, warnings, capabilities, result,
  onExecute, onSave, onExport, loading,
}) {
  const [pointPickerOpen, setPointPickerOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveForm, setSaveForm] = useState({ name: '', description: '', visibility: 'public', department: '' })

  const layerOptions = useMemo(() => [
    ...(layers?.gisLayers || []).map((layer) => ({ ...layer, type: 'gis-layer' })),
    ...(layers?.facilityCategories || []).map((category) => ({ ...category, type: 'facility-category' })),
  ], [layers])

  const patch = (patchObject) => setQuery((current) => ({ ...current, ...patchObject }))
  const patchSpatial = (patchObject) => setQuery((current) => ({ ...current, spatial: { ...current.spatial, ...patchObject } }))

  const condition = SPATIAL_CONDITIONS.find((c) => c.key === query.spatial?.condition) || SPATIAL_CONDITIONS[0]
  const referenceType = query.spatial?.reference?.type || 'gis-layer'
  const distanceVisible = ['within_radius', 'buffer', 'distance'].includes(query.spatial?.condition)

  const errorFor = (key) => errors.find((e) => e.field === key)?.message || ''

  const referenceLayers = layerOptions.filter((layer) => layer.id !== query.targetLayer?.id || layer.type !== query.targetLayer?.type)

  const handleLayerChange = (key, value) => {
    if (!value) {
      if (key === 'targetLayer') patch({ targetLayer: null })
      else patchSpatial({ reference: { type: 'gis-layer', id: '', name: '', geometryType: '', point: null } })
      return
    }
    const [type, ...rest] = value.split(':')
    const id = rest.join(':')
    const layer = layerOptions.find((l) => l.type === type && l.id === id)
    if (key === 'targetLayer') patch({ targetLayer: layer || null })
    else patchSpatial({ reference: { type, id, name: layer?.name || id, geometryType: layer?.geometryType || '', point: null } })
  }

  const setReferencePoint = (point) => {
    patchSpatial({ reference: { type: 'point', id: 'point', name: 'Picked point', geometryType: 'Point', point } })
    setPointPickerOpen(false)
  }

  const renderStep = (step) => {
    const fieldForStep = (stepNumber) => ({
      1: 'targetLayer',
      2: 'spatial.condition',
      3: 'spatial.reference',
      4: 'spatial.distanceKm',
      5: 'filters',
      8: 'limit',
    })[stepNumber] || ''
    return (
      <Step
        number={step}
        title={STEP_TITLES[step]}
        description={STEP_DESCRIPTIONS[step]}
        error={errorFor(fieldForStep(step))}
        defaultOpen={step <= 5}
      >
        {step === 1 && (
          <LayerPicker
            value={query.targetLayer ? `${query.targetLayer.type}:${query.targetLayer.id}` : ''}
            onChange={(value) => handleLayerChange('targetLayer', value)}
            layers={layerOptions}
            placeholder="Choose the layer to analyse…"
            error={errorFor('targetLayer')}
          />
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Select
              value={query.spatial?.condition || ''}
              onChange={(value) => patchSpatial({ condition: value })}
              options={SPATIAL_CONDITIONS.map((c) => ({ value: c.key, label: c.label }))}
              className="w-full"
            />
            <p className="text-[12.5px] text-ink-500 flex items-start gap-1.5"><Info size={13} className="shrink-0 mt-0.5" /> {condition.description}</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: 'gis-layer', label: 'GIS layer' },
                { value: 'facility-category', label: 'Facility category' },
                { value: 'point', label: 'Point on map' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (referenceType === option.value) return
                    patchSpatial({
                      reference: option.value === 'point'
                        ? { type: 'point', id: 'point', name: 'Picked point', geometryType: 'Point', point: null }
                        : { type: option.value, id: '', name: '', geometryType: '', point: null },
                    })
                  }}
                  className={clsx('rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition', referenceType === option.value ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300')}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {referenceType === 'point' ? (
              <div className="space-y-2">
                {query.spatial?.reference?.point ? (
                  <div className="rounded-lg border border-leaf-200 bg-leaf-50/60 px-3 py-2 text-[12.5px] text-ink-700 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-leaf-700" />
                      Picked point {query.spatial.reference.point[1].toFixed(5)}°N, {query.spatial.reference.point[0].toFixed(5)}°E
                    </span>
                    <Button size="xs" variant="outline" onClick={() => setPointPickerOpen(true)}>Change</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setPointPickerOpen(true)}>
                    <MapPin size={13} /> Pick reference point on the map
                  </Button>
                )}
                {errorFor('spatial.reference') && <p className="text-[11.5px] text-alert-600">{errorFor('spatial.reference')}</p>}
              </div>
            ) : (
              <LayerPicker
                value={query.spatial?.reference?.id ? `${query.spatial.reference.type}:${query.spatial.reference.id}` : ''}
                onChange={(value) => handleLayerChange('spatial.reference', value)}
                layers={referenceLayers}
                placeholder="Choose the reference layer…"
                error={errorFor('spatial.reference')}
              />
            )}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[13px] text-ink-700 font-medium">Distance / buffer (km)</label>
            <input
              type="number"
              min={0.1}
              max={200}
              step={0.1}
              value={query.spatial?.distanceKm ?? ''}
              onChange={(e) => patchSpatial({ distanceKm: e.target.value })}
              className="w-32 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 disabled:opacity-50"
            />
            {errorFor('spatial.distanceKm') && <p className="text-[11.5px] text-alert-600">{errorFor('spatial.distanceKm')}</p>}
            {query.spatial?.condition === 'buffer' && <p className="text-[12px] text-ink-500 w-full">A real buffer polygon (48-segment circle) is generated around the reference point and drawn on the results map.</p>}
            {query.spatial?.condition === 'road_route' && <p className="text-[12px] text-ink-500 w-full">Road route uses the OSRM driving service (two-point) where supported; otherwise straight-line distance is shown and disclosed in provenance.</p>}
          </div>
        )}

        {step === 5 && (
          <AttributeFilters
            filters={query.filters || []}
            onChange={(filters) => patch({ filters })}
            fieldCatalog={targetFieldCatalog}
            targetName={query.targetLayer?.name || ''}
            errors={errors.reduce((acc, e) => { acc[e.field] = e.message; return acc }, {})}
          />
        )}

        {step === 6 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(DERIVED_FIELDS).map(([key, meta]) => {
              const checked = (query.outputFields || []).includes(key)
              return (
                <button
                  key={key}
                  onClick={() => patch({ outputFields: checked ? (query.outputFields || []).filter((f) => f !== key) : [...(query.outputFields || []), key] })}
                  title={meta.description}
                  className={clsx('rounded-lg border px-3 py-2 text-[12px] font-medium text-left', checked ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300')}
                >
                  <span className="block">{meta.label}</span>
                  <span className="block text-[10.5px] opacity-70 max-w-[220px]">{meta.description}</span>
                </button>
              )
            })}
            <div className="w-full" />
            <p className="text-[11.5px] text-ink-400">Output fields beyond the derived set are available in the results table and export.</p>
          </div>
        )}

        {step === 7 && (
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={query.sort?.field || 'priorityScore'}
              onChange={(value) => patch({ sort: { ...query.sort, field: value } })}
              options={[...new Set(['priorityScore', ...(query.outputFields || []), 'name'])].map((field) => ({ value: field, label: field }))}
              small
            />
            <Select
              value={query.sort?.direction || 'desc'}
              onChange={(value) => patch({ sort: { ...query.sort, direction: value } })}
              options={[{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }]}
              small
            />
            <span className="text-[12px] text-ink-500">sort key</span>
          </div>
        )}

        {step === 8 && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={MAX_RESULT_LIMIT}
              value={query.limit ?? DEFAULT_RESULT_LIMIT}
              onChange={(e) => patch({ limit: e.target.value })}
              className="w-32 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
            />
            <span className="text-[12.5px] text-ink-500">result rows (max {MAX_RESULT_LIMIT})</span>
            {errorFor('limit') && <p className="text-[11.5px] text-alert-600">{errorFor('limit')}</p>}
          </div>
        )}

        {step === 9 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="md" variant="primary" onClick={onExecute} disabled={loading || errors.length > 0}>
              <Play size={14} /> {loading ? 'Executing…' : 'Execute query'}
            </Button>
            {errors.length > 0 && (
              <span className="text-[12.5px] text-alert-600 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Fix the {errors.length} validation issue{errors.length > 1 ? 's' : ''} above to run the query.
              </span>
            )}
          </div>
        )}

        {step === 10 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="md" variant="outline" onClick={() => setSaveOpen(true)}>
              <Save size={14} /> Save query
            </Button>
            <Badge tone="ink">
              {capabilities.savedQueries === 'supported' ? 'Backend saved queries available' : 'Backend dependency — GET /api/saved-queries/ not deployed'}
            </Badge>
          </div>
        )}

        {step === 11 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="md" variant="outline" onClick={() => onExport('csv')} disabled={!result?.results?.length}>
              <Download size={14} /> Export CSV
            </Button>
            <Button size="md" variant="outline" onClick={() => onExport('geojson')} disabled={!result?.results?.length}>
              <Download size={14} /> Export GeoJSON
            </Button>
            {!result?.results?.length && <span className="text-[12px] text-ink-400">Run a query to enable exports.</span>}
          </div>
        )}
      </Step>
    )
  }

  return (
    <div className="space-y-3">
      {(errors.length > 0 || warnings.length > 0) && (
        <div className={clsx('rounded-xl border px-4 py-3 text-[12.5px]', errors.length ? 'border-alert-200 bg-alert-50/60 text-alert-800' : 'border-saffron-200 bg-saffron-50/60 text-saffron-800')}>
          {errors.length > 0 && <p className="font-semibold flex items-center gap-1.5 mb-1"><AlertTriangle size={13} /> The query cannot be executed yet:</p>}
          <ul className="list-disc ml-5 space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e.message}</li>)}
            {warnings.map((w, i) => <li key={`w${i}`}>{w.message}</li>)}
          </ul>
        </div>
      )}

      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((step) => renderStep(step))}

      {/* Reference point picker */}
      <Modal open={pointPickerOpen} onClose={() => setPointPickerOpen(false)} title="Pick reference point" scrollBody={false}>
        <div className="h-[420px]">
          <MapView
            center={[85.4434, 25.1372]}
            zoom={9.5}
            facilities={[]}
            onMapClick={(point) => setReferencePoint(point)}
            className="h-full"
          />
          <p className="px-4 py-2 text-[12px] text-ink-500 bg-white border-t border-ink-100">Click anywhere on the map to set the reference point.</p>
        </div>
      </Modal>

      {/* Save query dialog — the fields are fully functional; the backend
          dependency is surfaced honestly until GET /api/saved-queries/ is deployed. */}
      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Save query">
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-ink-700">Query name</label>
            <input
              value={saveForm.name}
              onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              placeholder="e.g. Villages near health facilities with poor road access"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-ink-700">Description</label>
            <textarea
              value={saveForm.description}
              onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-ink-700">Visibility</label>
              <Select
                value={saveForm.visibility}
                onChange={(value) => setSaveForm({ ...saveForm, visibility: value })}
                options={[{ value: 'public', label: 'Public' }, { value: 'department', label: 'Department' }, { value: 'private', label: 'Private' }]}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-ink-700">Department</label>
              <input
                value={saveForm.department}
                onChange={(e) => setSaveForm({ ...saveForm, department: e.target.value })}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              />
            </div>
          </div>
          {capabilities.savedQueries !== 'supported' && (
            <div className="rounded-lg border border-ink-200 bg-ink-50/60 px-3 py-2.5 text-[12.5px] text-ink-600 flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong className="text-ink-800">Backend dependency.</strong> The backend does not expose a saved-query API yet (GET /api/saved-queries/ returned {capabilities.savedQueries === 'unsupported' ? '404' : 'an error'}). The form fields are ready — saving becomes available the moment the endpoint is deployed.
              </span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button size="sm" variant="primary" disabled={!saveForm.name.trim() || capabilities.savedQueries !== 'supported'} onClick={() => onSave(saveForm)}>
              Save query
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}