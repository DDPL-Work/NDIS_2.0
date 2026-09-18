// Revenue & Property Intelligence — Arrears Page
// Arrears management, aging analysis, and recovery tracking

import { useState } from 'react'
import { useArrears } from '../hooks'
import { Card, Button, Badge, Select, DataTable, Tabs } from '../../../components/ui'
import { AlertTriangle, Gavel, Filter, Download, RefreshCw, Eye, Clock, TrendingUp } from 'lucide-react'
import { ARREARS_AGING, RECOVERY_STATUS, RECOVERY_STATUS_LABELS } from '../constants/revenueConstants'
import { formatCurrency, formatDate, formatIndianNumber } from '../utils/revenueFormatters'

export function ArrearsPage() {
  const [filters, setFilters] = useState({
    financialYear: '2025-26',
    agingBucket: '',
    recoveryStatus: '',
    blockId: '',
    searchQuery: '',
  })
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [activeTab, setActiveTab] = useState('arrears')

  const { data: arrearsData, isLoading, refetch } = useArrears({
    ...filters,
    page,
    pageSize,
  })

  const { data: recoveryData } = useArrears({ type: 'recovery', ...filters })

  const arrears = arrearsData?.data || []
  const recoveryActions = recoveryData?.data || []
  const pagination = arrearsData?.pagination || { count: 0, next: null, previous: null }
  const totalPages = Math.ceil(pagination.count / pageSize)

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, searchQuery: query, page: 1 }))
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  // Compute summary stats
  const totalArrears = arrears.reduce((sum, a) => sum + (a.totalArrears || 0), 0)
  const totalOutstanding = arrears.reduce((sum, a) => sum + (a.outstandingAmount || 0), 0)
  const totalPenalty = arrears.reduce((sum, a) => sum + (a.penaltyAmount || 0), 0)
  const totalInterest = arrears.reduce((sum, a) => sum + (a.interestAmount || 0), 0)
  const activeRecovery = recoveryActions.filter(r => !['settled', 'write_off'].includes(r.status)).length

  return (
    <div className="h-full flex flex-col bg-ink-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border-b border-ink-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Arrears & Recovery Management</h1>
          <p className="text-sm text-ink-500">
            {formatIndianNumber(pagination.count)} properties in arrears • Track aging and recovery actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filters.financialYear}
            onValueChange={v => setFilters(prev => ({ ...prev, financialYear: v }))}
            options={[
              { value: '2024-25', label: 'FY 2024-25' },
              { value: '2025-26', label: 'FY 2025-26 (Current)' },
            ]}
            className="w-48"
            placeholder="Financial Year"
          />
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="px-4 py-3 bg-white border-b border-ink-200">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <SummaryCard label="Total Arrears" value={formatCurrency(totalArrears, { compact: true })} icon={AlertTriangle} color="red" />
          <SummaryCard label="Outstanding Principal" value={formatCurrency(totalOutstanding, { compact: true })} icon={AlertTriangle} color="orange" />
          <SummaryCard label="Penalty" value={formatCurrency(totalPenalty, { compact: true })} icon={AlertTriangle} color="red" />
          <SummaryCard label="Interest" value={formatCurrency(totalInterest, { compact: true })} icon={AlertTriangle} color="amber" />
          <SummaryCard label="Properties in Arrears" value={formatIndianNumber(pagination.count)} icon={AlertTriangle} color="blue" />
          <SummaryCard label="Active Recovery Cases" value={activeRecovery} icon={Gavel} color="purple" />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 bg-white border-b border-ink-200">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by plot no, owner name..."
              className="w-full pl-10 pr-4 py-2 border border-ink-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Select
            value={filters.agingBucket}
            onValueChange={v => handleFilterChange({ agingBucket: v })}
            options={[
              { value: '', label: 'All Aging' },
              ...ARREARS_AGING.map(b => ({ value: b.id, label: b.label })),
            ]}
            className="w-40"
            placeholder="Aging Bucket"
          />
          <Select
            value={filters.recoveryStatus}
            onValueChange={v => handleFilterChange({ recoveryStatus: v })}
            options={[
              { value: '', label: 'All Recovery Status' },
              ...Object.entries(RECOVERY_STATUS).map(([key, value]) => ({ value, label: RECOVERY_STATUS_LABELS[value] })),
            ]}
            className="w-48"
            placeholder="Recovery Status"
          />
          <Select
            value={filters.blockId}
            onValueChange={v => handleFilterChange({ blockId: v })}
            options={[
              { value: '', label: 'All Blocks' },
              { value: 'silao', label: 'Silao' },
              { value: 'biharsharif', label: 'Bihar Sharif' },
              { value: 'harnaut', label: 'Harnaut' },
            ]}
            className="w-40"
            placeholder="Block"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabList className="flex gap-1 bg-white border border-ink-200 rounded-lg p-1 w-fit mb-4 px-4">
          <Tab value="arrears" className="px-4 py-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Arrears ({formatIndianNumber(pagination.count)})
          </Tab>
          <Tab value="aging" className="px-4 py-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Aging Analysis
          </Tab>
          <Tab value="recovery" className="px-4 py-2 flex items-center gap-1">
            <Gavel className="w-4 h-4" />
            Recovery ({recoveryActions.length})
          </Tab>
          <Tab value="top_defaulters" className="px-4 py-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Top Defaulters
          </Tab>
        </TabList>

        <TabPanels className="flex-1 overflow-y-auto p-4">
          <TabPanel value="arrears">
            <ArrearsList
              arrears={arrears}
              isLoading={isLoading}
              pagination={pagination}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onRefetch={refetch}
            />
          </TabPanel>

          <TabPanel value="aging">
            <AgingAnalysis arrears={arrears} />
          </TabPanel>

          <TabPanel value="recovery">
            <RecoveryList recoveryActions={recoveryActions} />
          </TabPanel>

          <TabPanel value="top_defaulters">
            <TopDefaulters arrears={arrears} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
  }
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-500">{label}</p>
          <p className="text-lg font-bold text-ink-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  )
}

