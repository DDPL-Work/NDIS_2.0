import { useMemo, useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Map as MapIcon, Table2, LayoutDashboard, SearchX, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, AlertTriangle, Info, MapPin, Building2, Shield, Circle } from 'lucide-react'
import MapView from '../../components/map/MapView'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { GapScoreLegend, SpatialAnalysisLegend } from '../../components/map/MapLegend'
import { bufferPolygon } from '../../gis/engine/SpatialAnalysisEngine'
import { resolveField } from './spatialAnalysisModel'
import { formatScorePercent } from '../../utils/format'

const TABS = [
  { key: 'map', label: 'Map', icon: MapIcon },
  { key: 'table', label: 'Table', icon: Table2 },
  { key: 'summary', label: 'Summary', icon: LayoutDashboard },
]

function getReferenceColumnLabel(referenceLayerName, referenceLayerType) {
  if (!referenceLayerName) return 'Nearest Reference'
  const name = referenceLayerName.toLowerCase()
  if (name.includes('police')) return 'Nearest Police Station'
  if (name.includes('hospital') || name.includes('health') || name.includes('dispensary')) return 'Nearest Hospital'
  if (name.includes('school') || name.includes('education')) return 'Nearest School'
  if (name.includes('bank')) return 'Nearest Bank'
  if (name.includes('facility')) return 'Nearest Facility'
  if (referenceLayerType === 'point') return 'Distance to Point'
  return `Nearest ${referenceLayerName}`
}

const COLUMNS = (referenceLayerName, referenceLayerType) => [
  { key: 'rank', label: '#', align: 'right' },
  { key: 'name', label: 'Name' },
  { key: 'population', label: 'Population', align: 'right' },
  { key: 'nearestReference', label: getReferenceColumnLabel(referenceLayerName, referenceLayerType) },
  { key: 'distanceKm', label: 'Distance (km)', align: 'right' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'gapScore', label: 'Gap score', align: 'right' },
  { key: 'priorityScore', label: 'Priority', align: 'right' },
]

function AccessibilityBadge({ value }) {
  if (value === 'Good') return <Badge tone="positive">{value}</Badge>
  if (value === 'Moderate') return <Badge tone="warning">{value}</Badge>
  if (value === 'Poor') return <Badge tone="negative">{value}</Badge>
  return <Badge tone="neutral">{value || 'Unknown'}</Badge>
}

