// Revenue & Property Intelligence — Revenue Action Menu
// Dropdown menu for property actions from map/list

import { useState, useRef, useEffect } from 'react'
import {
  Eye, History, ClipboardList, Calculator, FileText, Gavel,
  MapPin, AlertTriangle, Map, Download, Printer, Shield, ChevronDown
} from 'lucide-react'

const ACTION_GROUPS = [
  {
    label: 'Primary Actions',
    items: [
      { id: 'view_property', label: 'View Property', icon: Eye },
      { id: 'view_tax_history', label: 'View Tax History', icon: History },
      { id: 'view_arrears', label: 'View Arrears', icon: AlertTriangle },
    ],
  },
  {
    label: 'Field Actions',
    items: [
      { id: 'schedule_inspection', label: 'Schedule Inspection', icon: ClipboardList },
      { id: 'initiate_reassessment', label: 'Initiate Reassessment', icon: Calculator },
      { id: 'issue_tax_notice', label: 'Issue Tax Notice', icon: FileText },
      { id: 'create_recovery', label: 'Create Recovery Action', icon: Gavel },
    ],
  },
  {
    label: 'Administrative',
    items: [
      { id: 'add_priority', label: 'Add to Priority Locations', icon: MapPin },
      { id: 'escalate', label: 'Escalate', icon: AlertTriangle },
    ],
  },
  {
    label: 'Utilities',
    items: [
      { id: 'open_gis', label: 'Open in GIS', icon: Map },
      { id: 'export', label: 'Export', icon: Download },
      { id: 'print', label: 'Print', icon: Printer },
      { id: 'audit', label: 'Audit Trail', icon: Shield },
    ],
  },
]

export function RevenueActionMenu({
  property,
  onAction,
  className = '',
  triggerLabel = 'Actions',
  triggerIcon,
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAction = (actionId) => {
    onAction?.(actionId, property)
    setOpen(false)
  }

  return (
    <div ref={triggerRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-ink-700 bg-white border border-ink-300 rounded-lg hover:bg-ink-50 transition-colors"
      >
        {triggerIcon}
        <span>{triggerLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-ink-200 rounded-lg shadow-lg py-1">
          {ACTION_GROUPS.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && <hr className="my-1 border-ink-100" />}
              <div className="px-2 py-1 text-xs font-medium text-ink-400 uppercase tracking-wider">
                {group.label}
              </div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAction(item.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50 rounded"
                >
                  <item.icon className="w-4 h-4 text-ink-400" />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RevenueActionMenu