function ArrearsList({ arrears, isLoading, pagination, page, totalPages, onPageChange, onRefetch }) {
  const columns = [
    { key: 'financialYear', header: 'FY', render: a => <span className="font-medium text-ink-900">{a.financialYear}</span> },
    { key: 'propertyPlotNo', header: 'Plot No', render: a => <span className="font-mono text-ink-900">{a.propertyPlotNo || '—'}</span> },
    { key: 'ownerName', header: 'Owner', render: a => <span className="text-ink-900 truncate max-w-[150px]">{a.ownerName || '—'}</span> },
    { key: 'agingBucket', header: 'Aging', render: a => {
      const bucket = ARREARS_AGING.find(b => b.id === a.agingBucket) || ARREARS_AGING[0]
      return <Badge className="text-xs" style={{ backgroundColor: `${bucket.color}15`, color: bucket.color, borderColor: `${bucket.color}40` }}>{bucket.label}</Badge>
    }},
    { key: 'yearsPending', header: 'Years', render: a => <span className="text-ink-700 text-center">{a.yearsPending}</span> },
    { key: 'originalDemand', header: 'Original Demand', render: a => <span className="text-ink-700">{formatCurrency(a.originalDemand, { compact: true })}</span> },
    { key: 'paidAmount', header: 'Paid', render: a => <span className="text-green-700">{formatCurrency(a.paidAmount, { compact: true })}</span> },
    { key: 'outstandingAmount', header: 'Outstanding', render: a => <span className="text-red-700">{formatCurrency(a.outstandingAmount, { compact: true })}</span> },
    { key: 'penaltyAmount', header: 'Penalty', render: a => <span className="text-red-700">{formatCurrency(a.penaltyAmount, { compact: true })}</span> },
    { key: 'interestAmount', header: 'Interest', render: a => <span className="text-amber-700">{formatCurrency(a.interestAmount, { compact: true })}</span> },
    { key: 'totalArrears', header: 'Total Arrears', render: a => <span className="text-red-700 font-bold">{formatCurrency(a.totalArrears)}</span> },
    { key: 'lastPaymentDate', header: 'Last Payment', render: a => <span className="text-ink-700">{formatDate(a.lastPaymentDate)}</span> },
    { key: 'recoveryStatus', header: 'Recovery', render: a => (
      <Badge variant="outline" className="text-xs" style={{
        backgroundColor: `${RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8'}15`,
        color: RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8',
        borderColor: `${RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8'}40`
      }}>
        {RECOVERY_STATUS_LABELS[a.recoveryStatus] || a.recoveryStatus}
      </Badge>
    )},
    { key: 'actions', header: 'Actions', render: a => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-4 h-4" /></Button>
        {a.recoveryStatus === 'initiated' && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-purple-600 hover:bg-purple-50"><Gavel className="w-4 h-4" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Card>
        <DataTable data={arrears} columns={columns} keyField="id" striped hoverable loading={isLoading} />
        {totalPages > 1 && (
          <div className="p-3 border-t border-ink-200 flex items-center justify-between">
            <span className="text-sm text-ink-500">Page {page} of {totalPages} • {formatIndianNumber(pagination.count)} total</span>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} showFirstLast maxButtons={5} />
          </div>
        )}
      </Card>
    </div>
  )
}

function AgingAnalysis({ arrears }) {
  const byAging = arrears.reduce((acc, a) => {
    const bucket = a.agingBucket || 'current'
    if (!acc[bucket]) acc[bucket] = { count: 0, totalArrears: 0, totalOutstanding: 0, properties: [] }
    acc[bucket].count++
    acc[bucket].totalArrears += a.totalArrears || 0
    acc[bucket].totalOutstanding += a.outstandingAmount || 0
    acc[bucket].properties.push(a)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ARREARS_AGING.map(bucket => {
          const data = byAging[bucket.id] || { count: 0, totalArrears: 0, totalOutstanding: 0 }
          return (
            <Card key={bucket.id} className="p-4 border-l-4" style={{ borderLeftColor: bucket.color }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-ink-900">{bucket.label}</span>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bucket.color }} />
              </div>
              <p className="text-2xl font-bold text-ink-900">{formatCurrency(data.totalArrears, { compact: true })}</p>
              <p className="text-sm text-ink-500">{data.count} properties</p>
              <p className="text-xs text-ink-500">Outstanding: {formatCurrency(data.totalOutstanding, { compact: true })}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ARREARS_AGING.map(bucket => {
          const data = byAging[bucket.id]
          if (!data || data.count === 0) return null
          return (
            <Card key={bucket.id} className="border-l-4" style={{ borderLeftColor: bucket.color }}>
              <div className="p-4 border-b border-ink-200">
                <h3 className="font-medium text-ink-900">{bucket.label} ({data.count} properties)</h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <DataTable
                  data={data.properties.slice(0, 20)}
                  columns={[
                    { key: 'propertyPlotNo', header: 'Plot', render: a => <span className="font-mono text-ink-900">{a.propertyPlotNo}</span> },
                    { key: 'ownerName', header: 'Owner', render: a => <span className="text-ink-700 truncate max-w-[120px]">{a.ownerName}</span> },
                    { key: 'yearsPending', header: 'Years', render: a => <span className="text-center">{a.yearsPending}</span> },
                    { key: 'totalArrears', header: 'Arrears', render: a => <span className="text-red-700 font-medium">{formatCurrency(a.totalArrears)}</span> },
                    { key: 'recoveryStatus', header: 'Recovery', render: a => (
                      <Badge variant="outline" className="text-xs" style={{
                        backgroundColor: `${RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8'}15`,
                        color: RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8',
                        borderColor: `${RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8'}40`
                      }}>
                        {RECOVERY_STATUS_LABELS[a.recoveryStatus] || a.recoveryStatus}
                      </Badge>
                    )},
                  ]}
                  keyField="id"
                  striped
                  hoverable
                />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function RecoveryList({ recoveryActions }) {
  if (recoveryActions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Gavel className="w-12 h-12 text-ink-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink-900 mb-2">No Recovery Actions</h3>
        <p className="text-ink-500">Recovery actions will appear here when initiated</p>
      </Card>
    )
  }

  const columns = [
    { key: 'actionType', header: 'Action', render: r => <span className="font-medium text-ink-900">{r.actionType?.replace('_', ' ')}</span> },
    { key: 'propertyPlotNo', header: 'Plot No', render: r => <span className="font-mono text-ink-900">{r.propertyPlotNo || '—'}</span> },
    { key: 'ownerName', header: 'Owner', render: r => <span className="text-ink-700">{r.ownerName || '—'}</span> },
    { key: 'actionDate', header: 'Date', render: r => <span className="text-ink-700">{formatDate(r.actionDate)}</span> },
    { key: 'actionBy', header: 'By', render: r => <span className="text-ink-700">{r.actionBy}</span> },
    { key: 'status', header: 'Status', render: r => (
      <Badge variant="outline" className="text-xs" style={{
        backgroundColor: `${RECOVERY_STATUS_COLORS[r.status] || '#94a3b8'}15`,
        color: RECOVERY_STATUS_COLORS[r.status] || '#94a3b8',
        borderColor: `${RECOVERY_STATUS_COLORS[r.status] || '#94a3b8'}40`
      }}>
        {RECOVERY_STATUS_LABELS[r.status] || r.status}
      </Badge>
    )},
    { key: 'nextActionDate', header: 'Next Action', render: r => <span className="text-ink-700">{formatDate(r.nextActionDate)}</span> },
    { key: 'nextActionType', header: 'Next Type', render: r => <span className="text-ink-700">{r.nextActionType?.replace('_', ' ') || '—'}</span> },
  ]

  return (
    <Card>
      <DataTable data={recoveryActions} columns={columns} keyField="id" striped hoverable />
    </Card>
  )
}

function TopDefaulters({ arrears }) {
  const topDefaulters = [...arrears]
    .sort((a, b) => (b.totalArrears || 0) - (a.totalArrears || 0))
    .slice(0, 50)

  const columns = [
    { key: 'rank', header: '#', render: (_, i) => <span className="font-bold text-ink-900">{i + 1}</span> },
    { key: 'propertyPlotNo', header: 'Plot No', render: a => <span className="font-mono text-ink-900">{a.propertyPlotNo || '—'}</span> },
    { key: 'ownerName', header: 'Owner', render: a => <span className="text-ink-900">{a.ownerName || '—'}</span> },
    { key: 'propertyType', header: 'Type', render: a => <Badge variant="outline" className="text-xs">{a.propertyType}</Badge> },
    { key: 'yearsPending', header: 'Years', render: a => <span className="text-center text-ink-700">{a.yearsPending}</span> },
    { key: 'agingBucket', header: 'Aging', render: a => {
      const bucket = ARREARS_AGING.find(b => b.id === a.agingBucket) || ARREARS_AGING[0]
      return <Badge className="text-xs" style={{ backgroundColor: `${bucket.color}15`, color: bucket.color, borderColor: `${bucket.color}40` }}>{bucket.label}</Badge>
    }},
    { key: 'totalArrears', header: 'Total Arrears', render: a => <span className="text-red-700 font-bold">{formatCurrency(a.totalArrears)}</span> },
    { key: 'recoveryStatus', header: 'Recovery', render: a => (
      <Badge variant="outline" className="text-xs" style={{
        backgroundColor: `${RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8'}15`,
        color: RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8',
        borderColor: `${RECOVERY_STATUS_COLORS[a.recoveryStatus] || '#94a3b8'}40`
      }}>
        {RECOVERY_STATUS_LABELS[a.recoveryStatus] || a.recoveryStatus}
      </Badge>
    )},
  ]

  return (
    <Card>
      <DataTable data={topDefaulters} columns={columns} keyField="id" striped hoverable />
    </Card>
  )
}

export default ArrearsPage