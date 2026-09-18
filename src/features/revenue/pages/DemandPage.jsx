// Revenue & Property Intelligence — Demand Page
// Demand generation, history, and management

import { useState } from 'react'
import { useDemands } from '../hooks'
import { Card, Button, Badge, Select, DataTable, Modal, Tabs } from '../../../components/ui'
import { FileText, Plus, Search, RefreshCw, Download, Eye, Send, Edit, AlertTriangle } from 'lucide-react'
import { FINANCIAL_YEARS, DEMAND_STATUS, DEMAND_STATUS_LABELS } from '../constants/revenueConstants'
import { formatCurrency, formatDate, formatIndianNumber } from '../utils/revenueFormatters'

export function DemandPage() {
  const [filters, setFilters] = useState({
    financialYear: '2025-26',
    status: '',
    blockId: '',
    searchQuery: '',
  })
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedDemandId, setSelectedDemandId] = useState(null)

  const { data: demandsData, isLoading, refetch } = useDemands({
    ...filters,
    page,
    pageSize,
  })

  const demands = demandsData?.data || []
  const pagination = demandsData?.pagination || { count: 0, next: null, previous: null }
  const totalPages = Math.ceil(pagination.count / pageSize)

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, searchQuery: query, page: 1 }))
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  return (
    <div className="h-full flex flex-col bg-ink-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border-b border-ink-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Tax Demand Management</h1>
          <p className="text-sm text-ink-500">
            {formatIndianNumber(pagination.count)} demands • Generate and manage property tax demands
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filters.financialYear}
            onValueChange={v => setFilters(prev => ({ ...prev, financialYear: v }))}
            options={FINANCIAL_YEARS.map(fy => ({ value: fy.id, label: fy.label }))}
            className="w-48"
            placeholder="Financial Year"
          />
          <Select
            value={filters.status}
            onValueChange={v => setFilters(prev => ({ ...prev, status: v }))}
            options={[
              { value: '', label: 'All Status' },
              ...Object.entries(DEMAND_STATUS).map(([key, value]) => ({ value, label: DEMAND_STATUS_LABELS[value] })),
            ]}
            className="w-40"
            placeholder="Status"
          />
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            Generate Demand
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 bg-white border-b border-ink-200">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by plot no, owner name, demand no..."
              className="w-full pl-10 pr-4 py-2 border border-ink-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Select
            value={filters.blockId}
            onValueChange={v => handleFilterChange({ blockId: v })}
            options={[
              { value: '', label: 'All Blocks' },
              { value: 'silao', label: 'Silao' },
              { value: 'biharsharif', label: 'Bihar Sharif' },
              { value: 'harnaut', label: 'Harnaut' },
            ]}
            className="w-44"
            placeholder="Block"
          />
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <TabList className="flex gap-1 bg-white border border-ink-200 rounded-lg p-1 w-fit mb-4 px-4">
          <Tab value="list" className="px-4 py-2">Demand List ({formatIndianNumber(pagination.count)})</Tab>
          <Tab value="generation" className="px-4 py-2">Generation History</Tab>
          <Tab value="by_property" className="px-4 py-2">By Property</Tab>
        </TabList>

        <TabPanels className="flex-1 overflow-y-auto p-4">
          <TabPanel value="list">
            <DemandsList
              demands={demands}
              isLoading={isLoading}
              pagination={pagination}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onSelect={setSelectedDemandId}
              onRefetch={refetch}
            />
          </TabPanel>

          <TabPanel value="generation">
            <GenerationHistory onRefetch={refetch} />
          </TabPanel>

          <TabPanel value="by_property">
            <DemandByProperty onRefetch={refetch} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Generate Demand Modal */}
      <GenerateDemandModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        financialYear={filters.financialYear}
      />

      {/* Demand Detail Modal */}
      {selectedDemandId && (
        <DemandDetailModal
          demand={demands.find(d => d.id === selectedDemandId)}
          onClose={() => setSelectedDemandId(null)}
        />
      )}
    </div>
  )
}

