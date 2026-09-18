// Revenue & Property Intelligence — Property Drawer
// Right-side drawer with all property sections

import { useState, useMemo } from 'react'
import { X, ChevronDown, ChevronUp, Home, MapPin, Map, Calculator, FileText, CreditCard, AlertTriangle, History, Bell, ClipboardList, Gavel, Shield } from 'lucide-react'
import { Card, Button, Badge, Tabs } from '../../../components/ui'
import { PROPERTY_DRAWER_SECTIONS, TAX_STATUS, TAX_STATUS_LABELS, TAX_STATUS_COLORS } from '../constants/revenueConstants'
import { formatCurrency, formatArea, formatDate, truncate } from '../utils/revenueFormatters'
import { calculatePropertyTax } from '../utils/propertyTaxCalculator'

const SECTION_ICONS = {
  identity: Home,
  location: MapPin,
  gis: Map,
  assessment: Calculator,
  demand: FileText,
  payment: CreditCard,
  arrears: AlertTriangle,
  tax_history: History,
  notices: Bell,
  inspections: ClipboardList,
  dm_actions: Gavel,
  audit: Shield,
}

export function PropertyDrawer({
  property,
  assessments = [],
  demands = [],
  payments = [],
  receipts = [],
  arrears = [],
  notices = [],
  inspections = [],
  reassessments = [],
  recoveryActions = [],
  auditLogs = [],
  isOpen,
  onClose,
  onAction,
  className = '',
}) {
  const [activeSection, setActiveSection] = useState('identity')
  const [expandedSections, setExpandedSections] = useState(['identity', 'location', 'gis'])

  if (!isOpen || !property) return null

  const taxStatus = property.taxStatus || 'due'
  const statusConfig = {
    label: TAX_STATUS_LABELS[taxStatus] || taxStatus,
    color: TAX_STATUS_COLORS[taxStatus] || '#94a3b8',
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => prev.includes(sectionId)
      ? prev.filter(id => id !== sectionId)
      : [...prev, sectionId]
    )
  }

  return (
    <div className={`fixed inset-0 z-50 flex ${className}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-200 bg-ink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-900">
                {property.plotNo || property.houseNo || `Property #${property.id}`}
              </h2>
              <p className="text-sm text-ink-500">{property.ownerName || 'Unknown Owner'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className="text-xs px-2 py-1"
              style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color, borderColor: `${statusConfig.color}40` }}
            >
              {statusConfig.label}
            </Badge>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="px-4 py-3 border-b border-ink-200 bg-white flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onAction?.('view_tax', property)}
            className="flex-1 min-w-[140px]"
          >
            View Tax
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAction?.('view_history', property)}
            className="flex-1 min-w-[140px]"
          >
            History
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAction?.('schedule_inspection', property)}
            className="flex-1 min-w-[140px]"
          >
            Schedule Inspection
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAction?.('reassess', property)}
            className="flex-1 min-w-[140px]"
          >
            Reassess
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAction?.('issue_notice', property)}
            className="flex-1 min-w-[140px]"
          >
            Issue Notice
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction?.('recovery', property)}
            className="flex-1 min-w-[140px]"
          >
            Recovery
          </Button>
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {PROPERTY_DRAWER_SECTIONS.map(section => {
            const Icon = SECTION_ICONS[section.id]
            const isExpanded = expandedSections.includes(section.id)
            const content = renderSectionContent(section.id)

            return (
              <Card key={section.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 bg-ink-50 border-b border-ink-100 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-ink-500" />
                    <h3 className="text-sm font-medium text-ink-900">{section.label}</h3>
                    {section.badge && (
                      <Badge variant="outline" className="text-xs">{section.badge}</Badge>
                    )}
                  </div>
                  <span className="text-ink-400 transition-transform">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                </div>
                {isExpanded && (
                  <div className="p-3">{content}</div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-ink-200 bg-ink-50 flex flex-wrap gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => onAction?.('export', property)}>
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAction?.('print', property)}>
            Print
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAction?.('open_gis', property)}>
            Open GIS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onAction?.('audit', property)}>
            Audit Trail
          </Button>
        </div>
      </div>
    </div>
  )

  function renderSectionContent(sectionId) {
    switch (sectionId) {
      case 'identity':
        return (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-ink-500">Property ID</dt>
            <dd className="text-ink-900 font-mono">{property.id}</dd>
            <dt className="text-ink-500">Plot Number</dt>
            <dd className="text-ink-900">{property.plotNo || '—'}</dd>
            <dt className="text-ink-500">House/Unit</dt>
            <dd className="text-ink-900">{property.houseNo || property.unitNo || '—'}</dd>
            <dt className="text-ink-500">Owner Name</dt>
            <dd className="text-ink-900">{property.ownerName || '—'}</dd>
            <dt className="text-ink-500">Owner Mobile</dt>
            <dd className="text-ink-900">{property.ownerMobile || '—'}</dd>
            <dt className="text-ink-500">Owner Email</dt>
            <dd className="text-ink-900">{property.ownerEmail || '—'}</dd>
            <dt className="text-ink-500">Aadhaar</dt>
            <dd className="text-ink-900 font-mono">{truncate(property.aadhaar) || '—'}</dd>
            <dt className="text-ink-500">Property Type</dt>
            <dd className="text-ink-900"><Badge variant="outline">{property.propertyType}</Badge></dd>
            <dt className="text-ink-500">Usage Type</dt>
            <dd className="text-ink-900">{property.usageType}</dd>
            <dt className="text-ink-500">Construction</dt>
            <dd className="text-ink-900">{property.constructionType}</dd>
            <dt className="text-ink-500">Floors</dt>
            <dd className="text-ink-900">{property.floors}</dd>
            <dt className="text-ink-500">Assessment Category</dt>
            <dd className="text-ink-900">{property.assessmentCategory || '—'}</dd>
          </dl>
        )

      case 'location':
        return (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-ink-500">Address</dt>
            <dd className="col-span-2 text-ink-900">{property.address || '—'}</dd>
            <dt className="text-ink-500">Block</dt>
            <dd className="text-ink-900">{property.blockName || '—'}</dd>
            <dt className="text-ink-500">Ward</dt>
            <dd className="text-ink-900">{property.wardName || '—'}</dd>
            <dt className="text-ink-500">Village</dt>
            <dd className="text-ink-900">{property.villageName || '—'}</dd>
            <dt className="text-ink-500">Latitude</dt>
            <dd className="text-ink-900 font-mono">{property.latitude?.toFixed(6) || '—'}</dd>
            <dt className="text-ink-500">Longitude</dt>
            <dd className="text-ink-900 font-mono">{property.longitude?.toFixed(6) || '—'}</dd>
          </dl>
        )

      case 'gis':
        return (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <dt className="text-ink-500">GIS Layer</dt>
              <dd className="text-ink-900">{property.gisLayer || 'property_parcels'}</dd>
              <dt className="text-ink-500">Land Area</dt>
              <dd className="text-ink-900">{formatArea(property.landAreaSqft)}</dd>
              <dt className="text-ink-500">Built-up Area</dt>
              <dd className="text-ink-900">{formatArea(property.builtUpAreaSqft)}</dd>
              <dt className="text-ink-500">Geometry Type</dt>
              <dd className="text-ink-900">{property.geometry?.type || 'Polygon'}</dd>
            </div>
            {property.geometry && (
              <Button variant="outline" size="sm" onClick={() => onAction?.('view_geometry', property)}>
                View Geometry
              </Button>
            )}
            {property.geometry && (() => {
              const taxCalc = calculatePropertyTax({ geometry: property.geometry, properties: property })
              if (!taxCalc.calculationUnavailable) {
                return (
                  <div className="border-t border-ink-200 pt-3 space-y-2">
                    <div className="font-medium text-ink-900 flex items-center gap-1">
                      <Calculator className="w-4 h-4 text-ink-500" /> Tax Breakdown
                    </div>
                    <div className="space-y-1 bg-ink-50 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-500">Area</span>
                        <span className="font-medium text-ink-900">{formatArea(taxCalc.areaSqft || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-500">Rate</span>
                        <span className="font-medium text-ink-900">{formatCurrency(taxCalc.ratePerSqft)}/sq.ft</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-ink-200 pt-1">
                        <span className="text-ink-500">Base Property Tax</span>
                        <span className="font-medium text-ink-900">{formatCurrency(taxCalc.baseTax)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-ink-500">Urban Development Cess (5%)</span>
                        <span className="font-medium text-ink-900">{formatCurrency(taxCalc.cess)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-ink-200 pt-1 font-semibold">
                        <span className="text-ink-900">TOTAL TAX PAYABLE</span>
                        <span className="text-emerald-600">{formatCurrency(taxCalc.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )

      case 'assessment':
        return (
          <div className="space-y-3">
            {assessments.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No assessments found</p>
            ) : (
              <>
                <Tabs
                  tabs={assessments.map(a => ({
                    value: a.id,
                    label: `${a.financialYear} (${a.status})`,
                  }))}
                  active={assessments[0]?.id}
                  onChange={() => {}}
                />
                {assessments.map(a => (
                  <div key={a.id} className="py-3 border-t border-ink-200">
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-ink-500">FY</dt>
                      <dd className="text-ink-900">{a.financialYear}</dd>
                      <dt className="text-ink-500">Status</dt>
                      <dd className="text-ink-900"><Badge variant="outline">{a.status}</Badge></dd>
                      <dt className="text-ink-500">Land Area</dt>
                      <dd className="text-ink-900">{formatArea(a.landAreaSqft)}</dd>
                      <dt className="text-ink-500">Built-up</dt>
                      <dd className="text-ink-900">{formatArea(a.builtUpAreaSqft)}</dd>
                      <dt className="text-ink-500">Taxable Area</dt>
                      <dd className="text-ink-900">{formatArea(a.taxableAreaSqft)}</dd>
                      <dt className="text-ink-500">Base Rate</dt>
                      <dd className="text-ink-900">{formatCurrency(a.baseRatePerSqft)}/sqft</dd>
                      <dt className="text-ink-500">Rebate</dt>
                      <dd className="text-ink-900">{a.rebatePercent}% ({formatCurrency(a.rebateAmount)})</dd>
                      <dt className="text-ink-500">Penalty</dt>
                      <dd className="text-ink-900">{a.penaltyPercent}% ({formatCurrency(a.penaltyAmount)})</dd>
                      <dt className="text-ink-500">Annual Tax</dt>
                      <dd className="text-ink-900 font-semibold">{formatCurrency(a.annualTax)}</dd>
                      <dt className="text-ink-500">Half-Yearly</dt>
                      <dd className="text-ink-900">{formatCurrency(a.halfYearlyTax)}</dd>
                      <dt className="text-ink-500">Quarterly</dt>
                      <dd className="text-ink-900">{formatCurrency(a.quarterlyTax)}</dd>
                      <dt className="text-ink-500">Rule Applied</dt>
                      <dd className="text-ink-900">{a.applicableRuleName}</dd>
                    </dl>
                  </div>
                ))}
              </>
            )}
          </div>
        )

      case 'demand':
        return (
          <div className="space-y-3">
            {demands.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No demands generated</p>
            ) : (
              demands.map(d => (
                <Card key={d.id} className="p-3" variant="outline">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900">{d.demandNumber || d.financialYear}</span>
                    <Badge variant="outline" className="text-xs">{d.status}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-ink-500">FY</dt>
                    <dd className="text-ink-900">{d.financialYear}</dd>
                    <dt className="text-ink-500">Net Demand</dt>
                    <dd className="text-ink-900 font-semibold">{formatCurrency(d.netDemand)}</dd>
                    <dt className="text-ink-500">Paid</dt>
                    <dd className="text-ink-900 text-green-700">{formatCurrency(d.paidAmount)}</dd>
                    <dt className="text-ink-500">Outstanding</dt>
                    <dd className="text-ink-900 text-red-700">{formatCurrency(d.outstandingAmount)}</dd>
                    <dt className="text-ink-500">Due Date</dt>
                    <dd className="text-ink-900">{formatDate(d.dueDate)}</dd>
                    <dt className="text-ink-500">Notice Sent</dt>
                    <dd className="text-ink-900">{formatDate(d.noticeSentDate)}</dd>
                  </dl>
                </Card>
              ))
            )}
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No payments recorded</p>
            ) : (
              payments.map(p => (
                <Card key={p.id} className="p-3" variant="outline">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900">{p.receiptNumber || `Payment #${p.id.slice(-6)}`}</span>
                    <Badge variant="outline" className="text-xs">{p.status}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-ink-500">Date</dt>
                    <dd className="text-ink-900">{formatDate(p.paymentDate)}</dd>
                    <dt className="text-ink-500">Mode</dt>
                    <dd className="text-ink-900">{p.paymentMode}</dd>
                    <dt className="text-ink-500">Amount</dt>
                    <dd className="text-ink-900 font-semibold">{formatCurrency(p.amount)}</dd>
                    <dt className="text-ink-500">Transaction ID</dt>
                    <dd className="text-ink-900 font-mono text-xs">{truncate(p.transactionId)}</dd>
                    <dt className="text-ink-500">Receipt</dt>
                    <dd className="text-ink-900 font-mono text-xs">{p.receiptNumber}</dd>
                    <dt className="text-ink-500">Collected By</dt>
                    <dd className="text-ink-900">{p.collectedBy}</dd>
                  </dl>
                </Card>
              ))
            )}
          </div>
        )

      case 'arrears':
        return (
          <div className="space-y-3">
            {arrears.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No arrears</p>
            ) : (
              arrears.map(a => (
                <Card key={a.id} className="p-3 border-l-4 border-red-500" variant="outline">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900">FY {a.financialYear}</span>
                    <Badge className="bg-red-100 text-red-800 text-xs">{a.agingBucket}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-ink-500">Original Demand</dt>
                    <dd className="text-ink-900">{formatCurrency(a.originalDemand)}</dd>
                    <dt className="text-ink-500">Paid</dt>
                    <dd className="text-ink-900">{formatCurrency(a.paidAmount)}</dd>
                    <dt className="text-ink-500">Outstanding</dt>
                    <dd className="text-ink-900 font-semibold text-red-700">{formatCurrency(a.outstandingAmount)}</dd>
                    <dt className="text-ink-500">Penalty</dt>
                    <dd className="text-ink-900">{formatCurrency(a.penaltyAmount)}</dd>
                    <dt className="text-ink-500">Interest</dt>
                    <dd className="text-ink-900">{formatCurrency(a.interestAmount)}</dd>
                    <dt className="text-ink-500">Total Arrears</dt>
                    <dd className="text-ink-900 font-bold text-red-800">{formatCurrency(a.totalArrears)}</dd>
                    <dt className="text-ink-500">Years Pending</dt>
                    <dd className="text-ink-900">{a.yearsPending}</dd>
                    <dt className="text-ink-500">Last Payment</dt>
                    <dd className="text-ink-900">{formatDate(a.lastPaymentDate)} ({formatCurrency(a.lastPaymentAmount)})</dd>
                    <dt className="text-ink-500">Recovery Status</dt>
                    <dd className="text-ink-900"><Badge variant="outline">{a.recoveryStatus}</Badge></dd>
                  </dl>
                </Card>
              ))
            )}
          </div>
        )

      case 'tax_history':
        return (
          <div className="space-y-3">
            {demands.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No tax history</p>
            ) : (
              demands.map(d => (
                <Card key={d.id} className="p-3" variant="outline">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900">FY {d.financialYear}</span>
                    <Badge variant="outline" className="text-xs">{d.status}</Badge>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <dt className="text-ink-500">Demand</dt>
                    <dd className="text-ink-900">{formatCurrency(d.netDemand)}</dd>
                    <dt className="text-ink-500">Collected</dt>
                    <dd className="text-green-700">{formatCurrency(d.paidAmount)}</dd>
                    <dt className="text-ink-500">Outstanding</dt>
                    <dd className="text-red-700">{formatCurrency(d.outstandingAmount)}</dd>
                    <dt className="text-ink-500">Collection Rate</dt>
                    <dd className="col-span-2 text-ink-900">
                      {d.netDemand > 0 ? `${((d.paidAmount / d.netDemand) * 100).toFixed(1)}%` : 'N/A'}
                    </dd>
                  </dl>
                </Card>
              ))
            )}
          </div>
        )

      case 'notices':
        return (
          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No notices issued</p>
            ) : (
              notices.map(n => (
                <Card key={n.id} className="p-3" variant="outline">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900">{n.noticeNumber}</span>
                    <Badge variant="outline" className="text-xs">{n.status}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-ink-500">Type</dt>
                    <dd className="text-ink-900">{n.noticeType}</dd>
                    <dt className="text-ink-500">Issue Date</dt>
                    <dd className="text-ink-900">{formatDate(n.issueDate)}</dd>
                    <dt className="text-ink-500">Due Date</dt>
                    <dd className="text-ink-900">{formatDate(n.dueDate)}</dd>
                    <dt className="text-ink-500">Served Date</dt>
                    <dd className="text-ink-900">{formatDate(n.servedDate)}</dd>
                    <dt className="text-ink-500">Amount</dt>
                    <dd className="text-ink-900">{formatCurrency(n.demandAmount)}</dd>
                    <dt className="text-ink-500">Response</dt>
                    <dd className="text-ink-900">{n.responseReceived ? 'Received' : 'Pending'}</dd>
                  </dl>
                </Card>
              ))
            )}
          </div>
        )

      case 'inspections':
        return (
          <div className="space-y-3">
            {inspections.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No inspections scheduled</p>
            ) : (
              inspections.map(i => (
                <Card key={i.id} className="p-3" variant="outline">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink-900">{i.inspectionType}</span>
                    <Badge variant="outline" className="text-xs">{i.status}</Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-ink-500">Scheduled</dt>
                    <dd className="text-ink-900">{formatDate(i.scheduledDate)}</dd>
                    <dt className="text-ink-500">Completed</dt>
                    <dd className="text-ink-900">{formatDate(i.inspectionDate)}</dd>
                    <dt className="text-ink-500">Inspector</dt>
                    <dd className="text-ink-900">{i.inspectorName}</dd>
                    <dt className="text-ink-500">GIS Verified</dt>
                    <dd className="text-ink-900">{i.gisVerified ? 'Yes' : 'No'}</dd>
                    <dt className="text-ink-500">Area Discrepancy</dt>
                    <dd className="text-ink-900">{i.areaDiscrepancy ? `${i.areaDiscrepancy} sqft` : 'None'}</dd>
                    <dt className="text-ink-500">Assessment Change</dt>
                    <dd className="text-ink-900">{i.assessmentChangeRecommended ? 'Recommended' : 'Not Required'}</dd>
                  </dl>
                </Card>
              ))
            )}
          </div>
        )

      case 'dm_actions':
        return (
          <div className="space-y-2">
            <p className="text-sm text-ink-500">Available DM Actions for this property:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'view_property', label: 'View Property', icon: Home },
                { id: 'view_tax_history', label: 'View Tax History', icon: History },
                { id: 'view_arrears', label: 'View Arrears', icon: AlertTriangle },
                { id: 'schedule_inspection', label: 'Schedule Inspection', icon: ClipboardList },
                { id: 'initiate_reassessment', label: 'Initiate Reassessment', icon: Calculator },
                { id: 'issue_tax_notice', label: 'Issue Tax Notice', icon: FileText },
                { id: 'create_recovery', label: 'Create Recovery Action', icon: Gavel },
                { id: 'add_priority', label: 'Add to Priority Locations', icon: MapPin },
                { id: 'escalate', label: 'Escalate', icon: AlertTriangle },
                { id: 'open_gis', label: 'Open in GIS', icon: Map },
              ].map(action => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => onAction?.(action.id, property)}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'audit':
        return (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-ink-500 text-center py-4">No audit entries</p>
            ) : (
              auditLogs.map((log, i) => (
                <div key={i} className="p-3 bg-ink-50 rounded-lg border border-ink-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-900">{log.action}</span>
                    <span className="text-xs text-ink-400">{formatDate(log.timestamp)}</span>
                  </div>
                  <div className="text-xs text-ink-600">
                    {log.actor?.name || log.actor?.role || 'System'} — {log.reason || 'No reason provided'}
                  </div>
                  {log.oldValue && log.newValue && (
                    <div className="text-xs text-ink-500 mt-1 font-mono">
                      {JSON.stringify(log.oldValue)} → {JSON.stringify(log.newValue)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )

      default:
        return <p className="text-sm text-ink-500">Section content not implemented</p>
    }
  }
}

export default PropertyDrawer