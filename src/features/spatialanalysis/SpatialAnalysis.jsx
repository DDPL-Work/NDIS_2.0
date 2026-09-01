import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { RefreshCw, Database, Server, ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import {
  executeSpatialAnalysis, spatialAnalysisCapability, spatialAnalysisBugMessage, savedQueriesCapability,
  loadCatalog, loadFacilities, loadLayerFeatures, toFeatureRows, facilityCategoriesFrom,
  resultsToCsv, resultsToGeoJson,
} from '../../api/spatialAnalysisApi'
import { DEMO_QUERY, validateQuery, buildFieldCatalog, ROAD_LAYER_NAMES } from './spatialAnalysisModel'
import { getDepartmentConfig, DEPARTMENT_CONFIGS } from '../departmentsupport/departmentConfigs'
import { entityRowsFromFacilities } from '../departmentsupport/departmentModel'
import SimpleQueryBuilder from './builder/SimpleQueryBuilder'
import QueryBuilder from './builder/QueryBuilder'
import ResultsPanel from './ResultsPanel'

const HEALTH_CATEGORY_RE = /hospital|health|dispensary|blood/i

function downloadBlob(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function SpatialAnalysis() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() => JSON.parse(JSON.stringify(DEMO_QUERY)))
  const [capability, setCapability] = useState(null)
  const [savedQueriesCap, setSavedQueriesCap] = useState('unverified')
  const [catalog, setCatalog] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [roads, setRoads] = useState([])
  const [dataError, setDataError] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [runError, setRunError] = useState(null)
  const [saveNotice, setSaveNotice] = useState('')
  const [mode, setMode] = useState('simple') // 'simple' | 'advanced'

  const validation = useMemo(() => validateQuery(query), [query])

  // Bootstrap: capabilities + real collections
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cap, savedCap, catalogData, facilityData] = await Promise.all([
          spatialAnalysisCapability(),
          savedQueriesCapability(),
          loadCatalog(),
          loadFacilities(),
        ])
        if (cancelled) return
        setCapability(cap)
        setSavedQueriesCap(savedCap)
        setCatalog(catalogData)
        setFacilities(facilityData)
        Promise.all(ROAD_LAYER_NAMES.map((name) => loadLayerFeatures(name).catch(() => null)))
          .then((results) => {
            if (cancelled) return
            const allRoads = results.filter(Boolean).flatMap((data) => data.features || [])
            setRoads(allRoads)
          })
      } catch (error) {
        if (!cancelled) {
          setDataError(error?.message || 'The GIS catalog or facilities collection could not be loaded.')
          setDataLoading(false)
        }
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const gisLayers = useMemo(() => {
    if (!catalog?.categories) return []
    return Object.values(catalog.categories).flat().map((layer) => ({
      id: layer.name,
      name: layer.displayName || layer.name,
      geometryType: layer.geometryType,
      featureCount: layer.featureCount,
      source: 'gis-layer',
    }))
  }, [catalog])

  const facilityCategories = useMemo(() => {
    const categories = facilityCategoriesFrom(facilities)
    const healthRows = categories.filter((c) => HEALTH_CATEGORY_RE.test(c.name)).flatMap((c) => c.rows)
    const departmentEntries = []
    Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
      ;(config.entityGroups || []).forEach((group) => {
        if (group.source !== 'facility-category') return
        const rows = entityRowsFromFacilities(facilities, group)
        if (rows.length) {
          departmentEntries.push({
            id: `dept:${config.departmentId}:${group.id}`,
            name: `${config.departmentName} — ${group.label}`,
            geometryType: 'Point',
            source: 'facility-category',
            rows,
            featureCount: rows.length,
          })
        }
      })
    })
    if (healthRows.length) {
      return [
        { id: 'health', name: 'Health facilities (all)', geometryType: 'Point', source: 'facility-category', rows: healthRows, featureCount: healthRows.length },
        ...categories,
        ...departmentEntries,
      ]
    }
    return [...categories, ...departmentEntries]
  }, [facilities])

  // Department-aware prefill
  useEffect(() => {
    const departmentId = searchParams.get('department')
    if (!departmentId) return
    const config = getDepartmentConfig(departmentId)
    const first = config.entityGroups?.[0]
    if (!first) return
    if (first.source === 'gis-layer') {
      const layer = gisLayers.find((l) => l.id === first.layerName)
      if (layer) setQuery((current) => ({ ...current, targetLayer: { type: 'gis-layer', id: layer.id, name: layer.name, geometryType: layer.geometryType }, spatial: { condition: 'within_radius', distanceKm: 10, reference: { type: 'point', point: [85.4434, 25.1372] } }, filters: [] }))
    } else {
      const entry = facilityCategories.find((c) => c.id === `dept:${departmentId}:${first.id}`)
      if (entry) setQuery((current) => ({ ...current, targetLayer: { type: 'facility-category', id: entry.id, name: entry.name, geometryType: 'Point' }, spatial: { condition: 'within_radius', distanceKm: 10, reference: { type: 'point', point: [85.4434, 25.1372] } }, filters: [] }))
    }
  }, [searchParams, gisLayers, facilityCategories])

  const layerOptions = useMemo(() => ({ gisLayers, facilityCategories }), [gisLayers, facilityCategories])

  const resolveTargetRows = useCallback(async (targetLayer) => {
    if (!targetLayer?.id) return []
    if (targetLayer.source === 'facility-category') {
      const category = facilityCategories.find((c) => c.id === targetLayer.id)
      return category ? toFeatureRows({ ...category, source: 'facility-category' }) : []
    }
    const layer = gisLayers.find((l) => l.id === targetLayer.id)
    if (!layer) return []
    const data = await loadLayerFeatures(layer.id)
    return toFeatureRows({ ...data, name: layer.id })
  }, [facilityCategories, gisLayers])

  const resolveReference = useCallback(async (spatial) => {
    if (!spatial?.reference) return { rows: [], point: null }
    const reference = spatial.reference
    if (reference.type === 'point') return { rows: [], point: Array.isArray(reference.point) ? reference.point : null }
    if (reference.type === 'facility-category') {
      const categories = reference.id === 'health'
        ? facilityCategories.filter((c) => c.id === 'health')
        : facilityCategories.filter((c) => c.id === reference.id)
      const rows = categories.flatMap((category) => toFeatureRows({ ...category, source: 'facility-category' }))
      const healthCategory = facilityCategories.find((c) => c.id === 'health')
      return { rows, point: rows[0]?.position || null, resolvedName: healthCategory ? healthCategory.name : null }
    }
    const layer = gisLayers.find((l) => l.id === reference.id)
    if (!layer) return { rows: [], point: null }
    const data = await loadLayerFeatures(layer.id)
    const rows = toFeatureRows({ ...data, name: layer.id })
    return { rows, point: rows[0]?.position || null }
  }, [facilityCategories, gisLayers])

  const targetRows = useMemo(() => result?.targetRows || [], [result])
  const targetFieldCatalog = useMemo(() => buildFieldCatalog(targetRows), [targetRows])

  const runQuery = useCallback(async (queryToRun = query) => {
    const check = validateQuery(queryToRun)
    if (check.errors.length) return
    setExecuting(true)
    setRunError(null)
    setResult(null)
    try {
      const targetLayerRows = await resolveTargetRows(queryToRun.targetLayer)
      const reference = await resolveReference(queryToRun.spatial)
      const facilitiesMap = new Map(facilities.map((f) => [String(f.id), f]))
      const resultData = await executeSpatialAnalysis(queryToRun, {
        targetRows: targetLayerRows,
        referenceRows: reference.rows,
        roads,
        facilitiesMap,
      })
      setResult({ ...resultData, targetRows: targetLayerRows, referenceRows: reference.rows, referencePoint: reference.point })
    } catch (error) {
      setRunError(error)
    } finally {
      setExecuting(false)
    }
  }, [query, resolveTargetRows, resolveReference, facilities, roads])

  const handleRelaxFilter = useCallback((accessibilityValue) => {
    setQuery((current) => {
      const filters = (current.filters || []).filter((f) => f.field !== 'accessibility')
      const next = accessibilityValue == null
        ? { ...current, filters }
        : { ...current, filters: [...filters, { id: `f-relax-${Date.now()}`, field: 'accessibility', operator: 'eq', value: accessibilityValue, logic: 'and' }] }
      setTimeout(() => runQuery(next), 0)
      return next
    })
  }, [runQuery])

  const handleExport = useCallback((format) => {
    if (!result?.results?.length) return
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const target = query.targetLayer?.id || 'results'
    if (format === 'csv') {
      downloadBlob(resultsToCsv(result, query.outputFields), `spatial-analysis-${target}-${stamp}.csv`, 'text/csv')
    } else {
      downloadBlob(resultsToGeoJson(result), `spatial-analysis-${target}-${stamp}.geojson`, 'application/geo+json')
    }
  }, [result, query])

  const handleSave = useCallback((form) => {
    if (savedQueriesCap !== 'supported') {
      setSaveNotice('Backend dependency: GET /api/saved-queries/ is not deployed yet — the query could not be persisted. The query builder and export remain fully functional.')
      return
    }
    setSaveNotice(`Save API is live — "${form.name}" would be persisted with ${form.visibility} visibility. (Persistence requires the backend contract; wiring is ready.)`)
  }, [savedQueriesCap])

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
      <PageHeader
        eyebrow="DDST · Spatial Analysis"
        title="Find Locations"
        description="Use simple questions to identify areas that may need attention."
        action={
          <div className="flex items-center gap-2">
            <Button size="md" variant="primary" onClick={() => runQuery(query)} loading={executing} disabled={validation.errors.length > 0}>
              {executing ? 'Finding...' : 'Find Results'}
            </Button>
            <Button size="md" variant="outline" onClick={() => { setQuery(JSON.parse(JSON.stringify(DEMO_QUERY))); setResult(null); setRunError(null); setMode('simple') }}>
              <RefreshCw size={14} /> Reset
            </Button>
          </div>
        }
      />

      <div className="px-6 pb-6 space-y-3">
        {/* Engine mode banner */}
        <div className={clsx('flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px]', capability === 'client-engine' ? 'border-sky-200 bg-sky-50/70 text-sky-800' : capability === 'backend' ? 'border-leaf-200 bg-leaf-50/70 text-leaf-800' : 'border-ink-200 bg-ink-50/70 text-ink-700')}>
          {capability === 'backend' ? <Server size={14} className="shrink-0" /> : <Database size={14} className="shrink-0" />}
          {dataLoading && <Badge tone="info" dot>Loading real data...</Badge>}
          {!dataLoading && <Badge tone="neutral">{facilityCategories.length} facility categories · {gisLayers.length} GIS layers · {roads.length} road features</Badge>}
        </div>

        {dataError && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-800">
            Data could not be loaded: {dataError}. Re-run the query once the backend is reachable.
          </div>
        )}

        {saveNotice && (
          <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12px] text-ink-600">{saveNotice}</div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Builder */}
          <div>
            {mode === 'simple' ? (
              <SimpleQueryBuilder
                query={query}
                setQuery={setQuery}
                layers={layerOptions}
                onExecute={() => runQuery(query)}
                loading={executing}
                hasResults={Boolean(result?.results?.length)}
                onSwitchToAdvanced={() => setMode('advanced')}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setMode('simple')}>
                    <ArrowLeft size={14} /> Simple mode
                  </Button>
                </div>
                <QueryBuilder
                  query={query}
                  setQuery={setQuery}
                  layers={layerOptions}
                  targetFieldCatalog={targetFieldCatalog}
                  errors={validation.errors}
                  warnings={validation.warnings}
                  capabilities={{ savedQueries: savedQueriesCap }}
                  result={result}
                  onExecute={() => runQuery(query)}
                  onSave={handleSave}
                  onExport={handleExport}
                  loading={executing}
                />
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            {!result && !executing && !runError && (
              <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400 mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h4 className="text-[14.5px] font-semibold text-ink-800">Find locations that need attention</h4>
                <p className="text-[13px] text-ink-500 mt-1 max-w-md">Choose a question above or create your own search. Results will appear here with a map, ranked list and summary.</p>
              </div>
            )}
            {executing && (
              <div className="card flex items-center justify-center gap-3 px-6 py-16 text-[13.5px] text-ink-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" />
                Finding locations against real backend data...
              </div>
            )}
            {runError && (
              <div className="card p-6 text-center">
                <h4 className="text-[14px] font-semibold text-ink-800 mb-1">Unable to load results</h4>
                <p className="text-[13px] text-ink-500 mb-3">{runError.message || 'Please try again.'}</p>
                <Button size="sm" variant="outline" onClick={() => runQuery(query)}>Try Again</Button>
              </div>
            )}
            {result && (
              <ResultsPanel
                result={result}
                query={query}
                loading={executing}
                error={runError}
                onRelaxFilter={handleRelaxFilter}
                onExport={handleExport}
                referenceRows={result?.referenceRows || []}
                referencePoint={result?.referencePoint || null}
                targetGeometryRows={result?.targetRows || []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
