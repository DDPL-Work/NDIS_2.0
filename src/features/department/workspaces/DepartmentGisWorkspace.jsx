import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MapView from '../../../components/map/MapView'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { useDepartment } from '../framework/DepartmentContext'

export default function DepartmentGisWorkspace() {
  const { dept, assets, complaints, projects, workOrders, inspections, maintenanceTasks } = useDepartment()

  const [layerMode, setLayerMode] = useState('all') // 'all' | 'assets' | 'complaints'
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [activeTool] = useState('radius')
  const [selectedItem, setSelectedItem] = useState(null)

  const mapPoints = useMemo(() => {
    const assetPoints = assets.map((a) => ({
      id: a.id,
      name: a.name,
      departmentId: dept.id,
      categoryLabel: a.typeLabel,
      status: a.status,
      gapScore: 0.15,
      position: a.position,
      type: 'asset',
    }))

    const complaintPoints = complaints.map((c) => ({
      id: c.id,
      name: c.title,
      departmentId: c.departmentId,
      categoryLabel: c.categoryName,
      status: c.state === 'resolved' || c.state === 'closed' ? 'active' : 'inactive',
      gapScore: c.priority === 'urgent' ? 0.9 : 0.5,
      position: c.location.position,
      type: 'complaint',
    }))

    const projectPoints = projects.map((p) => ({ id: p.id, name: p.title, departmentId: dept.id, categoryLabel: `Project · ${p.currentStage || p.status}`, status: p.status === 'completed' ? 'active' : 'inactive', gapScore: 1 - ((p.progress || 0) / 100), position: p.gps || [85.4211, 25.0294], type: 'project' }))
    const workOrderPoints = workOrders.map((w) => ({ id: w.id, name: w.title, departmentId: dept.id, categoryLabel: `Work order · ${w.type || 'construction'}`, status: w.state === 'completed' ? 'active' : 'inactive', gapScore: w.priority === 'urgent' ? 0.9 : 0.45, position: w.gisLocation?.position || [85.4211, 25.0294], type: 'work_order' }))
    const inspectionPoints = inspections.map((i) => ({ id: i.id, name: i.title, departmentId: dept.id, categoryLabel: `Inspection · ${i.status}`, status: i.status === 'completed' ? 'active' : 'inactive', gapScore: i.status === 'completed' ? 0.2 : 0.75, position: workOrders.find((w) => w.id === i.workOrderId)?.gisLocation?.position || [85.4211, 25.0294], type: 'inspection' }))
    const maintenancePoints = maintenanceTasks.map((m) => ({ id: m.id, name: m.title, departmentId: dept.id, categoryLabel: `Maintenance · ${m.type}`, status: m.status === 'completed' ? 'active' : 'inactive', gapScore: m.status === 'missed' ? 0.9 : 0.35, position: assets.find((a) => a.id === m.assetId)?.position || [85.4211, 25.0294], type: 'maintenance' }))

    if (layerMode === 'assets') return assetPoints
    if (layerMode === 'complaints') return complaintPoints
    return [...assetPoints, ...complaintPoints, ...projectPoints, ...workOrderPoints, ...inspectionPoints, ...maintenancePoints]
  }, [assets, complaints, dept.id, layerMode, projects, workOrders, inspections, maintenanceTasks])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Department GIS Workspace · ${dept.code}`}
        title={`${dept.label} Spatial GIS Engine`}
        description="Interactive GIS layer mapping department assets, defect hotspots, service radius coverage, and field telemetry."
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={layerMode === 'all' ? 'saffron' : 'outline'}
              onClick={() => setLayerMode('all')}
            >
              All Layers ({mapPoints.length})
            </Button>
            <Button
              size="sm"
              variant={layerMode === 'assets' ? 'saffron' : 'outline'}
              onClick={() => setLayerMode('assets')}
            >
              Assets Only ({assets.length})
            </Button>
            <Button
              size="sm"
              variant={layerMode === 'complaints' ? 'saffron' : 'outline'}
              onClick={() => setLayerMode('complaints')}
            >
              Complaints Only ({complaints.length})
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-4">
        {/* Layer Controls Bar */}
        <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-ink-900 flex items-center gap-1.5">
              <Layers size={16} className="text-saffron-600" /> Active Spatial Controls:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="accent-saffron-500 rounded"
              />
              <span>Hotspot Density Heatmap</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Badge tone="info">Service Radius: 3km Buffer Active</Badge>
          </div>
        </div>

        {/* GIS Map View Container */}
        <div className="h-[520px] rounded-2xl overflow-hidden card relative">
          <MapView
            center={[85.4211, 25.0294]}
            zoom={11.5}
            facilities={mapPoints}
            colorBy="gap"
            showHeat={showHeatmap}
            activeTool={activeTool}
            radiusCenter={[85.4211, 25.0294]}
            radiusKm={3}
            onFacilityClick={(id) => {
              const item = mapPoints.find((p) => p.id === id)
              setSelectedItem(item)
            }}
            className="h-full"
          />
        </div>
      </div>

      {/* Selected Item Modal */}
      <Modal open={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem?.name || 'Spatial Node Details'}>
        {selectedItem && (
          <div className="space-y-3 text-[12.5px]">
            <div className="flex items-center justify-between">
              <Badge tone="saffron">{selectedItem.categoryLabel}</Badge>
              <span className="kbd-mono text-ink-500">{selectedItem.id}</span>
            </div>
            <p className="text-ink-700">Coordinates: {selectedItem.position?.[1]?.toFixed(4)}°N, {selectedItem.position?.[0]?.toFixed(4)}°E</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
