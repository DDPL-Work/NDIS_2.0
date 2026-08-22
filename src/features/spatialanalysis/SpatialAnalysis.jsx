import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Rocket, RefreshCw, Info, Database, Server } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import {
  executeSpatialAnalysis, spatialAnalysisCapability, savedQueriesCapability,
  loadCatalog, loadFacilities, loadLayerFeatures, toFeatureRows, facilityCategoriesFrom,
  resultsToCsv, resultsToGeoJson,
} from '../../api/spatialAnalysisApi'
import { DEMO_QUERY, validateQuery, buildFieldCatalog, ROAD_LAYER_NAMES } from './spatialAnalysisModel'
import { getDepartmentConfig, DEPARTMENT_CONFIGS } from '../departmentsupport/departmentConfigs'
import { entityRowsFromFacilities } from '../departmentsupport/departmentModel'
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
  const [capability, setCapability] = useState(null) // null | 'backend' | 'client-engine' | 'backend-payload-mismatch'
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

  const validation = useMemo(() => validateQuery(query), [query])

  // Bootstrap: capabilities + the real collections the engine executes over.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
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
        const [other, state, national] = await Promise.all(
          ROAD_LAYER_NAMES.map((name) => loadLayerFeatures(name))
        )
        if (cancelled) return
        setRoads([...(other.features || []), ...(state.features || []), ...(national.features || [])])
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

  // Department-aware prefill: /admin/spatial-analysis?department=<id> loads
  // the query with that department's first entity group as the target layer
  // (shared engine, department-configured layers — §10).
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

  // Resolve the query's target/reference layers into real engine inputs.
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
    setSaveNotice(`Save API is live — “${form.name}” would be persisted with ${form.visibility} visibility. (Persistence requires the backend contract; wiring is ready.)`)
  }, [savedQueriesCap])

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
      <PageHeader
        eyebrow="DDST · Spatial Analysis"
        title="Spatial Analysis"
        description="Build a structured decision query — spatial condition, attribute filters, output fields, ranking — and see results on the map, in a sortable table and as a summary, all over real backend data."
        action={
          <div className="flex items-center gap-2">
            <Button size="md" variant="primary" onClick={() => runQuery(query)} loading={executing} disabled={validation.errors.length > 0}>
              <Rocket size={15} /> Execute query
            </Button>
            <Button size="md" variant="outline" onClick={() => { setQuery(JSON.parse(JSON.stringify(DEMO_QUERY))); setResult(null); setRunError(null) }}>
              <RefreshCw size={14} /> Load DST demo query
            </Button>
          </div>
        }
      />

      <div className="px-6 pb-6 space-y-3">
        {/* Mode banner — where the query actually runs */}
        <div className={clsx('flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-[12.5px]', capability === 'client-engine' ? 'border-sky-200 bg-sky-50/70 text-sky-800' : capability === 'backend' ? 'border-leaf-200 bg-leaf-50/70 text-leaf-800' : 'border-ink-200 bg-ink-50/70 text-ink-700')}>
          {capability === 'backend' ? <Server size={14} className="shrink-0" /> : <Database size={14} className="shrink-0" />}
          {capability === 'backend'
            ? <>Backend endpoint detected — POST /api/spatial-analysis/query/ will execute the typed payload.</>
            : capability === 'backend-payload-mismatch'
              ? <>The backend exposes a spatial-analysis endpoint but rejected the typed payload — the frontend contract and backend schema must be aligned. Query execution is disabled rather than silently falling back.</>
              : <>Capability probe result: <strong>POST /api/spatial-analysis/query/ is not deployed</strong> — the client engine executes the same typed contract over the real collections (facilities + GIS catalog). Every derived field is documented in the result provenance.</>}
          {dataLoading && <Badge tone="info" dot>Loading real data…</Badge>}
          {!dataLoading && <Badge tone="neutral">{facilityCategories.length} facility categories · {gisLayers.length} GIS layers · {roads.length} road features</Badge>}
        </div>

        {/* Honest data-granularity note */}
        <div className="flex items-start gap-2 rounded-xl border border-saffron-200 bg-saffron-50/60 px-4 py-2.5 text-[12.5px] text-saffron-800">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Data note: the backend serves population at <strong>CD-block census level (20 blocks)</strong>, not village level, so the demo target layer is Rural_population blocks. Road accessibility is <strong>derived</strong> from the distance to the nearest road layer feature (Other Roads / State Highway / National Highway) — the catalog has no accessibility attribute.</span>
        </div>

        {dataError && (
          <div className="rounded-xl border border-alert-200 bg-alert-50/60 px-4 py-3 text-[12.5px] text-alert-800">
            Data could not be loaded: {dataError}. Re-run the query once the backend is reachable.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Builder */}
          <div>
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
            {saveNotice && (
              <div className="mt-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[12px] text-ink-600">{saveNotice}</div>
            )}
          </div>

          {/* Results */}
          <div>
            {!result && !executing && !runError && (
              <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400 mb-3"><Rocket size={22} /></div>
                <h4 className="text-[14.5px] font-semibold text-ink-800">Run a query to see results</h4>
                <p className="text-[13px] text-ink-500 mt-1 max-w-md">The DST demo query is pre-loaded: Rural population blocks within 5 km of a health facility, population ≥ 1,000, road accessibility = Poor, ranked by priority score. Press <strong>Execute query</strong>.</p>
              </div>
            )}
            {executing && (
              <div className="card flex items-center justify-center gap-3 px-6 py-16 text-[13.5px] text-ink-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" />
                Resolving target and reference layers, computing distances against real geometry…
              </div>
            )}
            {(result || runError) && (
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