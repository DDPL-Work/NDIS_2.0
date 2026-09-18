// Revenue & Property Intelligence — Property Intelligence 360° View
// Main component that consolidates all property information into a unified view

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../../app/store/authStore'
import { useProperty } from '../hooks/useProperties'
import { usePropertyAssessment, usePropertyTaxHistory, usePropertyNotices, usePropertyInspections, usePropertyAudit } from '../hooks/useProperties'
import { usePropertyTimeline } from '../hooks/useTimelineRiskCompliance'
import { usePropertyRisk } from '../hooks/useTimelineRiskCompliance'
import { usePropertyCompliance } from '../hooks/useTimelineRiskCompliance'
import {
  useSchedulePropertyInspection,
  useScheduleReassessment,
  useIssueTaxNotice,
  useCreateRecoveryAction,
} from '../hooks/useTimelineRiskCompliance'
import {
  PropertyTimeline,
  PropertyTimelineCompact,
} from './PropertyTimeline'
import { RiskModel } from './RiskModel'
import { PropertyActions } from './PropertyActions'
import { PropertyIntelligenceTabs } from './PropertyIntelligenceTabs'
import { Card, Button, Badge, Tabs, Skeleton, Alert, Select } from '../../../../components/ui'
import { ArrowLeft, Download, Print, ExternalLink, RefreshCw, AlertTriangle, AlertCircle, Info, MapPin, Calculator, FileText, CreditCard, History, Bell, ClipboardList, Gavel, Map, Shield, Clock, Eye, Edit, Trash2, Plus, Send, Settings, Zap, ZapOff } from 'lucide-react'
import { formatCurrency, formatArea, formatDate, formatDateTime, truncate } from '../utils/revenueFormatters'
import { TAX_STATUS, TAX_STATUS_LABELS, TAX_STATUS_COLORS, PROPERTY_TYPES, REVENUE_TASK_TYPES } from '../constants/revenueConstants'
import { formatCurrency as formatCurrencyUtil, formatArea as formatAreaUtil, formatDate as formatDateUtil, formatDateTime as formatDateTimeUtil, truncate as truncateUtil } from '../utils/revenueFormatters'

const TAB_CONFIG = [
  { id: 'overview', label: 'Overview', icon: 'Home', badge: null },
  { id: 'identity', label: 'Identity', icon: 'FileText', badge: null },
  { id: 'location', label: 'Location', icon: 'MapPin', badge: null },
  { id: 'gis', label: 'GIS', icon: 'Map', badge: null },
  { id: 'assessment', label: 'Assessment', icon: 'Calculator', badge: 'assessments' },
  { id: 'demand', label: 'Demand', icon: 'FileText', badge: 'demands' },
  { id: 'payment', label: 'Payments', icon: 'CreditCard', badge: 'payments' },
  { id: 'arrears', label: 'Arrears', icon: 'AlertTriangle', badge: 'arrears' },
  { id: 'timeline', label: 'Timeline', icon: 'History', badge: 'events' },
  { id: 'risk', label: 'Risk', icon: 'AlertTriangle', badge: 'risk' },
  { id: 'compliance', label: 'Compliance', icon: 'Shield', badge: 'status' },
  { id: 'notices', label: 'Notices', icon: 'Bell', badge: 'notices' },
  { id: 'inspections', label: 'Inspections', icon: 'ClipboardList', badge: 'inspections' },
  { id: 'reassessment', label: 'Reassessment', icon: 'Calculator', badge: 'reassessments' },
  { id: 'recovery', label: 'Recovery', icon: 'Gavel', badge: 'recovery' },
  { id: 'audit', label: 'Audit', icon: 'Shield', badge: 'logs' },
]

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: '#22c55e' },
  due: { label: 'Due', color: '#ef4444' },
  partial: { label: 'Partial', color: '#f97316' },
  arrears: { label: 'Arrears', color: '#dc2626' },
  exempt: { label: 'Exempt', color: '#3b82f6' },
  disputed: { label: 'Disputed', color: '#a855f7' },
}

