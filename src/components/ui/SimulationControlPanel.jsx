import { useState } from 'react'
import { Play, FastForward, PlusCircle, Wrench, RefreshCw, ChevronUp, ChevronDown, Activity, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useProjectEngine } from '../../app/store/projectEngine'
import { useUiStore } from '../../app/store/uiStore'

export default function SimulationControlPanel() {
  const [expanded, setExpanded] = useState(false)
  const pushToast = useUiStore((s) => s.pushToast)

  const complaints = useComplaintEngine((s) => s.complaints)
  const auditLogs = useComplaintEngine((s) => s.auditLogs)
  const simulateRandomComplaintCreation = useComplaintEngine((s) => s.simulateRandomComplaintCreation)
  const advanceComplaintTime = useComplaintEngine((s) => s.advanceSimulationTime)
  const simulateEngineerInspectionAction = useComplaintEngine((s) => s.simulateEngineerInspectionAction)

  const advanceProjectTime = useProjectEngine((s) => s.advanceSimulationTime)

  const escalatedCount = complaints.filter((c) => c.state === 'escalated').length
  const pendingWorkCount = complaints.filter((c) => ['assigned', 'accepted', 'inspection_scheduled', 'work_started'].includes(c.state)).length

  function handleCreateComplaint() {
    simulateRandomComplaintCreation()
    pushToast('Simulation Engine: Generated & Auto-Routed New Citizen Complaint!', 'info')
  }

  function handleAdvanceTime(hours) {
    advanceComplaintTime(hours)
    advanceProjectTime(hours)
    pushToast(`Simulation Engine: Advanced time by ${hours} hours. Recalculated SLAs & Project milestones.`, 'warning')
  }

  function handleFieldAction() {
    const pending = complaints.find((c) => ['assigned', 'accepted', 'inspection_scheduled', 'work_started'].includes(c.state))
    if (!pending) {
      pushToast('No pending jobs available for Engineer action.', 'neutral')
      return
    }
    simulateEngineerInspectionAction(pending.id)
    pushToast(`Simulation Engine: Engineer completed job & uploaded evidence for ${pending.id}!`, 'success')
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="card shadow-popover border-ink-200 bg-white/95 backdrop-blur overflow-hidden transition-all duration-200">
        {/* Header Bar */}
        <button
          onClick={() => setExpanded((o) => !o)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-ink-950 text-white w-full text-left font-medium text-[12px]"
        >
          <Activity size={15} className="text-saffron-400 animate-pulse shrink-0" />
          <span className="font-semibold text-white">NDISP Unified Simulation Engine</span>
          <span className="text-[10px] bg-saffron-500/20 text-saffron-300 font-mono px-2 py-0.5 rounded border border-saffron-500/30 ml-auto">
            LIVE DEMO
          </span>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {/* Collapsible Panel */}
        {expanded && (
          <div className="p-3.5 space-y-3 text-[12px] max-w-xs animate-fade-in">
            <div className="grid grid-cols-3 gap-2 text-center p-2 bg-ink-50 rounded-lg">
              <div>
                <span className="block font-display font-semibold text-[15px] text-ink-950">{complaints.length}</span>
                <span className="text-[10px] text-ink-500 uppercase">Complaints</span>
              </div>
              <div>
                <span className="block font-display font-semibold text-[15px] text-alert-600">{escalatedCount}</span>
                <span className="text-[10px] text-ink-500 uppercase">SLA Breached</span>
              </div>
              <div>
                <span className="block font-display font-semibold text-[15px] text-leaf-600">{auditLogs.length}</span>
                <span className="text-[10px] text-ink-500 uppercase">Audits</span>
              </div>
            </div>

            <p className="text-[11px] text-ink-500 leading-snug">
              Trigger real-time workflow state transitions, automatic department routing, SLA breach escalations, and GIS heatmap updates without backend APIs.
            </p>

            <div className="space-y-1.5">
              <button
                onClick={handleCreateComplaint}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-saffron-50 hover:bg-saffron-100 text-saffron-800 font-semibold border border-saffron-200 transition-colors"
              >
                <span className="flex items-center gap-1.5"><PlusCircle size={14} /> Auto-Generate Citizen Ticket</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono">+1</span>
              </button>

              <button
                onClick={() => handleAdvanceTime(24)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-alert-50 hover:bg-alert-100 text-alert-800 font-semibold border border-alert-200 transition-colors"
              >
                <span className="flex items-center gap-1.5"><FastForward size={14} /> Fast-Forward Time (+24h)</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono">SLA Test</span>
              </button>

              <button
                onClick={handleFieldAction}
                disabled={pendingWorkCount === 0}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-leaf-50 hover:bg-leaf-100 text-leaf-800 font-semibold border border-leaf-200 disabled:opacity-50 transition-colors"
              >
                <span className="flex items-center gap-1.5"><Wrench size={14} /> Sim Field Engineer Inspection</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono">Evidence</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
