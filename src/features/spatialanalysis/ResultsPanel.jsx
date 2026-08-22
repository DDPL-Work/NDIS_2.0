import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Map as MapIcon, Table2, LayoutDashboard, SearchX, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import MapView from '../../components/map/MapView'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { GapScoreLegend } from '../../components/map/MapLegend'
import { bufferPolygon } from '../../gis/engine/SpatialAnalysisEngine'
import { resolveField } from './spatialAnalysisModel'

const TABS = [
  { key: 'map', label: 'Map', icon: MapIcon },
  { key: 'table', label: 'Table', icon: Table2 },
  { key: 'summary', label: 'Summary', icon: LayoutDashboard },
]

const COLUMNS = [
  { key: 'rank', label: '#', align: 'right' },
  { key: 'name', label: 'Name' },
  { key: 'population', label: 'Population', align: 'right' },
  { key: 'nearestFacility', label: 'Nearest facility' },
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

  const rows = result?.results || []

  const facilities = useMemo(() => rows
    .map((row) => ({
      id: String(row.id),
      name: row.name,
      position: row.position,
      gapScore: row.gapScore ?? 0,
      population: row.population,
      accessibility: row.accessibility,
      distanceKm: row.distanceKm,
      priorityScore: row.priorityScore,
    }))
    .filter((f) => Array.isArray(f.position)), [rows])

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
        features: referenceRows
          .filter((row) => Array.isArray(row.position))
          .map((row) => ({ type: 'Feature', properties: { name: row.name }, geometry: { type: 'Point', coordinates: row.position } })),
      })
    }
    return layers
  }, [referencePoint, query?.spatial?.distanceKm, referenceRows, targetGeometryRows])

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
        <p className="text-[12px] text-ink-500 mt-3 text-center">Executing the typed query against real backend collections…</p>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={SearchX}
        title="The query could not be executed"
        description={error.message || 'The backend rejected the request. No client-side fallback was attempted for this failure mode.'}
      />
    )
  }

  if (!result || rows.length === 0) {
    const diagnosis = result?.diagnosis || {}
    return (
      <EmptyState
        icon={SearchX}
        title="No rows match this query"
        description="The result set is empty because of how the real data is distributed. The engine reports the actual distribution so you can see exactly why."
        action={
          <div className="space-y-3 w-full max-w-md">
            <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-left text-[12.5px] text-ink-700 space-y-1">
              {diagnosis.blocksExamined != null && (
                <p><strong>{diagnosis.blocksExamined}</strong> target features examined.</p>
              )}
              {diagnosis.withinRadius != null && (
                <p><strong>{diagnosis.withinRadius}</strong> are within {query?.spatial?.distanceKm || '?'} km of the reference features (real distance).</p>
              )}
              {diagnosis.populationPassed != null && (
                <p><strong>{diagnosis.populationPassed}</strong> pass the population filter.</p>
              )}
              {diagnosis.roadRange && (
                <p>Nearest-road distances range <strong>{diagnosis.roadRange.min}–{diagnosis.roadRange.max} km</strong> (median {diagnosis.roadRange.median} km).</p>
              )}
              {accessibilityFilter && (
                <p>The accessibility filter requires “{String(accessibilityFilter.value)}” (<strong>{accessibilityFilter.value}</strong>), but <strong>{diagnosis.byAccessibility?.Poor ?? 0} features qualify as Poor</strong> — that is why the set is empty.</p>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onRelaxFilter('Good')}>Run with accessibility = Good</Button>
              <Button size="sm" variant="outline" onClick={() => onRelaxFilter('Moderate')}>Run with accessibility = Moderate</Button>
              <Button size="sm" variant="ghost" onClick={() => onRelaxFilter(null)}>Remove accessibility filter</Button>
            </div>
          </div>
        }
      />
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
              facilities={facilities}
              colorBy="gap"
              selectedId={detailRow ? String(detailRow.id) : null}
              vectorLayers={vectorLayers}
              onFacilityClick={(facility) => setDetailRow(rows.find((r) => String(r.id) === String(facility.id)) || null)}
            />
            <div className="absolute right-2 top-2 z-[500]">
              <GapScoreLegend />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-ink-100">
            <p className="text-[12px] text-ink-500">
              Markers coloured by the nearest facility gap score; polygons are the matched target features; the circle marks the {query?.spatial?.distanceKm || '?'} km reference radius.
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
                  {COLUMNS.map((col) => (
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
                {sortedRows.map((row) => (
                  <tr key={String(row.id)} onClick={() => setDetailRow(row)} className="border-b border-ink-50 hover:bg-ink-50/60 cursor-pointer">
                    <td className="px-3 py-2 text-right text-ink-400">{row.rank}</td>
                    <td className="px-3 py-2 font-medium text-ink-900">{row.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{Number(resolveField(row, 'population'))?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className="px-3 py-2 text-ink-600">{row.nearestFacility || '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.distanceKm != null ? `${row.distanceKm} km` : '—'}</td>
                    <td className="px-3 py-2"><AccessibilityBadge value={row.accessibility} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.gapScore != null ? row.gapScore.toFixed(2) : '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-semibold text-ink-900">{row.priorityScore?.toFixed(2) ?? '—'}</td>
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
            <h4 className="text-[13.5px] font-semibold text-ink-900 mb-2">Query executed</h4>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Target layer</dt><dd className="text-ink-800 font-medium">{result.summary?.targetLayer || query?.targetLayer?.name || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Condition</dt><dd className="text-ink-800 font-medium">{result.summary?.condition || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Reference</dt><dd className="text-ink-800 font-medium">{result.summary?.referenceLayer || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Result limit</dt><dd className="text-ink-800 font-medium">{result.summary?.limit ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="card p-4">
            <h4 className="text-[13.5px] font-semibold text-ink-900 mb-2">Derived fields & provenance</h4>
            <ul className="space-y-1 text-[12.5px] text-ink-600 list-disc ml-5">
              {(result.provenance?.computedFields || []).map((field, i) => <li key={i}>{field}</li>)}
              <li>Engine: {result.mode || 'client-engine'}</li>
              <li>Data source: {result.provenance?.endpoint || 'GET /api/facilities/ + GET /api/gis/layers/{name}/'}</li>
              <li>Backend query endpoint: {result.backendQueryEndpoint || result.provenance?.backendQueryEndpoint || '—'} (client engine executes the typed contract when not deployed)</li>
              <li>Generated: {result.provenance?.generatedAt || '—'}</li>
            </ul>
          </div>
        </div>
      )}

      {/* Row detail modal */}
      <Modal open={Boolean(detailRow)} onClose={() => setDetailRow(null)} title={detailRow?.name || 'Result detail'} width="max-w-xl">
        {detailRow && (
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <AccessibilityBadge value={detailRow.accessibility} />
              <Badge tone="neutral">Priority {detailRow.priorityScore?.toFixed(2) ?? '—'}</Badge>
              <Badge tone="info">Gap {detailRow.gapScore?.toFixed(2) ?? '—'}</Badge>
              {detailRow.rank && <Badge tone="neutral">Rank #{detailRow.rank}</Badge>}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Population</dt><dd className="text-ink-800 font-medium">{Number(resolveField(detailRow, 'population'))?.toLocaleString('en-IN') ?? '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-500">Nearest facility</dt><dd className="text-ink-800 font-medium">{detailRow.nearestFacility || '—'}</dd></div>
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