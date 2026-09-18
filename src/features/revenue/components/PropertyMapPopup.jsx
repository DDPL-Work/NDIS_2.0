import { useEffect, useRef } from 'react'
import { X, MapPin, Home, Calculator, FileText, CreditCard, AlertTriangle, History, Bell, ClipboardList, Gavel, ExternalLink } from 'lucide-react'
import { Card, Button, Badge, Tabs } from '../../../components/ui'
import { TAX_STATUS_LABELS, TAX_STATUS_COLORS, TAX_STATUS } from '../constants/revenueConstants'
import { formatCurrency, formatArea, formatDate, truncate } from '../utils/revenueFormatters'

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: '#22c55e' },
  due: { label: 'Due', color: '#ef4444' },
  partial: { label: 'Partial', color: '#f97316' },
  arrears: { label: 'Arrears', color: '#dc2626' },
  exempt: { label: 'Exempt', color: '#3b82f6' },
  disputed: { label: 'Disputed', color: '#a855f7' },
}

const ACTION_ICONS = {
  view_details: { icon: ExternalLink, label: 'View Details' },
  view_tax: { icon: Calculator, label: 'View Tax' },
  view_history: { icon: History, label: 'Tax History' },
  schedule_inspection: { icon: ClipboardList, label: 'Schedule Inspection' },
  reassess: { icon: Calculator, label: 'Reassess' },
  issue_notice: { icon: FileText, label: 'Issue Notice' },
  recovery: { icon: Gavel, label: 'Recovery' },
  open_gis: { icon: MapPin, label: 'Open in GIS' },
}

