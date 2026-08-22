import { useState } from 'react'
import {
  ClipboardCheck, Eye, Plus, X, MapPin, ShieldCheck
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

export default function DepartmentInspectionsWorkspace() {
  const { dept, inspections, projects, workOrders, officers } = useDepartment()
  const pushToast = useUiStore((s) => s.pushToast)

  const scheduleInspection = useProjectEngine((s) => s.scheduleInspection)
  const completeInspection = useProjectEngine((s) => s.completeInspection)

  const [selectedIns, setSelectedIns] = useState(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

  // Scheduling Form
  const [scheduleForm, setScheduleForm] = useState({
    projectId: '',
    workOrderId: '',
    title: '',
    inspector: '',
    date: '',
    checklistText: ''
  })

  // Completing Form
  const [completeForm, setCompleteForm] = useState({
    checklist: [],
    complianceScore: 90,
    remarks: '',
    photoUrl: '',
    followUpTriggered: false,
    followUpDetails: ''
  })

  const deptInspectors = officers.filter(o => o.role === 'field_inspector' || o.role === 'engineer')

  function handleSchedule(e) {
    e.preventDefault()
    if (!scheduleForm.projectId || !scheduleForm.title || !scheduleForm.inspector) {
      pushToast('Please select project, title, and inspector.', 'error')
      return
    }

    const checklistArr = scheduleForm.checklistText
      .split('\n')
      .filter(item => item.trim())
      .map(item => ({ item, checked: false }))

    scheduleInspection({
      projectId: scheduleForm.projectId,
      workOrderId: scheduleForm.workOrderId || 'N/A',
      title: scheduleForm.title,
      departmentId: dept.id,
      inspector: scheduleForm.inspector,
      date: scheduleForm.date || new Date().toISOString().split('T')[0],
      checklist: checklistArr.length > 0 ? checklistArr : undefined
    })

    pushToast('Inspection scheduled successfully!', 'success')
    setIsScheduleModalOpen(false)
    resetScheduleForm()
  }

  function handleCompleteSubmit(e) {
    e.preventDefault()
    completeInspection(
      selectedIns.id,
      completeForm.checklist,
      Number(completeForm.complianceScore),
      completeForm.remarks,
      completeForm.photoUrl ? [completeForm.photoUrl] : []
    )
    pushToast('Inspection details filed successfully!', 'success')
    setIsCompleteModalOpen(false)
    setSelectedIns(null)
  }

  function toggleChecklistItem(idx) {
    setCompleteForm(prev => {
      const updated = [...prev.checklist]
      updated[idx] = { ...updated[idx], checked: !updated[idx].checked }
      return { ...prev, checklist: updated }
    })
  }

  function openCompleteModal(ins) {
    setSelectedIns(ins)
    setCompleteForm({
      checklist: ins.checklist || [],
      complianceScore: ins.complianceScore || 90,
      remarks: ins.remarks || '',
      photoUrl: ins.geoTaggedPhotos?.[0] || '',
      followUpTriggered: ins.followUpTriggered || false,
      followUpDetails: ins.followUpDetails || ''
    })
    setIsCompleteModalOpen(true)
  }

  function resetScheduleForm() {
    setScheduleForm({
      projectId: '',
      workOrderId: '',
      title: '',
      inspector: '',
      date: '',
      checklistText: ''
    })
  }

  const columns = [
    { key: 'id', label: 'ID', render: (r) => <span className="kbd-mono text-[11.5px] font-bold text-ink-900">{r.id}</span> },
    { key: 'title', label: 'Inspection Title', render: (r) => <span className="font-semibold text-ink-950 block truncate max-w-[200px]">{r.title}</span> },
    { key: 'inspector', label: 'Inspector', render: (r) => <span className="text-[12.5px]">{r.inspector}</span> },
    { key: 'date', label: 'Date', render: (r) => <span className="font-mono text-[12px]">{r.date}</span> },
    { key: 'complianceScore', label: 'Compliance Score', render: (r) => (
      r.status === 'completed' ? (
        <span className={`font-mono font-bold ${r.complianceScore >= 85 ? 'text-leaf-700' : 'text-saffron-600'}`}>{r.complianceScore}%</span>
      ) : <span className="text-ink-400">—</span>
    )},
    { key: 'status', label: 'Status', render: (r) => <Badge tone={r.status === 'completed' ? 'positive' : 'warning'}>{r.status.toUpperCase()}</Badge> },
    { key: 'action', label: 'Action', render: (r) => (
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {r.status === 'scheduled' ? (
          <Button size="xs" icon={ClipboardCheck} onClick={() => openCompleteModal(r)}>File</Button>
        ) : (
          <Button size="xs" variant="outline" icon={Eye} onClick={() => setSelectedIns(r)}>View</Button>
        )}
      </div>
    )}
  ]

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow={`Field Quality Audits · ${dept.code}`}
        title={`${dept.label} Site Inspections`}
        description="Verify construction standards, compliance indicators, record geo-tagged photographic evidence, and log audits."
        action={
          <Button size="sm" icon={Plus} onClick={() => { resetScheduleForm(); setIsScheduleModalOpen(true) }}>
            Schedule Audit
          </Button>
        }
      />

      <div className="px-6">
        <Card>
          <CardHeader title="Quality Inspection Register" subtitle="Verify safety checklists and geotag compliance" icon={ClipboardCheck} />
          <CardBody className="!p-0">
            <DataTable columns={columns} rows={inspections} onRowClick={(row) => setSelectedIns(row)} />
          </CardBody>
        </Card>
      </div>

      {/* DETAIL VIEW MODAL */}
      <Modal open={!!selectedIns && !isCompleteModalOpen} onClose={() => setSelectedIns(null)} width="max-w-xl">
        {selectedIns && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="kbd-mono text-[11px] font-bold text-ink-400">{selectedIns.id}</span>
                <h3 className="text-base font-bold text-ink-950 mt-1">{selectedIns.title}</h3>
              </div>
              <Badge tone={selectedIns.status === 'completed' ? 'positive' : 'warning'}>{selectedIns.status.toUpperCase()}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px] bg-ink-50/50 p-3 rounded-xl">
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">AUDITOR</span>
                <span className="font-bold text-ink-900">{selectedIns.inspector}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">COMPLIANCE RATING</span>
                <span className="font-mono text-ink-900 font-bold">{selectedIns.status === 'completed' ? `${selectedIns.complianceScore}%` : 'Pending audit'}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">PROJECT LINK</span>
                <span className="font-semibold text-ink-900">{selectedIns.projectId}</span>
              </div>
              <div>
                <span className="text-ink-400 block text-[11px] uppercase">AUDIT DATE</span>
                <span className="font-mono text-ink-900 font-semibold">{selectedIns.date}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-ink-800 text-[12.5px] block">Checklist Verification Status</span>
              <div className="border border-ink-150 rounded-lg divide-y divide-ink-100 bg-white text-[12.5px]">
                {selectedIns.checklist?.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center gap-2">
                    {item.checked ? (
                      <ShieldCheck size={16} className="text-leaf-600 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-ink-300 shrink-0" />
                    )}
                    <span className={item.checked ? 'text-ink-500' : 'text-ink-900 font-semibold'}>{item.item}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedIns.remarks && (
              <div className="space-y-1 text-[12.5px]">
                <span className="font-semibold text-ink-700">Remarks</span>
                <p className="p-2.5 bg-ink-50/20 border border-ink-100 rounded-lg text-ink-600 leading-snug">{selectedIns.remarks}</p>
              </div>
            )}

            {selectedIns.geoTaggedPhotos?.length > 0 && (
              <div className="space-y-2">
                <span className="font-semibold text-ink-800 text-[12.5px] block">Geotagged Evidence Photo</span>
                <div className="h-32 w-full rounded-xl overflow-hidden bg-ink-100 relative">
                  <img src={selectedIns.geoTaggedPhotos[0]} className="h-full w-full object-cover" alt="Evidence" />
                  <span className="absolute bottom-2 left-2 bg-ink-950/70 text-white font-mono text-[9px] px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <MapPin size={10} /> Geotag status unavailable
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* SCHEDULE MODAL */}
      <Modal open={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} width="max-w-xl">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-ink-950">Schedule Field Site Audit</h3>
            <button type="button" onClick={() => setIsScheduleModalOpen(false)}><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-text">CHOOSE TARGET PROJECT *</label>
              <select
                className="input-field"
                required
                value={scheduleForm.projectId}
                onChange={e => setScheduleForm({ ...scheduleForm, projectId: e.target.value })}
              >
                <option value="">-- Select Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label-text">WORK ORDER LINKAGE</label>
              <select
                className="input-field"
                value={scheduleForm.workOrderId}
                onChange={e => setScheduleForm({ ...scheduleForm, workOrderId: e.target.value })}
              >
                <option value="">-- Optional Work Order Link --</option>
                {workOrders.filter(w => w.projectId === scheduleForm.projectId).map(w => (
                  <option key={w.id} value={w.id}>{w.id} - {w.title}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label-text">INSPECTION TITLE *</label>
              <input
                type="text"
                className="input-field"
                required
                value={scheduleForm.title}
                onChange={e => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                placeholder="e.g. Concrete setting strength and reinforcement verification"
              />
            </div>

            <div>
              <label className="label-text">CHOOSE INSPECTOR *</label>
              <select
                className="input-field"
                required
                value={scheduleForm.inspector}
                onChange={e => setScheduleForm({ ...scheduleForm, inspector: e.target.value })}
              >
                <option value="">-- Select Auditor --</option>
                {deptInspectors.map(o => (
                  <option key={o.name} value={`${o.name} (${o.role === 'engineer' ? 'AE' : 'JE'})`}>{o.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">SCHEDULED DATE</label>
              <input
                type="date"
                className="input-field"
                value={scheduleForm.date}
                onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label-text">INSPECTION CHECKLIST (One item per line)</label>
              <textarea
                rows={3}
                className="input-field"
                value={scheduleForm.checklistText}
                onChange={e => setScheduleForm({ ...scheduleForm, checklistText: e.target.value })}
                placeholder="e.g.&#10;Verify reinforcement steel width&#10;Conduct visual concrete core review&#10;Verify geotagged site photo alignment"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button type="submit">Schedule Audit</Button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE/FILE AUDIT MODAL */}
      <Modal open={isCompleteModalOpen} onClose={() => { setIsCompleteModalOpen(false); setSelectedIns(null) }} width="max-w-xl">
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-ink-950">File Inspection Compliance Outcome</h3>
            <button type="button" onClick={() => { setIsCompleteModalOpen(false); setSelectedIns(null) }}><X size={18} /></button>
          </div>

          <div className="space-y-3">
            <label className="label-text">CHECKLIST ITEMS VERIFICATION</label>
            <div className="border border-ink-150 rounded-xl p-3 bg-ink-50/10 space-y-2">
              {completeForm.checklist.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2.5 text-[12.5px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleChecklistItem(idx)}
                    className="h-4 w-4 text-leaf-600 rounded border-ink-300 focus:ring-leaf-500"
                  />
                  <span className={item.checked ? 'text-ink-500 font-semibold' : 'text-ink-900 font-semibold'}>{item.item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">COMPLIANCE SCORE (0 - 100%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input-field"
                required
                value={completeForm.complianceScore}
                onChange={e => setCompleteForm({ ...completeForm, complianceScore: e.target.value })}
              />
            </div>

            <div>
              <label className="label-text">GEOTAGGED EVIDENCE PHOTO URL</label>
              <input
                type="text"
                className="input-field"
                value={completeForm.photoUrl}
                onChange={e => setCompleteForm({ ...completeForm, photoUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="label-text">AUDIT REMARKS / FINDINGS *</label>
              <textarea
                rows={2}
                className="input-field"
                required
                value={completeForm.remarks}
                onChange={e => setCompleteForm({ ...completeForm, remarks: e.target.value })}
                placeholder="Details of safety measurements, deviations from DPR, or materials quality observations"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setIsCompleteModalOpen(false); setSelectedIns(null) }}>Cancel</Button>
            <Button type="submit">File Audit Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
