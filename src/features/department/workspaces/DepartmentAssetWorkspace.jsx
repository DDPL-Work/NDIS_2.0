import { useEffect, useMemo, useState } from 'react'
import { History, PlusCircle, Search, ShieldCheck } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import { useDepartment } from '../framework/DepartmentContext'
import { useCurrentUser, useCan } from '../identity/hooks/useAuthorization'
import { useAuthStore } from '../../../app/store/authStore'
import { useUiStore } from '../../../app/store/uiStore'
import { useAsync } from '../../../hooks/useAsync'
import { backendFacilityApi } from '../../../api/facilityApi'
import { backendMasterApi } from '../../../api/masterApi'
import { formatDate } from '../../../utils/format'

// The authenticated profile is the only department source for the backend
// facility registry (GET /api/facilities/?department=<pk>).
const departmentPk = (user) => {
  const raw = (user && typeof user.department === 'object' && user.department) ? (user.department.id ?? user.department.departmentId) : (user?.department ?? user?.departmentId)
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const LIFECYCLE_STATES = ['planned', 'constructed', 'operational', 'inspection_due', 'maintenance', 'complaint_raised', 'repair', 'retired']
const STATE_TONE = { planned: 'neutral', constructed: 'info', operational: 'positive', inspection_due: 'warning', maintenance: 'warning', complaint_raised: 'negative', repair: 'warning', retired: 'neutral' }

const emptyAssetForm = () => ({ name: '', category: '', district: '', village: '', block: '', latitude: '', longitude: '', hazardSafe: true })

export default function DepartmentAssetWorkspace() {
  const { dept } = useDepartment()
  const user = useCurrentUser()
  const canWrite = useCan('assets.maintenance') || useCan('assets.inspection')
  const pushToast = useUiStore((s) => s.pushToast)
  const authStatus = useAuthStore((s) => s.status)
  // While /api/auth/me/ is still being restored/loaded the profile has not
  // yet resolved — that is not the same as "profile has no department".
  const profileLoading = authStatus === 'restoring' || authStatus === 'loading'
  const deptPk = useMemo(() => departmentPk(user), [user])

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [assetForm, setAssetForm] = useState(emptyAssetForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [rows, setRows] = useState(null)

  const fetcher = useMemo(() => () => backendFacilityApi.list(deptPk ? { departmentId: deptPk } : {}), [deptPk])
  const { data, loading, error, refetch } = useAsync(fetcher, [deptPk])
  useEffect(() => { if (data) setRows(data) }, [data])

  const categoriesFetcher = useMemo(() => () => backendFacilityApi.categories(deptPk), [deptPk])
  const { data: rawCategories } = useAsync(categoriesFetcher, [deptPk])
  const categories = useMemo(() => (rawCategories || []).filter((c) => !deptPk || !c.departmentId || c.departmentId === String(deptPk)), [rawCategories, deptPk])

  const { data: districts } = useAsync(() => backendMasterApi.districts(), [])

  const lifecycleState = (asset) => asset.attributes?.lifecycle_state || 'operational'

  const filteredAssets = useMemo(() => {
    const base = rows || []
    const scoped = deptPk ? base : base.filter((a) => a.departmentName.toLowerCase().includes(dept.label.toLowerCase()))
    return scoped.filter((a) => {
      if (typeFilter !== 'all' && a.categoryId !== typeFilter && a.categoryLabel !== typeFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.village.toLowerCase().includes(q)
      }
      return true
    })
  }, [rows, deptPk, dept.label, typeFilter, query])

  const historyFetcher = useMemo(() => (selectedAsset ? () => backendFacilityApi.history(selectedAsset.id) : async () => []), [selectedAsset])
  const { data: historyRows } = useAsync(historyFetcher, [selectedAsset?.id])

  async function submitAsset(e) {
    e.preventDefault()
    if (profileLoading) { pushToast('Loading department profile…', 'info'); return }
    if (!deptPk) { pushToast('Your profile has no department assigned — asset registration is unavailable.', 'error'); return }
    const category = categories.find((c) => c.id === assetForm.category)
    if (!category) { pushToast('Select an asset category published on the backend.', 'error'); return }
    if (!assetForm.district) { pushToast('Select the district for this asset.', 'error'); return }
    const lng = Number(assetForm.longitude); const lat = Number(assetForm.latitude)
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) { pushToast('Latitude and longitude are required.', 'error'); return }
    setSaving(true); setActionError(null)
    try {
      const created = await backendFacilityApi.create({
        name: assetForm.name,
        department: deptPk,
        district: Number(assetForm.district),
        category: Number(assetForm.category),
        attributes: { village: assetForm.village, block: assetForm.block, lifecycle_state: 'planned' },
        geom: { type: 'Point', coordinates: [lng, lat] },
        hazard_safe: assetForm.hazardSafe,
      })
      setRows((current) => [created, ...(current || [])])
      pushToast(`Asset ${created.name} registered on the backend facility registry.`, 'success')
      setRegistering(false); setAssetForm(emptyAssetForm())
    } catch (err) { setActionError(err) } finally { setSaving(false) }
  }

  async function updateLifecycle(asset, nextState) {
    setSaving(true); setActionError(null)
    try {
      const updated = await backendFacilityApi.update(asset.id, { attributes: { ...asset.attributes, lifecycle_state: nextState } })
      setRows((current) => (current || []).map((row) => (row.id === asset.id ? updated : row)))
      setSelectedAsset(updated)
      pushToast(`Asset lifecycle set to ${nextState.replace(/_/g, ' ')} — the backend snapshots the change.`, 'success')
    } catch (err) { setActionError(err) } finally { setSaving(false) }
  }

  const columns = [
    { key: 'id', label: 'Asset Code', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span> },
    { key: 'name', label: 'Asset Name', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'categoryLabel', label: 'Category', render: (r) => <Badge tone="info">{r.categoryLabel}</Badge> },
    { key: 'village', label: 'Village / Ward', render: (r) => [r.village, r.districtName].filter(Boolean).join(', ') },
    { key: 'lifecycle', label: 'Lifecycle', render: (r) => <Badge tone={STATE_TONE[lifecycleState(r)] || 'neutral'}>{lifecycleState(r).replace(/_/g, ' ')}</Badge> },
    { key: 'hazard', label: 'Hazard Safe', render: (r) => (r.hazardSafe === null ? '—' : r.hazardSafe ? <Badge tone="positive">Safe</Badge> : <Badge tone="negative">At risk</Badge>) },
    { key: 'lastUpdated', label: 'Last Updated', render: (r) => <span className="font-mono text-[11.5px]">{formatDate(r.lastUpdated)}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Department Asset Framework · ${dept.code}`}
        title={`${dept.label} Asset Directory & Telemetry`}
        description="Backend facility registry scoped to this department — lifecycle state, dynamic attributes, hazard compliance and SCD Type 2 audit trail."
        action={canWrite && (
          <Button size="sm" icon={PlusCircle} onClick={() => { setActionError(null); setRegistering(true) }}>
            Register New Asset
          </Button>
        )}
      />

      <div className="px-6 space-y-4">
        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error.status === 404 ? 'The backend facility registry is unavailable for this department.' : `Unable to load the asset registry: ${error.message}`}</p>
            <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by asset code, facility name, or village…"
                  className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 py-1.5 text-[12.5px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Select
                  small
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
            </div>

            <div className="card">
              {loading && !rows ? (
                <p className="px-4 py-4 text-sm text-ink-500">Loading the asset registry…</p>
              ) : (
                <DataTable columns={columns} rows={filteredAssets} onRowClick={setSelectedAsset} emptyLabel="No assets in this scope on the backend registry" />
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={!!selectedAsset} onClose={() => setSelectedAsset(null)} title={selectedAsset?.name || 'Asset Specifications'}>
        {selectedAsset && (
          <div className="space-y-4 text-[12.5px]">
            {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>}
            <div className="p-3 bg-ink-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="kbd-mono text-ink-500 font-bold">{selectedAsset.id}</span>
                <p className="font-semibold text-ink-900 text-[13px]">{selectedAsset.name}</p>
              </div>
              <Badge tone={STATE_TONE[lifecycleState(selectedAsset)] || 'neutral'}>{lifecycleState(selectedAsset).replace(/_/g, ' ')}</Badge>
            </div>

            <div className="flex items-center justify-between border border-ink-100 rounded-xl p-3">
              <div><span className="text-[11px] text-ink-400 uppercase block">Lifecycle state</span><span className="font-semibold capitalize">{lifecycleState(selectedAsset)}</span></div>
              {canWrite ? (
                <select className="input-field !w-40 !py-1" value={lifecycleState(selectedAsset)} disabled={saving} onChange={(e) => updateLifecycle(selectedAsset, e.target.value)}>
                  {LIFECYCLE_STATES.map((state) => <option key={state} value={state}>{state.replace(/_/g, ' ')}</option>)}
                </select>
              ) : <span className="text-[11px] text-ink-400">View only</span>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white border border-ink-100 rounded-xl"><span className="text-[11px] text-ink-400 uppercase block">District</span><span className="font-semibold">{selectedAsset.districtName || '—'}</span></div>
              <div className="p-3 bg-white border border-ink-100 rounded-xl"><span className="text-[11px] text-ink-400 uppercase block">Hazard Safe</span><span className="font-semibold">{selectedAsset.hazardSafe === null ? '—' : selectedAsset.hazardSafe ? 'Yes' : 'No'}</span></div>
            </div>

            <div>
              <h4 className="font-semibold text-ink-800 mb-2">Asset Attributes & Schema Telemetry</h4>
              <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-ink-200 rounded-xl font-mono text-[11.5px]">
                {Object.entries(selectedAsset.attributes || {}).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-ink-400 uppercase">{k.replace(/_/g, ' ')}:</span>
                    <span className="font-semibold text-ink-900 ml-1.5">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {historyRows && historyRows.length > 0 && (
              <div>
                <h4 className="font-semibold text-ink-800 mb-2 flex items-center gap-1.5"><History size={13} />SCD Type 2 Audit Trail</h4>
                <div className="space-y-1.5 p-3 bg-ink-50 border border-ink-100 rounded-xl font-mono text-[11.5px]">
                  {historyRows.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-2">
                      <span className="text-ink-500">{entry.snapshot?.updated_at ? `Snapshot ${formatDate(entry.snapshot.updated_at)}` : 'Prior state snapshot'}</span>
                      <span className="text-ink-300">{formatDate(entry.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-leaf-50 border border-leaf-200 rounded-xl text-[11.5px] text-leaf-900 flex items-center justify-between">
              <span>Custodian Provenance: {selectedAsset.custodian || dept.custodian}</span>
              <ShieldCheck size={16} className="text-leaf-600" />
            </div>
          </div>
        )}
      </Modal>

      <Modal open={registering} onClose={() => setRegistering(false)} width="max-w-lg">
        <form className="space-y-4" onSubmit={submitAsset}>
          <h3 className="text-base font-bold">Register Department Asset</h3>
          {profileLoading
            ? <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 text-[12.5px] text-ink-600">Loading department profile…</div>
            : !deptPk && <div className="rounded-lg border border-saffron-200 bg-saffron-50 px-3 py-2.5 text-[12.5px] text-saffron-800">Your profile has no department assigned — registration is unavailable.</div>}
          {actionError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-700">{actionError.message}</div>}
          <input className="input-field" required placeholder="Asset name" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
          {categories.length ? (
            <select className="input-field" required value={assetForm.category} onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}><option value="">Select asset category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          ) : (
            <p className="rounded-lg bg-ink-50 border border-ink-100 px-3 py-2 text-[12px] text-ink-500">No asset categories are published for this department on the backend yet.</p>
          )}
          <select className="input-field" required value={assetForm.district} onChange={(e) => setAssetForm({ ...assetForm, district: e.target.value })}><option value="">Select district</option>{(districts || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><input className="input-field" required placeholder="Village / ward" value={assetForm.village} onChange={(e) => setAssetForm({ ...assetForm, village: e.target.value })} /><input className="input-field" placeholder="Block" value={assetForm.block} onChange={(e) => setAssetForm({ ...assetForm, block: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><input className="input-field" required type="number" step="any" placeholder="Latitude" value={assetForm.latitude} onChange={(e) => setAssetForm({ ...assetForm, latitude: e.target.value })} /><input className="input-field" required type="number" step="any" placeholder="Longitude" value={assetForm.longitude} onChange={(e) => setAssetForm({ ...assetForm, longitude: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-[12.5px] text-ink-700"><input type="checkbox" checked={assetForm.hazardSafe} onChange={(e) => setAssetForm({ ...assetForm, hazardSafe: e.target.checked })} /> Hazard-safe (earthquake / flood compliant)</label>
          <p className="text-[11.5px] text-ink-400">Creates a facility record on the backend registry (POST /api/facilities/) with a planned lifecycle attribute.</p>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRegistering(false)}>Cancel</Button><Button type="submit" disabled={saving || profileLoading || !deptPk}>{saving ? 'Registering…' : 'Register Asset'}</Button></div>
        </form>
      </Modal>
    </div>
  )
}