export function PropertyMapPopup({
  property,
  onClose,
  onAction,
  className = '',
  showActions = true,
  maxWidth = 380,
}) {
  const popupRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!property) return null

  const taxStatus = property.taxStatus || 'due'
  const statusConfig = STATUS_CONFIG[taxStatus] || { label: taxStatus, color: '#94a3b8' }

  const primaryActions = [
    { id: 'view_details', label: 'View Details', icon: ExternalLink, variant: 'primary' },
    { id: 'view_tax', label: 'View Tax', icon: Calculator, variant: 'secondary' },
    { id: 'view_history', label: 'History', icon: History, variant: 'secondary' },
  ]

  const secondaryActions = [
    { id: 'schedule_inspection', label: 'Schedule Inspection', icon: ClipboardList, variant: 'outline' },
    { id: 'reassess', label: 'Reassess', icon: Calculator, variant: 'outline' },
    { id: 'issue_notice', label: 'Issue Notice', icon: FileText, variant: 'outline' },
    { id: 'recovery', label: 'Recovery', icon: Gavel, variant: 'outline' },
  ]

  return (
    <div
      ref={popupRef}
      className={`fixed z-50 ${className}`}
      style={{ maxWidth, right: 20, bottom: 20 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <Card className="shadow-xl overflow-hidden animate-slide-up" style={{ maxWidth }}>
        {/* Header */}
        <div className="flex items-start justify-between p-3 bg-ink-50 border-b border-ink-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Home className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 id="popup-title" className="text-sm font-semibold text-ink-900 truncate">
                {property.plotNo || property.houseNo || `Property #${property.id}`}
              </h3>
              <p className="text-xs text-ink-500 truncate">{property.ownerName || 'Unknown Owner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge
              className="text-[10px] px-1.5 py-0.5"
              style={{
                backgroundColor: `${statusConfig.color}15`,
                color: statusConfig.color,
                borderColor: `${statusConfig.color}40`
              }}
            >
              {statusConfig.label}
            </Badge>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
              aria-label="Close popup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs
          tabs={[
            { value: 'summary', label: 'Summary' },
            { value: 'financial', label: 'Financial' },
            { value: 'location', label: 'Location' },
          ]}
          active="summary"
          onChange={() => {}}
          className="p-3"
        >
          {/* Summary Tab */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-ink-500">Property ID</dt>
                <dd className="text-ink-900 font-mono truncate">{property.id}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Plot / House</dt>
                <dd className="text-ink-900 font-mono truncate">
                  {property.plotNo || '—'} {property.houseNo ? `/ ${property.houseNo}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">Property Type</dt>
                <dd className="text-ink-900">
                  <Badge variant="outline" className="text-[10px]">{property.propertyType}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">Construction</dt>
                <dd className="text-ink-900">{property.constructionType}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Land Area</dt>
                <dd className="text-ink-900">{formatArea(property.landAreaSqft)}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Built-up Area</dt>
                <dd className="text-ink-900">{formatArea(property.builtUpAreaSqft)}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Floors</dt>
                <dd className="text-ink-900">{property.floors}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Assessment Category</dt>
                <dd className="text-ink-900">{property.assessmentCategory || '—'}</dd>
              </div>
            </div>

            <div className="border-t border-ink-200 pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500">Current Demand</span>
                <span className="font-medium text-ink-900">{formatCurrency(property.currentDemand)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Total Paid</span>
                <span className="font-medium text-green-700">{formatCurrency(property.totalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Outstanding</span>
                <span className="font-medium text-red-700">{formatCurrency(property.totalOutstanding)}</span>
              </div>
              {property.totalArrears > 0 && (
                <div className="flex justify-between text-red-700 font-medium">
                  <span>Total Arrears</span>
                  <span>{formatCurrency(property.totalArrears)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-500">Last Payment</span>
                <span className="font-medium text-ink-900">
                  {property.lastPaymentDate ? `${formatDate(property.lastPaymentDate)} (${formatCurrency(property.lastPaymentAmount)})` : '—'}
                </span>
              </div>
            </div>

            <div className="border-t border-ink-200 pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500">Block</span>
                <span className="font-medium text-ink-900 truncate">{property.blockName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Ward</span>
                <span className="font-medium text-ink-900">{property.wardName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Village</span>
                <span className="font-medium text-ink-900 truncate">{property.villageName}</span>
              </div>
            </div>

            {property.isHighValue && (
              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-800 flex items-center gap-1">
                <span>⬥</span> High Value Property
              </div>
            )}

            {property.isDisputed && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-1">
                <span>⚠</span> Disputed Property
              </div>
            )}
          </div>

          {/* Financial Tab */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-green-50 rounded">
                <dt className="text-green-700">Total Paid</dt>
                <dd className="font-bold text-green-900">{formatCurrency(property.totalPaid)}</dd>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <dt className="text-red-700">Outstanding</dt>
                <dd className="font-bold text-red-900">{formatCurrency(property.totalOutstanding)}</dd>
              </div>
              <div className="p-2 bg-amber-50 rounded">
                <dt className="text-amber-700">Arrears</dt>
                <dd className="font-bold text-amber-900">{formatCurrency(property.totalArrears)}</dd>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <dt className="text-blue-700">Current Demand</dt>
                <dd className="font-bold text-blue-900">{formatCurrency(property.currentDemand)}</dd>
              </div>
            </div>

            {property.lastPaymentDate && (
              <div className="p-2 bg-ink-50 rounded border border-ink-200">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-ink-500">Last Payment:</span>
                  <span className="font-medium text-ink-900">{formatDate(property.lastPaymentDate)}</span>
                  <span className="text-green-700 font-medium">{formatCurrency(property.lastPaymentAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Location Tab */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-ink-500">Block</dt>
                <dd className="text-ink-900">{property.blockName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Ward</dt>
                <dd className="text-ink-900">{property.wardName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Village</dt>
                <dd className="text-ink-900">{property.villageName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Coordinates</dt>
                <dd className="text-ink-900 font-mono text-[10px]">
                  {property.latitude?.toFixed(6)}, {property.longitude?.toFixed(6)}
                </dd>
              </div>
            </div>

            {property.geometry && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onAction?.('view_geometry', property)}
              >
                View Geometry on Map
              </Button>
            )}
          </div>
        </Tabs>

        {/* Actions */}
        {showActions && (
          <div className="p-3 border-t border-ink-200 bg-ink-50">
            <div className="flex flex-wrap gap-1">
{primaryActions.map(action => {
                const Icon = ACTION_ICONS[action.id]?.icon
                return (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={action.variant}
                    className="flex-1 min-w-[80px] gap-1 h-auto py-1.5"
                    onClick={() => { onAction?.(action.id, property); onClose?.() }}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                )
              })}

            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {secondaryActions.map(action => {
                const Icon = ACTION_ICONS[action.id]?.icon
                return (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={action.variant}
                    className="flex-1 min-w-[80px] gap-1 h-auto py-1.5"
                    onClick={() => { onAction?.(action.id, property); onClose?.() }}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                )
              })}
            </div>
            <div className="flex gap-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 min-w-[80px] gap-1 h-auto py-1.5"
                onClick={() => { onAction?.('open_gis', property); onClose?.() }}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in GIS</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default PropertyMapPopup