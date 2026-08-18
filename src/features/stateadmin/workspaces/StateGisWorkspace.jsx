// State GIS & Assets workspace (P8).
//   layers             → layer explorer with toggles over the state map
//   assets             → asset registry (register / edit / status)
//   district-assets    → assets scoped to one district
//   department-assets  → assets scoped to one department
// Rendered on the shared Leaflet MapView surface; layer toggles compose
// district boundaries (vector), asset/project markers and a density heat map.
import { useMemo, useState } from 'react'
import { Boxes, MapPinned, Warehouse, Layers, Plus, Eye, Edit3, MapPin, ChevronDown } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Select from '../../../components/ui/Select'
import EmptyState from '../../../components/ui/EmptyState'
import MapView from '../../../components/map/MapView'
import { useStateGisStore, ASSET_CATEGORIES } from '../store/stateGisStore'
import { useStateProjectStore } from '../store/stateProjectStore'
import { useStateMasterStore } from '../store/stateMasterStore'
import { backendFacilityApi } from '../../../api/facilityApi'
import { useStatePermission, useStateActor } from '../hooks/useStatePermissions'
import { useUiStore } from '../../../app/store/uiStore'
import { Field, FilterStrip, SummaryPill } from '../components/StateUI'

const STATE_CENTER = [85.46, 25.2]
const ASSET_TONE = { active: 'positive', inactive: 'neutral' }
const CONDITION_TONE = { excellent: 'positive', good: 'positive', fair: 'saffron', poor: 'negative' }

export default function StateGisWorkspace({ mode = 'layers' }) {
  const meta = {
    layers: { title: 'GIS Layers', eyebrow: 'STATE ADMIN · GIS & ASSETS · LAYER EXPLORER', icon: Layers, description: 'Explore state spatial layers — district boundaries, assets, projects and density heat.' },
    assets: { title: 'Asset Registry', eyebrow: 'STATE ADMIN · GIS & ASSETS · REGISTRY', icon: Boxes, description: 'State-owned assets with condition, value and location — every asset is mapped. ' },
    'district-assets': { title: 'District Assets', eyebrow: 'STATE ADMIN · GIS & ASSETS · DISTRICT', icon: MapPinned, description: 'Assets grouped by district for field inspection planning. ' },
    'department-assets': { title: 'Department Assets', eyebrow: 'STATE ADMIN · GIS & ASSETS · DEPARTMENT', icon: Warehouse, description: 'Assets grouped by owning department with value roll-up. ' },
  }[mode]
  return (
    <div className="px-6 pb-10">
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />
      <GisBody mode={mode} />
    </div>
  )
}