function DemandsList({ demands, isLoading, pagination, page, totalPages, onPageChange, onSelect, onRefetch }) {
  const columns = [
    { key: 'demandNumber', header: 'Demand No', render: d => <span className="font-mono text-ink-900">{d.demandNumber || '—'}</span> },
    { key: 'financialYear', header: 'FY', render: d => <span className="font-medium text-ink-900">{d.financialYear}</span> },
    { key: 'propertyPlotNo', header: 'Plot No', render: d => <span className="font-mono text-ink-900">{d.propertyPlotNo || '—'}</span> },
    { key: 'ownerName', header: 'Owner', render: d => <span className="text-ink-900 truncate max-w-[150px]">{d.ownerName || '—'}</span> },
    { key: 'netDemand', header: 'Net Demand', render: d => <span className="text-ink-900 font-medium">{formatCurrency(d.netDemand)}</span> },
    { key: 'paidAmount', header: 'Paid', render: d => <span className="text-green-700">{formatCurrency(d.paidAmount)}</span> },
    { key: 'outstandingAmount', header: 'Outstanding', render: d => <span className="text-red-700">{formatCurrency(d.outstandingAmount)}</span> },
    { key: 'status', header: 'Status', render: d => (
      <Badge variant="outline" className="text-xs">
        {DEMAND_STATUS_LABELS[d.status] || d.status}
      </Badge>
    )},
    { key: 'dueDate', header: 'Due Date', render: d => <span className="text-ink-700">{formatDate(d.dueDate)}</span> },
    { key: 'noticeSentDate', header: 'Notice Sent', render: d => <span className="text-ink-700">{formatDate(d.noticeSentDate)}</span> },
    { key: 'actions', header: 'Actions', render: d => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onSelect(d.id)}><Eye className="w-4 h-4" /></Button>
        {d.outstandingAmount > 0 && d.status !== 'cancelled' && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:bg-green-50" onClick={() => {}}><Send className="w-4 h-4" /></Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <Card>
        <DataTable data={demands} columns={columns} keyField="id" onRowClick={onSelect} striped hoverable loading={isLoading} />
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

function GenerationHistory({ onRefetch }) {
  return (
    <Card className="p-8 text-center">
      <FileText className="w-12 h-12 text-ink-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-ink-900 mb-2">Demand Generation History</h3>
      <p className="text-ink-500 mb-4">Track all demand generation runs</p>
      <Button variant="outline" onClick={onRefetch}>Refresh</Button>
    </Card>
  )
}

function DemandByProperty({ onRefetch }) {
  return (
    <Card className="p-8 text-center">
      <Search className="w-12 h-12 text-ink-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-ink-900 mb-2">Demand by Property</h3>
      <p className="text-ink-500 mb-4">View demand details for a specific property</p>
      <Button variant="outline" onClick={onRefetch}>Refresh</Button>
    </Card>
  )
}

function GenerateDemandModal({ isOpen, onClose, financialYear }) {
  if (!isOpen) return null

  const [formData, setFormData] = useState({
    generateForAll: false,
    blockId: '',
    wardId: '',
    villageId: '',
    propertyIds: '',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generate Demand - ${financialYear}`} size="lg">
      <form className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="generateForAll" checked={formData.generateForAll} onChange={e => setFormData(prev => ({ ...prev, generateForAll: e.target.checked }))} className="w-4 h-4 text-blue-600" />
          <label htmlFor="generateForAll" className="text-sm text-ink-700">Generate for all properties in district</label>
        </div>
        {!formData.generateForAll && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Block</label>
              <Select
                value={formData.blockId}
                onValueChange={v => setFormData(prev => ({ ...prev, blockId: v }))}
                options={[
                  { value: '', label: 'All Blocks' },
                  { value: 'silao', label: 'Silao' },
                  { value: 'biharsharif', label: 'Bihar Sharif' },
                  { value: 'harnaut', label: 'Harnaut' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Ward</label>
              <Select
                value={formData.wardId}
                onValueChange={v => setFormData(prev => ({ ...prev, wardId: v }))}
                options={[{ value: '', label: 'All Wards' }]}
                disabled={!formData.blockId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Village</label>
              <Select
                value={formData.villageId}
                onValueChange={v => setFormData(prev => ({ ...prev, villageId: v }))}
                options={[{ value: '', label: 'All Villages' }]}
                disabled={!formData.wardId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Property IDs (comma separated)</label>
              <Input
                value={formData.propertyIds}
                onChange={e => setFormData(prev => ({ ...prev, propertyIds: e.target.value }))}
                placeholder="PROP001, PROP002, PROP003"
              />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4 border-t border-ink-200">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Generate Demand</Button>
        </div>
      </form>
    </Modal>
  )
}

function DemandDetailModal({ demand, onClose }) {
  if (!demand) return null

  return (
    <Modal isOpen={true} onClose={onClose} title={`Demand: ${demand.demandNumber}`} size="lg">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
          <h3 className="font-medium text-ink-900">FY {demand.financialYear} • {demand.propertyPlotNo}</h3>
          <Badge variant="outline">{DEMAND_STATUS_LABELS[demand.status] || demand.status}</Badge>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <dt className="text-ink-500">Net Demand</dt>
          <dd className="text-ink-900 font-bold text-lg">{formatCurrency(demand.netDemand)}</dd>
          <dt className="text-ink-500">Annual Demand</dt>
          <dd className="text-ink-900">{formatCurrency(demand.annualDemand)}</dd>
          <dt className="text-ink-500">Rebate</dt>
          <dd className="text-green-700">-{formatCurrency(demand.rebateAmount)}</dd>
          <dt className="text-ink-500">Penalty</dt>
          <dd className="text-red-700">+{formatCurrency(demand.penaltyAmount)}</dd>
          <dt className="text-ink-500">Paid</dt>
          <dd className="text-green-700 font-medium">{formatCurrency(demand.paidAmount)}</dd>
          <dt className="text-ink-500">Outstanding</dt>
          <dd className="text-red-700 font-medium">{formatCurrency(demand.outstandingAmount)}</dd>
          <dt className="text-ink-500">Collection Rate</dt>
          <dd className="text-ink-900 font-medium">
            {demand.netDemand > 0 ? `${((demand.paidAmount / demand.netDemand) * 100).toFixed(1)}%` : 'N/A'}
          </dd>
          <dt className="text-ink-500">Due Date</dt>
          <dd className="text-ink-900">{formatDate(demand.dueDate)}</dd>
          <dt className="text-ink-500">Notice Sent</dt>
          <dd className="text-ink-900">{formatDate(demand.noticeSentDate)}</dd>
          <dt className="text-ink-500">Generated By</dt>
          <dd className="text-ink-900">{demand.generatedBy}</dd>
          <dt className="text-ink-500">Approved By</dt>
          <dd className="text-ink-900">{demand.approvedBy || '—'}</dd>
        </dl>
      </div>
    </Modal>
  )
}

export default DemandPage