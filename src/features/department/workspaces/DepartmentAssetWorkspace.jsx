import { useState, useMemo } from 'react'
import { Search, ShieldCheck, PlusCircle } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Select from '../../../components/ui/Select'
import { useDepartment } from '../framework/DepartmentContext'
import { useProjectEngine } from '../../../app/store/projectEngine'
import { useUiStore } from '../../../app/store/uiStore'
import { formatDate } from '../../../utils/format'

export default function DepartmentAssetWorkspace() {
  const { dept, assets } = useDepartment()
  const registerAsset = useProjectEngine((s) => s.registerAsset)
  const updateAssetLifecycle = useProjectEngine((s) => s.updateAssetLifecycle)
  const pushToast = useUiStore((s) => s.pushToast)

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [assetForm, setAssetForm] = useState({ name: '', type: '', village: '', block: '', latitude: '', longitude: '' })

  function submitAsset(e) {
    e.preventDefault()
    const type = dept.assetTypes.find((item) => item.id === assetForm.type)
    registerAsset({ name: assetForm.name, type: assetForm.type, typeLabel: type?.label || 'Department Asset', departmentId: dept.id, village: assetForm.village, block: assetForm.block || 'Nalanda', position: [Number(assetForm.longitude || 85.4211), Number(assetForm.latitude || 25.0294)] })
    pushToast('Asset registered with lifecycle and preventive maintenance schedule.', 'success')
    setRegistering(false); setAssetForm({ name: '', type: '', village: '', block: '', latitude: '', longitude: '' })
  }

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.village.toLowerCase().includes(q)
      }
      return true
    })
  }, [assets, typeFilter, query])

  const columns = [
    { key: 'id', label: 'Asset Code', render: (r) => <span className="kbd-mono text-[12px] font-bold text-ink-900">{r.id}</span> },
    { key: 'name', label: 'Asset Name', render: (r) => <span className="font-semibold text-ink-900">{r.name}</span> },
    { key: 'typeLabel', label: 'Category', render: (r) => <Badge tone="info">{r.typeLabel}</Badge> },
    { key: 'village', label: 'Village / Ward', render: (r) => `${r.village}, ${r.block}` },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'positive' : 'warning'}>{r.status.toUpperCase()}</Badge> },
    { key: 'lastInspected', label: 'Last Audit', render: (r) => <span className="font-mono text-[11.5px]">{formatDate(r.lastInspected)}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Department Asset Framework · ${dept.code}`}
        title={`${dept.label} Asset Directory & Telemetry`}
        description="Comprehensive asset inventory, attribute telemetry, maintenance history, and inspection audit logs."
        action={
          <Button size="sm" icon={PlusCircle} onClick={() => setRegistering(true)}>
            Register New Asset
          </Button>
        }
      />

      <div className="px-6 space-y-4">
        {/* Filters Bar */}
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
                { value: 'all', label: 'All Asset Types' },
                ...dept.assetTypes.map((t) => ({ value: t.id, label: t.label })),
              ]}
            />
          </div>
        </div>

        {/* Assets Table */}
        <div className="card">
          <DataTable
            columns={columns}
            rows={filteredAssets}
            onRowClick={(row) => setSelectedAsset(row)}
          />
        </div>
      </div>

      {/* Asset Detail Drawer Modal */}
      <Modal open={!!selectedAsset} onClose={() => setSelectedAsset(null)} title={selectedAsset?.name || 'Asset Specifications'}>
        {selectedAsset && (
          <div className="space-y-4 text-[12.5px]">
            <div className="p-3 bg-ink-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="kbd-mono text-ink-500 font-bold">{selectedAsset.id}</span>
                <p className="font-semibold text-ink-900 text-[13px]">{selectedAsset.name}</p>
              </div>
              <Badge tone="positive">{selectedAsset.status.toUpperCase()}</Badge>
            </div>

            <div className="flex items-center justify-between border border-ink-100 rounded-xl p-3">
              <div><span className="text-[11px] text-ink-400 uppercase block">Lifecycle state</span><span className="font-semibold capitalize">{selectedAsset.lifecycleState || 'operational'}</span></div>
              <select className="input-field !w-40 !py-1" value={selectedAsset.lifecycleState || 'operational'} onChange={(e) => { updateAssetLifecycle(selectedAsset.id, e.target.value, 'Updated from asset workspace.'); setSelectedAsset({ ...selectedAsset, lifecycleState: e.target.value }) }}>
                {['planned', 'constructed', 'operational', 'inspection_due', 'maintenance', 'complaint_raised', 'repair', 'retired'].map((state) => <option key={state} value={state}>{state.replace(/_/g, ' ')}</option>)}
              </select>
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

            <div className="p-3 bg-leaf-50 border border-leaf-200 rounded-xl text-[11.5px] text-leaf-900 flex items-center justify-between">
              <span>Custodian Provenance: {dept.custodian}</span>
              <ShieldCheck size={16} className="text-leaf-600" />
            </div>
          </div>
        )}
      </Modal>

      <Modal open={registering} onClose={() => setRegistering(false)} width="max-w-lg">
        <form className="space-y-4" onSubmit={submitAsset}>
          <h3 className="text-base font-bold">Register Department Asset</h3>
          <input className="input-field" required placeholder="Asset name" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
          <select className="input-field" required value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}><option value="">Select asset category</option>{dept.assetTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select>
          <div className="grid grid-cols-2 gap-3"><input className="input-field" required placeholder="Village / ward" value={assetForm.village} onChange={(e) => setAssetForm({ ...assetForm, village: e.target.value })} /><input className="input-field" placeholder="Block" value={assetForm.block} onChange={(e) => setAssetForm({ ...assetForm, block: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><input className="input-field" type="number" step="any" placeholder="Latitude" value={assetForm.latitude} onChange={(e) => setAssetForm({ ...assetForm, latitude: e.target.value })} /><input className="input-field" type="number" step="any" placeholder="Longitude" value={assetForm.longitude} onChange={(e) => setAssetForm({ ...assetForm, longitude: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRegistering(false)}>Cancel</Button><Button type="submit">Register Asset</Button></div>
        </form>
      </Modal>
    </div>
  )
}