function GisBody({ mode }) {
  const gis = useStateGisStore()
  const master = useStateMasterStore()
  const projects = useStateProjectStore((s) => s.projects)
  const [districtId, setDistrictId] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  const district = master.districts.find((d) => d.id === districtId)
  const department = master.departments.find((d) => d.id === departmentId)

  const scopedAssets = useMemo(() => {
    let rows = gis.assets
    if (mode === 'district-assets') rows = rows.filter((a) => a.districtId === districtId)
    if (mode === 'department-assets') rows = rows.filter((a) => a.departmentId === departmentId)
    return rows
  }, [gis.assets, mode, districtId, departmentId])

  const center = mode === 'district-assets' && district ? district.center : STATE_CENTER
  const zoom = mode === 'district-assets' && district ? 10 : 7.4

  const focus = { assets: scopedAssets, center, zoom }

  if (mode === 'layers') return <LayersView gis={gis} center={STATE_CENTER} zoom={7.4} />
  if (mode === 'assets') return <AssetsView gis={gis} master={master} {...focus} />
  if (mode === 'district-assets') return (
    <>
      <FilterStrip className="mb-4">
        <Select small value={districtId} onChange={setDistrictId} options={[{ value: '', label: 'All Districts' }, ...master.districts.map((d) => ({ value: d.id, label: d.name }))]} />
        <Badge tone="info" dot>{district ? `Map centred on ${district.name}` : 'Choose a district to scope the map'}</Badge>
      </FilterStrip>
      <AssetsView gis={gis} master={master} {...focus} />
    </>
  )
  return (
    <>
      <FilterStrip className="mb-4">
        <Select small value={departmentId} onChange={setDepartmentId} options={[{ value: '', label: 'All Departments' }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
        <Badge tone="info" dot>{department ? `Assets of ${department.name}` : 'Choose a department to roll up assets'}</Badge>
      </FilterStrip>
      <AssetsView gis={gis} master={master} {...focus} />
    </>
  )
}

// Helper: assets → MapView facility rows [lng, lat]
function assetFacilities(assets, master) {
  const catLabel = (c) => ASSET_CATEGORIES.find((x) => x.value === c)?.label || c
  return assets.map((a) => ({
    id: a.id,
    position: [a.lng, a.lat],
    name: a.name,
    departmentId: a.departmentId || 'general',
    departmentName: master.departments.find((d) => d.id === a.departmentId)?.name || a.owner || 'State',
    categoryLabel: catLabel(a.category),
    status: a.status,
    condition: a.condition,
    valueCr: a.valueCr,
    lastInspection: a.lastInspection,
    districtId: a.districtId,
  }))
}

function projectFacilities(projects, master) {
  return projects
    .filter((p) => p.gisLocation && p.gisLocation.lat != null)
    .map((p) => ({
      id: p.id,
      position: [p.gisLocation.lng, p.gisLocation.lat],
      name: p.name,
      departmentId: p.departmentId,
      departmentName: master.departments.find((d) => d.id === p.departmentId)?.name || p.departmentId,
      categoryLabel: p.category || 'Project',
      status: p.status,
      completionPct: p.completionPct,
    }))
}

// Approximate district boundary polygons (±0.3° around district centre) —
// illustrative spatial layer, NOT the official GADM/BDMS boundary.
function boundaryLayer(master) {
  return {
    layerName: 'District Boundaries',
    category: 'Administrative & Boundaries',
    features: master.districts.map((d) => ({
      type: 'Feature',
      properties: { feature_name: d.name, layer_name: 'District Boundaries', division: d.division || '—', dm: d.dm || '—' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [d.center[0] - 0.3, d.center[1] - 0.3],
          [d.center[0] + 0.3, d.center[1] - 0.3],
          [d.center[0] + 0.3, d.center[1] + 0.3],
          [d.center[0] - 0.3, d.center[1] + 0.3],
          [d.center[0] - 0.3, d.center[1] - 0.3],
        ]],
      },
    })),
  }
}

function roadLayer(master) {
  const corridors = [
    { name: 'NH-31 (Patna–Begusarai corridor)', points: [[25.6, 85.2], [25.45, 86.0]] },
    { name: 'NH-33 connector (Nalanda spur)', points: [[25.14, 85.44], [25.04, 85.42]] },
    { name: 'Gaya–Bodh Gaya link', points: [[24.795, 84.998], [24.696, 84.991]] },
    { name: 'Darbhanga–Muzaffarpur corridor', points: [[26.15, 85.89], [26.13, 85.41]] },
  ]
  return {
    layerName: 'Major Roads',
    category: 'Transportation',
    features: corridors.map((c, i) => ({
      type: 'Feature',
      properties: { feature_name: c.name, layer_name: 'Major Roads', corridor: c.name },
      geometry: { type: 'LineString', coordinates: c.points.map(([lat, lng]) => [lng, lat]) },
    })),
  }
}

const visibleLayer = (gis, id) => gis.layers.find((l) => l.id === id)?.visible

