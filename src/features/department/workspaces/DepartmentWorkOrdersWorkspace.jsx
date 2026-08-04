import { useState } from 'react'
import {
  FileCheck, CheckCircle, Plus, Eye, X, MapPin
} from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import DataTable from '../../../components/ui/DataTable'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { Card, CardHeader, CardBody } from '../../../components/ui/Card'
import { useDepartment } from '../framework/DepartmentContext'
import { useProjectEngine } from '../../../app/store/projectEngine'
import { useUiStore } from '../../../app/store/uiStore'

export default function DepartmentWorkOrdersWorkspace() {
  const { dept, workOrders, projects, officers } = useDepartment()
  const pushToast = useUiStore((s) => s.pushToast)

  const createWorkOrder = useProjectEngine((s) => s.createWorkOrder)
  const updateWorkOrder = useProjectEngine((s) => s.updateWorkOrder)

  const [selectedWO, setSelectedWO] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    assignedOfficerName: '',
    assignedEngineerName: '',
    priority: 'medium',
    scheduleWork: '',
    deadline: '',
    address: '',
    latitude: '',
    longitude: ''
  })

  // Filter officers for selector options
  const deptOfficers = officers.filter(o => o.role === 'dept_officer' || o.role === 'dept_head')
  const deptEngineers = officers.filter(o => o.role === 'engineer' || o.role === 'field_inspector')

  function handleCreate(e) {
    e.preventDefault()
    if (!formData.projectId || !formData.title || !formData.assignedEngineerName) {
      pushToast('Please select a project, title, and assign an engineer.', 'error')
      return
    }

    const payload = {
      projectId: formData.projectId,
      title: formData.title,
      departmentId: dept.id,
      assignedOfficer: { name: formData.assignedOfficerName || 'Officer ' + dept.code, role: 'dept_officer', dept: dept.id },
      assignedEngineer: { name: formData.assignedEngineerName, role: 'engineer', dept: dept.id },
      priority: formData.priority,
      scheduleWork: formData.scheduleWork || new Date().toISOString().split('T')[0],
      deadline: formData.deadline || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      remarks: 'Work order successfully generated in system.',
      gisLocation: {
        position: [Number(formData.longitude || 85.4211), Number(formData.latitude || 25.0294)],
        address: formData.address || 'District construction area'
      }
    }

    createWorkOrder(payload)
    pushToast('Work order generated successfully!', 'success')
    setIsCreateModalOpen(false)
    resetForm()
  }

  function handleComplete(woId) {
    updateWorkOrder(woId, {
      state: 'completed',
      completionDate: new Date().toISOString().split('T')[0],
      remarks: 'Work completed and marked as resolved by field engineer.'
    })
    pushToast('Work order marked as completed!', 'success')
    setSelectedWO(null)
  }

  function resetForm() {
    setFormData({
      projectId: '',
      title: '',
      assignedOfficerName: '',
      assignedEngineerName: '',
      priority: 'medium',
      scheduleWork: '',
      deadline: '',
      address: '',
      latitude: '',
      longitude: ''
    })
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Work Title', render: (r) => <span className="font-semibold text-ink-950 block truncate max-w-[200px]">{r.title}</span> },
    { key: 'engineer', label: 'Assignee', render: (r) => <span className="text-[12.5px]">{r.assignedEngineer?.name}</span> },
    { key: 'deadline', label: 'Deadline', render: (r) => <span className="font-mono text-[12px]">{r.deadline}</span> },
    { key: 'state', label: 'State', render: (r) => <Badge tone={r.state === 'completed' ? 'positive' : 'warning'}>{r.state.toUpperCase()}</Badge> },
    { key: 'action', label: 'View', render: (r) => (
      <Button size="xs" variant="outline" icon={Eye} onClick={(e) => { e.stopPropagation(); setSelectedWO(r) }}>
        Details
      </Button>
    )}
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`Operational Tasking · ${dept.code}`}
        title={`${dept.label} Work Orders`}
        description="Schedule site works, coordinate engineering assignments, monitor priority levels, and approve field completions."
        action={
          <Button size="sm" icon={Plus} onClick={() => { resetForm(); setIsCreateModalOpen(true) }}>
            Generate Work Order
          </Button>
        }
      />

      <div className="px-6">
        <Card>
          <CardHeader title="Work Orders Queue" subtitle="Track tasks distributed to field crews" icon={FileCheck} />
          <CardBody className="!p-0">
            <DataTable columns={columns} rows={workOrders} onRowClick={(row) => setSelectedWO(row)} />
          </CardBody>
        </Card>
      </div>

      {/* DETAIL MODAL */}
      <Modal open={!!selectedWO} onClose={() => setSelectedWO(null)} width="max-w-xl">
        {selectedWO && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="kbd-mono text-[11px] font-bold text-ink-400">{selectedWO.id}</span>
                <h3 className="text-base font-bold text-ink-950 mt-1">{selectedWO.title}</h3>
              </div>
              <Badge tone={selectedWO.state === 'completed' ? 'positive' : 'warning'}>{selectedWO.state.toUpperCase()}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px] bg-ink-50/50 p-3 rounded-xl">
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">PROJECT CODE</span>
                <span className="font-bold text-ink-900">{selectedWO.projectId}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">PRIORITY</span>
                <Badge tone={selectedWO.priority === 'urgent' ? 'negative' : selectedWO.priority === 'high' ? 'warning' : 'info'}>{selectedWO.priority.toUpperCase()}</Badge>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">ASSIGNED ENGINEER</span>
                <span className="font-semibold text-ink-900">{selectedWO.assignedEngineer?.name} ({selectedWO.assignedEngineer?.role})</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">DEADLINE TARGET</span>
                <span className="font-mono font-semibold text-ink-900">{selectedWO.deadline}</span>
              </div>
              <div><span className="text-ink-400 block text-[11px] uppercase">TYPE / DURATION</span><span className="font-semibold capitalize">{selectedWO.type || 'construction'} · {selectedWO.expectedDuration || 'Not set'}</span></div>
              <div><span className="text-ink-400 block text-[11px] uppercase">ESTIMATED COST</span><span className="font-mono">{selectedWO.estimatedCost ? `₹${selectedWO.estimatedCost.toLocaleString('en-IN')}` : 'Not set'}</span></div>
            </div>

            {selectedWO.gisLocation && (
              <div className="text-[12.5px] p-2 bg-white border border-ink-150 rounded-lg flex items-center gap-2">
                <MapPin size={16} className="text-sky-600 shrink-0" />
                <span className="text-ink-700 truncate">{selectedWO.gisLocation.address} ({selectedWO.gisLocation.position?.join(', ')})</span>
              </div>
            )}

            <div className="space-y-1 text-[12.5px]">
              <span className="font-semibold text-ink-700">Remarks log:</span>
              <p className="p-2.5 bg-ink-50/20 border border-ink-100 rounded-lg text-ink-600">{selectedWO.remarks || 'No remarks provided.'}</p>
            </div>

            {selectedWO.state !== 'completed' && (
              <div className="border-t border-ink-100 pt-3 flex justify-end">
                <Button size="sm" icon={CheckCircle} onClick={() => handleComplete(selectedWO.id)}>
                  Mark as Completed
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CREATE MODAL */}
      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} width="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-ink-950">Generate New Work Order</h3>
            <button type="button" onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-text">CHOOSE CAPITAL PROJECT *</label>
              <select
                className="input-field"
                required
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">-- Select Active Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label-text">WORK ORDER TITLE *</label>
              <input
                type="text"
                className="input-field"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Laying of 3.5km ductile iron piping structure"
              />
            </div>

            <div>
              <label className="label-text">ASSIGN EXECUTIVE OFFICER</label>
              <select
                className="input-field"
                value={formData.assignedOfficerName}
                onChange={e => setFormData({ ...formData, assignedOfficerName: e.target.value })}
              >
                <option value="">-- Choose Officer --</option>
                {deptOfficers.map(o => (
                  <option key={o.name} value={o.name}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">ASSIGN EXECUTIVE ENGINEER *</label>
              <select
                className="input-field"
                required
                value={formData.assignedEngineerName}
                onChange={e => setFormData({ ...formData, assignedEngineerName: e.target.value })}
              >
                <option value="">-- Choose Engineer --</option>
                {deptEngineers.map(o => (
                  <option key={o.name} value={o.name}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">SCHEDULE WORK DATE</label>
              <input
                type="date"
                className="input-field"
                value={formData.scheduleWork}
                onChange={e => setFormData({ ...formData, scheduleWork: e.target.value })}
              />
            </div>

            <div>
              <label className="label-text">DEADLINE TARGET</label>
              <input
                type="date"
                className="input-field"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label-text">SITE LOCATION ADDRESS</label>
              <input
                type="text"
                className="input-field"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Specific landmark, block, village address details"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Work Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
