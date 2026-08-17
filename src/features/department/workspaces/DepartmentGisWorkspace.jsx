import { useMemo, useState } from 'react'
import Badge from '../../../components/ui/Badge'
import Modal from '../../../components/ui/Modal'
import { useDepartment } from '../framework/DepartmentContext'
import { useAuthStore } from '../../../app/store/authStore'
import { DISTRICTS } from '../../../config/constants'
import GISCommandCenter from '../../../gis/components/GISCommandCenter'

export default function DepartmentGisWorkspace() {
  const { dept, deptName, can, assets, complaints, projects, workOrders, inspections, maintenanceTasks } = useDepartment()
  const user = useAuthStore((s) => s.user)
  // Fully dynamic map surface: view is anchored to the authenticated user's
  // district, never a hardcoded coordinate set.
  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]
  const districtCenter = district?.center || [85.4434, 25.1372]

  const [selectedItem, setSelectedItem] = useState(null)

  const mapPoints = useMemo(() => {
    const point = (source, fields) => ({
      id: fields.id,
      name: fields.name,
      departmentId: dept.id,
      departmentName: deptName || dept.label,
      categoryLabel: fields.categoryLabel,
      status: fields.status,
      gapScore: fields.gapScore ?? 0.5,
      position: fields.position,
      type: fields.type,
    })
    const assetPoints = assets.map((a) => point(a, { id: a.id, name: a.name, categoryLabel: a.typeLabel, status: a.status, gapScore: 0.15, position: a.position, type: 'asset' }))
    const complaintPoints = complaints.map((c) => point(c, {
      id: c.id, name: c.title, categoryLabel: c.categoryName,
      status: c.state === 'resolved' || c.state === 'closed' ? 'active' : 'inactive',
      gapScore: c.priority === 'urgent' ? 0.9 : 0.5,
      position: c.location?.position || districtCenter, type: 'complaint',
    }))
    const projectPoints = projects.map((p) => point(p, { id: p.id, name: p.title, categoryLabel: `Project · ${p.currentStage || p.status}`, status: p.status === 'completed' ? 'active' : 'inactive', gapScore: 1 - ((p.progress || 0) / 100), position: p.gps || districtCenter, type: 'project' }))
    const workOrderPoints = workOrders.map((w) => point(w, { id: w.id, name: w.title, categoryLabel: `Work order · ${w.type || 'construction'}`, status: w.state === 'completed' ? 'active' : 'inactive', gapScore: w.priority === 'urgent' ? 0.9 : 0.45, position: w.gisLocation?.position || districtCenter, type: 'work_order' }))
    const inspectionPoints = inspections.map((i) => point(i, { id: i.id, name: i.title, categoryLabel: `Inspection · ${i.status}`, status: i.status === 'completed' ? 'active' : 'inactive', gapScore: i.status === 'completed' ? 0.2 : 0.75, position: workOrders.find((w) => w.id === i.workOrderId)?.gisLocation?.position || districtCenter, type: 'inspection' }))
    const maintenancePoints = maintenanceTasks.map((m) => point(m, { id: m.id, name: m.title, categoryLabel: `Maintenance · ${m.type}`, status: m.status === 'completed' ? 'active' : 'inactive', gapScore: m.status === 'missed' ? 0.9 : 0.35, position: assets.find((a) => a.id === m.assetId)?.position || districtCenter, type: 'maintenance' }))
    return [...assetPoints, ...complaintPoints, ...projectPoints, ...workOrderPoints, ...inspectionPoints, ...maintenancePoints]
  }, [assets, complaints, dept.id, deptName, dept.label, districtCenter, projects, workOrders, inspections, maintenanceTasks])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 px-6 py-2">
      {/* Compact header — minimal whitespace so the map begins immediately
          below the command-center toolbar. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow mb-0.5">{`Department GIS Workspace · ${dept.code}`}</p>
          <h2 className="truncate text-lg font-display font-semibold text-ink-950">{`${deptName || dept.label} Spatial GIS Engine (${district?.label || 'District'})`}</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <Badge tone="info">{mapPoints.length} mapped nodes</Badge>
          <Badge tone="saffron">{complaints.length} complaints</Badge>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <GISCommandCenter facilities={mapPoints} complaints={complaints} projects={projects} center={districtCenter} zoom={district?.zoom || 11} user={user} allowedDepartments={[dept.id]} onOpen={setSelectedItem} deptId={dept.id} deptLabel={deptName || dept.label} can={can} />
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