function LayersView({ gis, center, zoom }) {
  const master = useStateMasterStore()
  const projects = useStateProjectStore((s) => s.projects)
  const [selected, setSelected] = useState(null)

  const vectorLayers = useMemo(() => {
    const list = []
    if (visibleLayer(gis, 'boundaries')) list.push(boundaryLayer(master))
    if (visibleLayer(gis, 'roads')) list.push(roadLayer(master))
    return list
  }, [gis.layers, master])

  const facilities = useMemo(() => {
    const list = []
    if (visibleLayer(gis, 'assets')) list.push(...assetFacilities(gis.assets, master))
    if (visibleLayer(gis, 'projects')) list.push(...projectFacilities(projects, master))
    return list
  }, [gis.layers, gis.assets, projects, master])

  const heatPoints = visibleLayer(gis, 'heat')
    ? gis.assets.map((a) => ({ position: [a.lng, a.lat], intensity: a.valueCr ? Math.min(1, a.valueCr / 300) : 0.4 }))
    : []

  return (
    <div className="mt-5 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
      {/* Mobile: collapsible <details> toggle so the map stays above the fold */}
      <details className="card lg:hidden group">
        <summary className="cursor-pointer list-none flex items-center justify-between gap-2 px-5 py-3.5">
          <span className="flex items-center gap-2 text-[14px] font-semibold text-ink-950"><Layers size={15} className="text-ink-500" />Layer Controls</span>
          <ChevronDown size={14} className="shrink-0 text-ink-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-5 pb-4">
          <LayerControlList gis={gis} />
        </div>
      </details>
      <div className="hidden lg:block">
        <Card>
          <CardHeader title="Layer Controls" subtitle="Toggle state spatial layers" icon={Layers} />
          <CardBody className="space-y-1.5">
            <LayerControlList gis={gis} />
          </CardBody>
        </Card>
        <BulkSyncCard gis={gis} />
      </div>
      <div className="space-y-4">
        <div className="relative h-[clamp(320px,45vh,520px)] overflow-hidden rounded-xl border border-ink-100">
          <MapView
            className="h-full"
            center={center}
            zoom={zoom}
            facilities={facilities}
            vectorLayers={vectorLayers}
            showHeat={visibleLayer(gis, 'heat')}
            heatPoints={heatPoints}
            onFacilityClick={(f) => setSelected(f)}
            clusterEnabled={facilities.length > 12}
          />
        </div>
        {selected && (
          <Card>
            <CardHeader title={selected.name} icon={MapPin} subtitle={`${selected.departmentName} · ${selected.categoryLabel}`} />
            <CardBody className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
              <p className="text-ink-700"><span className="block text-[10.5px] uppercase tracking-wide text-ink-400">Status</span><Badge tone={selected.status === 'active' ? 'positive' : selected.status === 'in_progress' || selected.status === 'released' ? 'saffron' : 'neutral'}>{selected.status}</Badge></p>
              {selected.condition && <p className="text-ink-700"><span className="block text-[10.5px] uppercase tracking-wide text-ink-400">Condition</span>{selected.condition}</p>}
              {selected.valueCr && <p className="text-ink-700"><span className="block text-[10.5px] uppercase tracking-wide text-ink-400">Asset Value</span>₹{selected.valueCr} Cr</p>}
              {selected.completionPct != null && <p className="text-ink-700"><span className="block text-[10.5px] uppercase tracking-wide text-ink-400">Completion</span>{selected.completionPct}%</p>}
              {selected.lastInspection && <p className="text-ink-700"><span className="block text-[10.5px] uppercase tracking-wide text-ink-400">Last Inspection</span>{selected.lastInspection}</p>}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

function AssetsView({ gis, master, assets, center, zoom }) {
  const canManage = useStatePermission('gis.manage')
  const actor = useStateActor()
  const pushToast = useUiStore((s) => s.pushToast)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewFor, setViewFor] = useState(null)
  const [form, setForm] = useState({})

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return assets.filter((a) => {
      if (category !== 'all' && a.category !== category) return false
      if (q && !`${a.id} ${a.name}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [assets, category, query])

  const catLabel = (c) => ASSET_CATEGORIES.find((x) => x.value === c)?.label || c
  const districtName = (id) => master.districts.find((d) => d.id === id)?.name || id || '—'

  const save = async () => {
    if (!form.name) throw new Error('Asset name is required.')
    await gis.addAsset({
      actor,
      name: form.name.trim(),
      category: form.category || ASSET_CATEGORIES[0].value,
      departmentId: form.departmentId || null,
      districtId: form.districtId || null,
      lat: Number(form.lat), lng: Number(form.lng),
      valueCr: Number(form.valueCr || 0),
      installedYear: Number(form.installedYear) || null,
      condition: form.condition || 'fair',
      owner: form.owner || 'State Government',
      lastInspection: form.lastInspection || new Date().toISOString().slice(0, 10),
    })
    pushToast(`Asset ${form.name} registered.`, 'success')
    setCreateOpen(false)
    setForm({})
  }

  const toggleStatus = async (r) => {
    await gis.toggleAssetStatus(r.id)
    pushToast(`${r.id} ${r.status === 'active' ? 'deactivated' : 'reactivated'}.`, 'success')
  }

  return (
    <>
      <FilterStrip className="mb-4">
        <Select small value={category} onChange={setCategory} options={[{ value: 'all', label: 'All Categories' }, ...ASSET_CATEGORIES]} />
        <div className="relative">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search asset" className="input-field px-3 py-2 text-[13px]" />
        </div>
        {canManage && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Register Asset</Button>}
      </FilterStrip>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardBody><SummaryPill label="Assets (scope)" value={rows.length} /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Book Value (₹ Cr)" value={assets.reduce((s, a) => s + (a.valueCr || 0), 0)} tone="leaf" /></CardBody></Card>
        <Card><CardBody><SummaryPill label="Needs Inspection / Fair+Poor" value={assets.filter((a) => ['fair', 'poor'].includes(a.condition)).length} tone="saffron" /></CardBody></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr] gap-4 items-start">
        <Card className="lg:sticky lg:top-20">
          <CardHeader title="Asset Map" subtitle={`${assets.length} assets in scope`} icon={MapPin} />
          <CardBody>
            <div className="relative h-[clamp(360px,48vh,560px)] overflow-hidden rounded-lg border border-ink-100">
              <MapView
                className="h-full"
                center={center}
                zoom={zoom}
                facilities={assetFacilities(assets, master)}
                onFacilityClick={(f) => setViewFor(gis.assets.find((a) => a.id === f.id) || f)}
                clusterEnabled={assets.length > 12}
              />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Asset Register" subtitle={`${rows.length} records`} icon={Boxes} />
          <CardBody className="p-0">
            {rows.length === 0 ? (
              <EmptyState icon={Boxes} title="No assets in scope" />
            ) : (
              <DataTable
                columns={[
                  { key: 'id', label: 'Asset ID', render: (r) => <span className="font-mono text-[11px]">{r.id}</span>, hideOn: 'sm' },
                  { key: 'name', label: 'Name', render: (r) => <span className="text-[12.5px] font-medium">{r.name}</span> },
                  { key: 'category', label: 'Category', render: (r) => <Badge tone="neutral">{catLabel(r.category)}</Badge> },
                  { key: 'districtId', label: 'District', render: (r) => <span className="text-[12px]">{districtName(r.districtId)}</span>, hideOn: 'md' },
                  { key: 'valueCr', label: 'Value', render: (r) => `₹${r.valueCr || 0} Cr` },
                  { key: 'condition', label: 'Condition', render: (r) => <Badge tone={CONDITION_TONE[r.condition] || 'neutral'}>{r.condition}</Badge> },
                  { key: 'status', label: 'Status', render: (r) => <Badge tone={ASSET_TONE[r.status] || 'neutral'}>{r.status}</Badge> },
                  { key: '_', label: '', render: (r) => (
                    <span className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" icon={Eye} onClick={() => setViewFor(r)}>View</Button>
                      {canManage && <Button variant="ghost" size="sm" icon={Edit3} onClick={() => toggleStatus(r).catch((e) => pushToast(e.message, 'error'))}>Toggle</Button>}
                    </span>
                  ) },
                ]}
                rows={rows}
                keyField="id"
              />
            )}
          </CardBody>
        </Card>
      </div>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} width="max-w-2xl" title="Register Asset" footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => { save().catch((e) => pushToast(e.message, 'error')) }}>Register Asset</Button>
          </div>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Asset Name" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Begusarai Grid Substation" />
            <SelectFieldLite label="Category" value={form.category || ''} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={ASSET_CATEGORIES} />
            <SelectFieldLite label="Owner Department" value={form.departmentId || ''} onChange={(v) => setForm((f) => ({ ...f, departmentId: v }))} options={[{ value: '', label: 'General / State', }, ...master.departments.map((d) => ({ value: d.id, label: d.name }))]} />
            <SelectFieldLite label="District" value={form.districtId || ''} onChange={(v) => setForm((f) => ({ ...f, districtId: v }))} options={master.districts.map((d) => ({ value: d.id, label: d.name }))} />
            <Field label="Latitude" type="number" step="0.0001" value={form.lat || ''} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} placeholder="25.5" />
            <Field label="Longitude" type="number" step="0.0001" value={form.lng || ''} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} placeholder="85.1" />
            <Field label="Book Value (₹ Cr)" type="number" step="0.01" min="0" value={form.valueCr || ''} onChange={(e) => setForm((f) => ({ ...f, valueCr: e.target.value }))} />
            <Field label="Installed Year" type="number" value={form.installedYear || ''} onChange={(e) => setForm((f) => ({ ...f, installedYear: e.target.value }))} placeholder="2010" />
            <SelectFieldLite label="Condition" value={form.condition || ''} onChange={(v) => setForm((f) => ({ ...f, condition: v }))} options={[{ value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }]} />
            <Field label="Owner / Holding Body" value={form.owner || ''} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} placeholder="State Government" />
          </div>
        </Modal>
      )}

      {viewFor && (
        <Modal open onClose={() => setViewFor(null)} width="max-w-md" title={viewFor.name} footer={<Button size="sm" onClick={() => setViewFor(null)}>Close</Button>}>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Asset ID</span><span className="font-mono text-[12px]">{viewFor.id}</span></p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Category</span>{catLabel(viewFor.category)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">District</span>{districtName(viewFor.districtId)}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Owner</span>{viewFor.owner || '—'}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Value</span>₹{viewFor.valueCr || 0} Cr</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Installed</span>{viewFor.installedYear || '—'}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Condition</span>{viewFor.condition}</p>
            <p className="text-ink-700"><span className="block text-[11px] uppercase tracking-wide text-ink-400">Last Inspection</span>{viewFor.lastInspection || '—'}</p>
          </div>
          <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-[11.5px] text-ink-600">Location: {viewFor.lat}, {viewFor.lng}</div>
        </Modal>
      )}
    </>
  )
}

// Lite select for modal use
function SelectFieldLite({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field w-full px-3 py-2 text-[13px]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function LayerControlList({ gis }) {
  return (
    <div className="space-y-1.5">
      {gis.layers.map((l) => (
        <label key={l.id} className="flex cursor-pointer items-center justify-between rounded-lg border border-ink-100 px-3 py-2 hover:bg-ink-50">
          <span className="text-[12.5px] font-medium text-ink-800">{l.label}</span>
          <input type="checkbox" className="accent-ink-900" checked={l.visible} onChange={(e) => gis.setLayerVisible(l.id, e.target.checked)} />
        </label>
      ))}
      <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">Boundary polygons are illustrative approximations for the layer explorer; authoritative BDMS boundaries load from the GIS server in production.</div>
    </div>
  )
}

// Bulk facility ↔ GIS coordinate sync (POST /api/facilities/bulk-sync-gis/).
function BulkSyncCard() {
  const pushToast = useUiStore((s) => s.pushToast)
  const [file, setFile] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)

  const runSync = async () => {
    if (!file) { pushToast('Choose a CSV/XLSX file with the facility GIS coordinates first.', 'error'); return }
    setSyncing(true)
    setResult(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await backendFacilityApi.bulkSyncGis(body)
      setResult(response)
      pushToast('Bulk GIS sync completed on the backend.', 'success')
    } catch (e) {
      pushToast(`Bulk GIS sync failed: ${e.message}`, 'error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader title="Bulk GIS Sync" subtitle="Upload facility coordinate sheet (CSV/XLSX)" icon={MapPin} />
      <CardBody className="space-y-2 text-[12px]">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-[11.5px] file:mr-2 file:rounded-lg file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-[11.5px] file:font-semibold file:text-white"
        />
        <Button size="sm" icon={MapPin} loading={syncing} disabled={!file} onClick={runSync}>
          Run Bulk Sync
        </Button>
        {result && (
          <div className="rounded-lg bg-leaf-50 border border-leaf-200 px-3 py-2 text-[11.5px] text-leaf-900">
            Backend accepted the sync.{result.updated != null && ` Updated: ${result.updated}.`}{result.created != null && ` Created: ${result.created}.`}{result.failed != null && ` Failed: ${result.failed}.`}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export { assetFacilities, projectFacilities }