export default function ResultsPanel({
  result,
  query,
  loading,
  error,
  onRelaxFilter,
  onExport,
  referenceRows = [],
  referencePoint,
  targetGeometryRows = [],
}) {
  const [tab, setTab] = useState('map')
  const [sort, setSort] = useState({ field: 'priorityScore', direction: 'desc' })
  const [detailRow, setDetailRow] = useState(null)
  const [selectedResultId, setSelectedResultId] = useState(null)
  const mapRef = useRef(null)

  const rows = result?.results || []

  // Development diagnostics to trace data flow
  if (import.meta.env.DEV) {
    useEffect(() => {
      console.debug('[SPATIAL ANALYSIS PIPELINE]', {
        stage: 'ResultsPanel received',
        resultsCount: rows.length,
        referenceRowsCount: referenceRows.length,
        targetGeometryRowsCount: targetGeometryRows.length,
        firstResult: rows[0] ? {
          id: rows[0].id,
          name: rows[0].name,
          position: rows[0].position,
          rank: rows[0].rank,
          nearestReference: rows[0].nearestReference,
          distanceKm: rows[0].distanceKm,
          priorityScore: rows[0].priorityScore,
        } : null,
        allIds: rows.map(r => r.id),
      })
    }, [rows, referenceRows.length, targetGeometryRows.length])
  }

  // Sync selectedResultId with detailRow
  useEffect(() => {
    if (detailRow) {
      setSelectedResultId(String(detailRow.id))
    } else {
      setSelectedResultId(null)
    }
  }, [detailRow])

  // Handle table row click
  const handleTableRowClick = (row) => {
    setDetailRow(row)
    setSelectedResultId(String(row.id))
    // Fly to the feature on the map
    if (mapRef.current && row.position) {
      mapRef.current.flyTo([row.position[1], row.position[0]], 15, { duration: 0.8 })
    }
  }

  // Handle map marker click
  const handleMapFacilityClick = (facility) => {
    const matchedRow = rows.find((r) => String(r.id) === String(facility.id))
    if (matchedRow) {
      setDetailRow(matchedRow)
      setSelectedResultId(String(facility.id))
    }
  }

  // Target results (the matched features from the analysis)
  const targetFacilities = useMemo(() => {
    const facilities = rows
      .map((row) => ({
        id: String(row.id),
        name: row.name,
        position: row.position,
        gapScore: row.gapScore ?? 0,
        population: row.population,
        accessibility: row.accessibility,
        distanceKm: row.distanceKm,
        priorityScore: row.priorityScore,
        isTarget: true,
        nearestReference: row.nearestReference,
      }))
      .filter((f) => Array.isArray(f.position))

    if (import.meta.env.DEV) {
      console.debug('[SPATIAL ANALYSIS PIPELINE]', {
        stage: 'ResultsPanel targetFacilities created',
        totalRows: rows.length,
        facilitiesWithPosition: facilities.length,
        facilitiesWithoutPosition: rows.length - facilities.length,
        missingPositionRows: rows.filter(r => !Array.isArray(r.position)).map(r => r.name),
      })
    }

    return facilities
  }, [rows])

  // Reference features (the comparison layer features)
  const referenceFacilities = useMemo(() => referenceRows
    .filter((row) => Array.isArray(row.position))
    .map((row) => ({
      id: `ref-${row.id}`,
      name: row.name,
      position: row.position,
      gapScore: 0,
      population: null,
      accessibility: null,
      distanceKm: null,
      priorityScore: null,
      isTarget: false,
      isReference: true,
    })), [referenceRows])

  // Combined facilities for map rendering
  const facilities = useMemo(() => [...targetFacilities, ...referenceFacilities], [targetFacilities, referenceFacilities])

  // Build a lookup map for reference features by name for connection lines
  const referenceFeatureMap = useMemo(() => {
    const map = new Map()
    referenceRows.forEach((row) => {
      if (row.name && Array.isArray(row.position)) {
        map.set(row.name, row.position)
      }
    })
    return map
  }, [referenceRows])

  // Create connection lines from target to nearest reference
  const connectionLines = useMemo(() => {
    const lines = []
    rows.forEach((row) => {
      if (row.nearestReference && row.position && referenceFeatureMap.has(row.nearestReference)) {
        const refPos = referenceFeatureMap.get(row.nearestReference)
        lines.push({
          type: 'Feature',
          properties: {
            targetName: row.name,
            referenceName: row.nearestReference,
            distanceKm: row.distanceKm,
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [row.position[0], row.position[1]],
              [refPos[0], refPos[1]],
            ],
          },
        })
      }
    })
    return lines
  }, [rows, referenceFeatureMap])

  const vectorLayers = useMemo(() => {
    const layers = []
    const bufferGeometry = bufferPolygon(referencePoint, Number(query?.spatial?.distanceKm) || 0)
    if (bufferGeometry) {
      layers.push({ layerName: 'Distance buffer', category: 'spatial-analysis', features: [{ type: 'Feature', properties: { label: `${query?.spatial?.distanceKm} km buffer` }, geometry: bufferGeometry }] })
    }
    if (targetGeometryRows.length) {
      layers.push({
        layerName: 'Matched target geometry',
        category: 'spatial-analysis',
        features: targetGeometryRows
          .filter((row) => row.geometry)
          .map((row) => ({ type: 'Feature', properties: { name: row.name }, geometry: row.geometry })),
      })
    }
    if (referenceRows.length) {
      layers.push({
        layerName: 'Reference features',
        category: 'spatial-analysis',
        style: (feature) => ({
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillColor: '#a855f7',
          fillOpacity: 0.9,
          radius: 8,
        }),
        features: referenceRows
          .filter((row) => Array.isArray(row.position))
          .map((row) => ({ type: 'Feature', properties: { name: row.name }, geometry: { type: 'Point', coordinates: row.position } })),
      })
    }
    if (connectionLines.length) {
      layers.push({
        layerName: 'Nearest facility connections',
        category: 'spatial-analysis',
        style: () => ({
          color: '#c0392b',
          weight: 1.5,
          opacity: 0.6,
          dashArray: '4, 4',
        }),
        features: connectionLines,
      })
    }
    return layers
  }, [referencePoint, query?.spatial?.distanceKm, referenceRows, targetGeometryRows, connectionLines])

  const sortedRows = useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = resolveField(a, sort.field)
      const bv = resolveField(b, sort.field)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction
      return String(av).localeCompare(String(bv)) * direction
    })
  }, [rows, sort])

  const referenceLayerName = result?.summary?.referenceLayer || result?.provenance?.referenceLayer || query?.spatial?.reference?.name || ''
  const referenceLayerType = result?.summary?.referenceLayerType || result?.provenance?.referenceLayerType || query?.spatial?.reference?.type || ''
  const targetLayerName = result?.summary?.targetLayer || result?.provenance?.targetLayer || query?.targetLayer?.name || ''
  const distanceKm = query?.spatial?.distanceKm
  const condition = query?.spatial?.condition
  const columns = useMemo(() => COLUMNS(referenceLayerName, referenceLayerType), [referenceLayerName, referenceLayerType])

  // Compute priority stats for legend
  const priorityStats = useMemo(() => {
    const stats = { High: 0, Medium: 0, Low: 0 }
    rows.forEach((row) => {
      const score = row.priorityScore ?? 0
      if (score >= 70) stats.High++
      else if (score >= 40) stats.Medium++
      else stats.Low++
    })
    return stats
  }, [rows])

  const toggleSort = (field) => {
    setSort((current) => (current.field === field
      ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { field, direction: 'desc' }))
  } 
  
  
  const popTotal = rows.reduce((acc, r) => acc + (Number(resolveField(r, 'population')) || 0), 0)
  const poorCount = rows.filter((r) => r.accessibility === 'Poor').length
  const goodCount = rows.filter((r) => r.accessibility === 'Good').length
  const moderateCount = rows.filter((r) => r.accessibility === 'Moderate').length
  const maxDistance = rows.length ? Math.max(...rows.map((r) => Number(r.distanceKm) || 0)) : 0

  const accessibilityFilter = (query?.filters || []).find((f) => f.field === 'accessibility')

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-64 rounded-xl bg-ink-100" />
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-ink-100" />)}
          </div>
        </div>
        <p className="text-[12.5px] text-ink-500 mt-3 text-center">Finding locations against real data...</p>
      </div>
    )
  }

  // Natural-language summary of results
  const summaryText = useMemo(() => {
    if (!rows.length) return null
    const targetName = query?.targetLayer?.name || 'locations'
    const refName = query?.spatial?.reference?.name || 'service'
    const distKm = query?.spatial?.distanceKm
    const popTotal = rows.reduce((acc, r) => acc + (Number(resolveField(r, 'population')) || 0), 0)
    const poorRows = rows.filter((r) => r.accessibility === 'Poor')
    const topPriority = rows[0]

    const parts = []
    parts.push(`${rows.length} ${targetName} match your search.`)
    if (popTotal > 0) parts.push(`These cover approximately ${popTotal.toLocaleString('en-IN')} people.`)
    if (poorRows.length > 0) parts.push(`${poorRows.length} have poor accessibility to ${refName}.`)
    if (topPriority?.priorityScore != null) parts.push(`Top priority area: "${topPriority.name}" (priority score ${topPriority.priorityScore.toFixed(1)}).`)
    if (distKm && rows.some((r) => r.distanceKm > Number(distKm) * 0.7)) {
      const farCount = rows.filter((r) => Number(r.distanceKm) > Number(distKm) * 0.7).length
      if (farCount > 0) parts.push(`${farCount} are more than ${Math.round(Number(distKm) * 0.7)} km from the nearest facility — these may need urgent attention.`)
    }
    return parts.join(' ')
  }, [rows, query])

  if (error) {
    return (
      <div className="space-y-3">
        <EmptyState
          icon={SearchX}
          title="Something went wrong"
          description={error.message || 'Could not load results. Please try again.'}
        />
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onClick={() => onRelaxFilter(null)}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (!result || rows.length === 0) {
    const diagnosis = result?.diagnosis || {}
    return (
      <div className="space-y-3">
        <EmptyState
          icon={SearchX}
          title="No results found"
          description="No locations match your current search. This usually means the conditions are too strict for the available data."
        />
        {/* Plain-language diagnosis */}
        {result && (
          <div className="card p-4 space-y-3">
            <h4 className="text-[13px] font-semibold text-ink-800 flex items-center gap-2">
              <Info size={14} className="text-ink-500" /> Why were no results found?
            </h4>
            <ul className="space-y-1.5 text-[12.5px] text-ink-600">
              {diagnosis.blocksExamined != null && (
                <li>Searched <strong>{diagnosis.blocksExamined}</strong> areas in total.</li>
              )}
              {diagnosis.withinRadius != null && (
                <li><strong>{diagnosis.withinRadius}</strong> are within {query?.spatial?.distanceKm || '?'} km of a facility (some may have been excluded by other filters).</li>
              )}
              {diagnosis.populationPassed != null && (
                <li><strong>{diagnosis.populationPassed}</strong> match the population filter.</li>
              )}
              {accessibilityFilter && (
                <li>The search requires accessibility = "<strong>{String(accessibilityFilter.value)}</strong>", but only <strong>{diagnosis.byAccessibility?.Poor ?? 0}</strong> areas qualify as Poor — that is why the set is empty.</li>
              )}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onRelaxFilter('Good')}>Show areas with Good access</Button>
              <Button size="sm" variant="outline" onClick={() => onRelaxFilter('Moderate')}>Show areas with Moderate access</Button>
              <Button size="sm" variant="ghost" onClick={() => onRelaxFilter(null)}>Remove accessibility filter</Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Result header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-ink-900">{rows.length} result{rows.length === 1 ? '' : 's'}</span>
          <Badge tone={result.mode === 'backend' ? 'positive' : 'info'} dot>
            {result.mode === 'backend' ? 'Backend endpoint' : 'Client engine (real data)'}
          </Badge>
          {accessibilityFilter && <Badge tone="neutral">accessibility = {accessibilityFilter.value}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onExport('csv')}>Export CSV</Button>
          <Button size="sm" variant="outline" onClick={() => onExport('geojson')}>Export GeoJSON</Button>
        </div>
      </div>

      {/* Summary banner */}
      {summaryText && (
        <div className="flex items-start gap-3 rounded-xl border border-leaf-200 bg-leaf-50/60 px-4 py-3">
          <Info size={16} className="text-leaf-600 mt-0.5 shrink-0" />
          <p className="text-[13px] text-leaf-800 leading-relaxed">{summaryText}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-ink-100">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx('flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors -mb-px', active ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800')}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* MAP TAB */}
      {tab === 'map' && (
        <div className="card overflow-hidden">
          <div className="relative h-[460px]">
            <MapView
              ref={mapRef}
              facilities={facilities}
              colorBy="spatial-analysis"
              selectedId={selectedResultId}
              vectorLayers={vectorLayers}
              onFacilityClick={handleMapFacilityClick}
              spatialAnalysisResults={{
                targetFacilities,
                referenceFacilities,
                fitToTargetOnly: true,
              }}
            />
            <div className="absolute right-2 top-2 z-[500] flex flex-col gap-2">
              <SpatialAnalysisLegend
                targetLayerLabel={targetLayerName}
                referenceLayerLabel={referenceLayerName}
                distanceKm={distanceKm}
                condition={condition}
                referenceLayerType={referenceLayerType}
                priorityStats={priorityStats}
              />
              <GapScoreLegend />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-ink-100">
            <p className="text-[12px] text-ink-500">
              Blue markers = {targetLayerName || 'Target'}; Purple markers = {referenceLayerName || 'Reference'}; Colored by gap score (green=well served, red=underserved). Buffer shows {distanceKm || '?'} km radius.
            </p>
            <button onClick={() => setDetailRow(rows[0] || null)} className="text-[12px] font-medium text-ink-700 hover:text-ink-900">Open top result →</button>
          </div>
        </div>
      )}

      {/* TABLE TAB */}
      {tab === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-ink-100 text-[11.5px] uppercase tracking-wide text-ink-500">
                  {columns.map((col) => (
                    <th key={col.key} className={clsx('px-3 py-2.5 font-semibold cursor-pointer select-none hover:text-ink-800', col.align === 'right' && 'text-right')} onClick={() => toggleSort(col.key)}>
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sort.field === col.key
                          ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                          : <ArrowUpDown size={12} className="opacity-40" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, index) => (
                  <tr key={`${String(row.id)}-${index}`} onClick={() => handleTableRowClick(row)} className={clsx('border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer', selectedResultId === String(row.id) && 'bg-blue-50')}>
                    <td className="px-3 py-2 text-right text-ink-400">{row.rank}</td>
                    <td className="px-3 py-2 font-medium text-ink-900">{row.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{Number(resolveField(row, 'population'))?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className="px-3 py-2 text-ink-600">{row.nearestReference || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.distanceKm != null ? `${row.distanceKm} km` : '—'}</td>
                    <td className="px-3 py-2"><AccessibilityBadge value={row.accessibility} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.gapScore != null ? formatScorePercent(row.gapScore) : '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-ink-900">{row.priorityScore != null ? formatScorePercent(row.priorityScore) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUMMARY TAB */}
      {tab === 'summary' && (
        <div className="space-y-3">
          {/* Natural language summary */}
          {summaryText && (
            <div className="card p-4">
              <h4 className="text-[13.5px] font-semibold text-ink-900 mb-2">What we found</h4>
              <p className="text-[13px] text-ink-700 leading-relaxed">{summaryText}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: 'Results', value: rows.length.toLocaleString('en-IN') },
              { label: 'Population covered', value: popTotal.toLocaleString('en-IN'), sub: 'sum of matched features' },
              { label: 'Nearest distance (max)', value: `${maxDistance.toFixed(1)} km` },
              { label: 'Accessibility', value: `${goodCount} G / ${moderateCount} M / ${poorCount} P`, sub: 'Good / Moderate / Poor' },
            ].map((stat) => (
              <div key={stat.label} className="card px-4 py-3">
                <span className="eyebrow">{stat.label}</span>
                <div className="mt-1 text-xl font-display font-semibold text-ink-950">{stat.value}</div>
                {stat.sub && <p className="text-[11.5px] text-ink-500 mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </div>

          <div className="card p-4">
            <h4 className="text-[13.5px] font-semibold text-ink-900 mb-2">Search details</h4>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              <div className="flex justify-between gap-4"><dt className="text-ink-500">What</dt><dd className="text-ink-800 font-medium">{result.summary?.targetLayer || query?.targetLayer?.name || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Compared to</dt><dd className="text-ink-800 font-medium">{result.summary?.referenceLayer || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Distance</dt><dd className="text-ink-800 font-medium">{result.summary?.condition || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Limit</dt><dd className="text-ink-800 font-medium">{result.summary?.limit ?? '—'} results</dd></div>
            </dl>
          </div>

          {/* <div className="card p-4">
            <h4 className="text-[13.5px] font-semibold text-ink-900 mb-2">Derived fields & provenance</h4>
            <ul className="space-y-1 text-[12.5px] text-ink-600 list-disc ml-5">
              {(result.provenance?.computedFields || []).map((field, i) => <li key={i}>{field}</li>)}
              <li>Engine: {result.mode || 'client-engine'}</li>
              <li>Data source: {result.provenance?.endpoint || 'GET /api/facilities/ + GET /api/gis/layers/{name}/'}</li>
              <li>Backend query endpoint: {result.backendQueryEndpoint || result.provenance?.backendQueryEndpoint || '—'} (client engine executes the typed contract when not deployed)</li>
              <li>Generated: {result.provenance?.generatedAt || '—'}</li>
            </ul>
          </div> */}
        </div>
      )}

      {/* Row detail modal */}
      <Modal open={Boolean(detailRow)} onClose={() => setDetailRow(null)} title={detailRow?.name || 'Result detail'} width="max-w-xl">
        {detailRow && (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <AccessibilityBadge value={detailRow.accessibility} />
              <Badge tone="neutral">Priority {detailRow.priorityScore != null ? formatScorePercent(detailRow.priorityScore) : '—'}</Badge>
              <Badge tone="info">Gap {detailRow.gapScore != null ? formatScorePercent(detailRow.gapScore) : '—'}</Badge>
              {detailRow.rank && <Badge tone="neutral">Rank #{detailRow.rank}</Badge>}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Population</dt><dd className="text-ink-800 font-medium">{Number(resolveField(detailRow, 'population'))?.toLocaleString('en-IN') ?? '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">{getReferenceColumnLabel(detailRow.referenceLayerName, detailRow.referenceLayerType)}</dt><dd className="text-ink-800 font-medium">{detailRow.nearestReference || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Distance to reference</dt><dd className="text-ink-800 font-medium">{detailRow.distanceKm != null ? `${detailRow.distanceKm} km` : '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Road distance</dt><dd className="text-ink-800 font-medium">{detailRow.roadDistanceKm != null ? `${detailRow.roadDistanceKm} km` : '—'}</dd></div>
              <div className="flex justify-between gap-4 sm:col-span-2"><dt className="text-ink-500">Accessibility basis</dt><dd className="text-ink-800 font-medium text-right">{detailRow.accessibilityBasis || '—'}</dd></div>
            </dl>
            {(detailRow.properties && Object.keys(detailRow.properties).length > 0) && (
              <div>
                <h5 className="text-[12px] font-semibold uppercase tracking-wide text-ink-500 mb-1.5">Source attributes</h5>
                <div className="rounded-lg border border-ink-100 divide-y divide-ink-100 max-h-52 overflow-y-auto">
                  {Object.entries(detailRow.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 px-3 py-1.5 text-[12.5px]">
                      <span className="text-ink-500">{key}</span>
                      <span className="text-ink-800 font-medium text-right break-words max-w-[55%]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setDetailRow(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}