const PROPERTY_TYPE_COLORS = {
  residential: '#22c55e',
  commercial: '#3b82f6',
  industrial: '#f97316',
  agricultural: '#84cc16',
  institutional: '#a855f7',
  vacant_land: '#94a3b8',
}

const TAX_STATUS_LABELS_LOCAL = {
  paid: 'Paid',
  due: 'Due',
  partial: 'Partial',
  arrears: 'Arrears',
  exempt: 'Exempt',
  disputed: 'Disputed',
}

const TAX_STATUS_COLORS_LOCAL = {
  paid: '#22c55e',
  due: '#ef4444',
  partial: '#f97316',
  arrears: '#dc2626',
  exempt: '#3b82f6',
  disputed: '#a855f7',
}

export function PropertyIntelligenceView({
  propertyId,
  initialProperty,
  onBack,
  className = '',
}) {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const userRole = user?.role
  const isDM = ['dm', 'district_collector', 'adm', 'state_admin', 'state_finance_admin', 'system_admin'].includes(userRole)
  const isRevenueOfficer = ['revenue_officer', 'revenue_inspector', 'revenue_admin'].includes(userRole)
  const canManage = isDM || isRevenueOfficer

  // Fetch property data
  const { data: propertyData, isLoading: propertyLoading, error: propertyError, refetch: refetchProperty } = useProperty(propertyId, !!propertyId)
  const property = initialProperty || propertyData

  // Fetch related data
  const { data: assessments, isLoading: assessmentsLoading } = usePropertyAssessments(propertyId)
  const { data: demands, isLoading: demandsLoading } = usePropertyTaxHistory(propertyId) // Using tax history for demands
  const { data: payments } = usePropertyTaxHistory(propertyId) // Reuse for payments
  const { data: notices, isLoading: noticesLoading } = usePropertyNotices(propertyId)
  const { data: inspections, isLoading: inspectionsLoading } = usePropertyInspections(propertyId)
  const { data: auditLogs } = usePropertyAudit(propertyId)

  // New hooks for intelligence
  const { data: timelineEvents, isLoading: timelineLoading } = usePropertyTimeline(propertyId)
  const { data: riskData, isLoading: riskLoading } = usePropertyRisk(propertyId)
  const { data: complianceData, isLoading: complianceLoading } = usePropertyCompliance(propertyId)

  // Mutations
  const scheduleInspection = useSchedulePropertyInspection()
  const scheduleReassessment = useScheduleReassessment()
  const issueNotice = useIssueTaxNotice()
  const createRecovery = useCreateRecoveryAction()

  const [activeTab, setActiveTab] = useState('overview')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    refetchProperty()
  }, [refetchProperty])

  const handleAction = useCallback(async (action, prop) => {
    switch (action) {
      case 'view_tax':
      case 'view_history':
        setActiveTab('timeline')
        break
      case 'schedule_inspection':
        // Open inspection scheduling modal
        break
      case 'reassess':
      case 'initiate_reassessment':
        setActiveTab('reassessment')
        break
      case 'issue_notice':
      case 'issue_tax_notice':
        setActiveTab('notices')
        break
      case 'recovery':
      case 'create_recovery':
        setActiveTab('recovery')
        break
      case 'add_priority':
        // Add to priority locations
        break
      case 'escalate':
        // Escalate to higher authority
        break
      case 'open_gis':
        // Open in GIS view
        navigate(`/admin/situation-matrix?property=${propertyId}`)
        break
      case 'export':
        // Export property data
        break
      case 'print':
        window.print()
        break
      case 'audit':
        setActiveTab('audit')
        break
      case 'view_geometry':
        // Open geometry viewer
        break
      case 'view_tax':
        setActiveTab('assessment')
        break
      case 'view_arrears':
        setActiveTab('arrears')
        break
      default:
        console.log('Action:', action)
    }
  }, [])

  const taxStatus = property?.taxStatus || 'due'
  const statusConfig = {
    label: TAX_STATUS_LABELS_LOCAL[taxStatus] || taxStatus,
    color: TAX_STATUS_COLORS_LOCAL[taxStatus] || '#94a3b8',
  }

  const totalArrears = useMemo(() => {
    if (!demands) return 0
    return demands.reduce((sum, d) => sum + (d.outstandingAmount || 0), 0)
  }, [demands])

  const totalDemand = useMemo(() => {
    if (!demands) return 0
    return demands.reduce((sum, d) => sum + (d.netDemand || 0), 0)
  }, [demands])

  const totalPaid = useMemo(() => {
    if (!demands) return 0
    return demands.reduce((sum, d) => sum + (d.paidAmount || 0), 0)
  }, [demands])

  const collectionRate = totalDemand > 0 ? ((totalPaid / totalDemand) * 100).toFixed(1) : 0

  // Loading state
  const isLoading = propertyLoading || assessmentsLoading || demandsLoading || noticesLoading || inspectionsLoading || timelineLoading || riskLoading || complianceLoading

  if (isLoading && !property) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <div className="p-4 bg-white border-b border-ink-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (propertyError || !property) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-ink-50">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 mb-2">Property Not Found</h2>
        <p className="text-ink-500 mb-4">The requested property could not be found.</p>
        <Button variant="primary" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Registry
        </Button>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border-b border-ink-200 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">
              {property.plotNo || property.houseNo || `Property #${propertyId}`}
            </h1>
            <p className="text-sm text-ink-500">{property.ownerName || 'Unknown Owner'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            className="text-xs px-2 py-1"
            style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color, borderColor: `${statusConfig.color}40` }}
          >
            {statusConfig.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {PROPERTY_TYPES.find(t => t.id === property.propertyType)?.label || property.propertyType}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleAction('export', property)} className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="px-4 py-3 bg-ink-50 border-b border-ink-200">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard title="Current Demand" value={formatCurrencyUtil(totalDemand)} icon="FileText" color="blue" trend={totalDemand > 0 ? 'up' : 'neutral'} />
          <StatCard title="Total Collected" value={formatCurrencyUtil(totalPaid)} icon="CheckCircle" color="green" trend="up" />
          <StatCard title="Outstanding" value={formatCurrencyUtil(totalArrears)} icon="AlertTriangle" color="orange" trend={totalArrears > 0 ? 'down' : 'neutral'} />
          <StatCard title="Collection Rate" value={`${collectionRate}%`} icon="TrendingUp" color="green" trend={collectionRate >= 80 ? 'up' : 'neutral'} />
          <StatCard title="Arrears" value={formatCurrencyUtil(totalArrears)} icon="AlertTriangle" color="red" trend={totalArrears > 0 ? 'down' : 'neutral'} />
          <StatCard title="Compliance" value={complianceData?.overallStatus || '—'} icon="Shield" color={complianceData?.isCompliant ? 'green' : 'orange'} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PropertyIntelligenceTabs
          property={property}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          assessments={assessments}
          demands={demands}
          payments={payments}
          notices={notices}
          inspections={inspections}
          timelineEvents={timelineEvents}
          riskData={riskData}
          complianceData={complianceData}
          auditLogs={auditLogs}
          isLoading={isLoading}
          onAction={handleAction}
          canManage={canManage}
          userRole={userRole}
        />
      </div>
    </div>
  )
}

// Helper StatCard component
function StatCard({ title, value, icon: Icon, color, trend }) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600' },
  }
  const c = colors[color] || colors.blue
  const trendIcons = { up: '↑', down: '↓', neutral: '→' }
  const trendColors = { up: 'text-green-600', down: 'text-red-600', neutral: 'text-ink-400' }

  return (
    <div className={`p-3 rounded-lg ${c.bg} border border-ink-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-500">{title}</p>
          <p className="text-lg font-bold text-ink-900">{value}</p>
        </div>
        <div className="flex items-center gap-1">
          <Icon className={`w-5 h-5 ${c.icon}`} />
          <span className={`text-xs ${trendColors[trend] || 'text-ink-400'}`}>{trendIcons[trend] || '—'}</span>
        </div>
      </div>
    </div>
  )
}

export default PropertyIntelligenceView