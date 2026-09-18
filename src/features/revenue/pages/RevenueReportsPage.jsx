// Revenue & Property Intelligence — Revenue Reports Page
// All standard revenue reports with generation and scheduling

import { useState } from 'react'
import { Card, Button, Select, Badge, Tabs, DataTable, Modal, Input } from '../../../components/ui'
import { FileDown, Calendar, Download, RefreshCw, Eye, Clock, Settings, Send } from 'lucide-react'
import { REVENUE_REPORT_TYPES, FINANCIAL_YEARS, EXPORT_FORMATS } from '../constants/revenueConstants'
import { formatCurrency, formatDate, formatIndianNumber } from '../utils/revenueFormatters'
import { revenueMockEngine } from '../mock/revenueMockEngine'


export function RevenueReportsPage() {
  const [filters, setFilters] = useState({
    financialYear: '2025-26',
    blockId: '',
    wardId: '',
    villageId: '',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedReport, setSelectedReport] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [activeTab, setActiveTab] = useState('standard')

  // Mock report history
  const reportHistory = [
    { id: 'rpt_001', type: 'property_register', name: 'Property Register', fy: '2025-26', generatedAt: '2025-01-15T10:30:00Z', status: 'completed', format: 'pdf', size: '2.4 MB' },
    { id: 'rpt_002', type: 'demand_register', name: 'Demand Register', fy: '2025-26', generatedAt: '2025-01-14T14:20:00Z', status: 'completed', format: 'excel', size: '1.8 MB' },
    { id: 'rpt_003', type: 'collection_register', name: 'Collection Register', fy: '2025-26', generatedAt: '2025-01-13T09:15:00Z', status: 'completed', format: 'pdf', size: '3.1 MB' },
    { id: 'rpt_004', type: 'arrears_register', name: 'Arrears Register', fy: '2025-26', generatedAt: '2025-01-12T16:45:00Z', status: 'completed', format: 'excel', size: '1.2 MB' },
    { id: 'rpt_005', type: 'revenue_gap_report', name: 'Revenue Gap Analysis', fy: '2025-26', generatedAt: '2025-01-11T11:00:00Z', status: 'completed', format: 'pdf', size: '850 KB' },
    { id: 'rpt_006', type: 'monthly_revenue_report', name: 'Monthly Revenue Report', fy: '2025-26', generatedAt: '2025-01-10T08:30:00Z', status: 'completed', format: 'pdf', size: '1.5 MB' },
    { id: 'rpt_007', type: 'block_revenue_report', name: 'Block Revenue Report', fy: '2025-26', generatedAt: '2025-01-09T12:00:00Z', status: 'completed', format: 'excel', size: '2.1 MB' },
    { id: 'rpt_008', type: 'gis_revenue_report', name: 'GIS Revenue Report', fy: '2025-26', generatedAt: '2025-01-08T15:30:00Z', status: 'completed', format: 'pdf', size: '4.2 MB' },
  ]

  return (
    <div className="h-full flex flex-col bg-ink-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border-b border-ink-200">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Revenue Reports</h1>
          <p className="text-sm text-ink-500">Generate, schedule, and download standard revenue reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filters.financialYear}
            onValueChange={v => setFilters(prev => ({ ...prev, financialYear: v }))}
            options={FINANCIAL_YEARS.map(fy => ({ value: fy.id, label: fy.label }))}
            className="w-48"
            placeholder="Financial Year"
          />
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4 bg-white border-b border-ink-200">
        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.blockId}
            onValueChange={v => setFilters(prev => ({ ...prev, blockId: v }))}
            options={[
              { value: '', label: 'All Blocks' },
              { value: 'silao', label: 'Silao' },
              { value: 'biharsharif', label: 'Bihar Sharif' },
              { value: 'harnaut', label: 'Harnaut' },
            ]}
            className="w-44"
            placeholder="Block"
          />
          <Select
            value={filters.wardId}
            onValueChange={v => setFilters(prev => ({ ...prev, wardId: v }))}
            options={[{ value: '', label: 'All Wards' }]}
            className="w-44"
            placeholder="Ward"
            disabled={!filters.blockId}
          />
          <Select
            value={filters.villageId}
            onValueChange={v => setFilters(prev => ({ ...prev, villageId: v }))}
            options={[{ value: '', label: 'All Villages' }]}
            className="w-44"
            placeholder="Village"
            disabled={!filters.wardId}
          />
          <div className="flex gap-2">
            <Input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} className="w-40" placeholder="From" />
            <Input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} className="w-40" placeholder="To" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabList className="flex gap-1 bg-white border border-ink-200 rounded-lg p-1 w-fit mb-4 px-4">
          <Tab value="standard" className="px-4 py-2">Standard Reports</Tab>
          <Tab value="analytics" className="px-4 py-2">Analytics Reports</Tab>
          <Tab value="history" className="px-4 py-2">Generation History</Tab>
          <Tab value="scheduled" className="px-4 py-2">Scheduled</Tab>
        </TabList>

        <TabPanels className="flex-1 overflow-y-auto p-4">
          {/* Standard Reports Tab */}
          <TabPanel value="standard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REVENUE_REPORT_TYPES
                .filter(r => r.category === 'registry' || r.category === 'demand' || r.category === 'collection')
                .map(report => (
                  <ReportCard key={report.id} report={report} onGenerate={() => handleGenerate(report)} />
                ))}
            </div>
          </TabPanel>

          {/* Analytics Reports Tab */}
          <TabPanel value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REVENUE_REPORT_TYPES
                .filter(r => r.category === 'analytics' || r.category === 'arrears' || r.category === 'assessment' || r.category === 'recovery')
                .map(report => (
                  <ReportCard key={report.id} report={report} onGenerate={() => handleGenerate(report)} />
                ))}
            </div>
          </TabPanel>

          {/* Generation History Tab */}
          <TabPanel value="history">
            <ReportHistoryTable reports={reportHistory} />
          </TabPanel>

          {/* Scheduled Reports Tab */}
          <TabPanel value="scheduled">
            <ScheduledReports />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setSelectedReport(null) }}
        report={selectedReport}
        filters={filters}
        onGenerate={handleGenerateConfirm}
      />
    </div>
  )

  function handleGenerate(report) {
    setSelectedReport(report)
    setShowGenerateModal(true)
  }

  function handleGenerateConfirm(reportType, generateFilters) {
    // Generate CSV export directly from mock properties
    const mockData = revenueMockEngine.getProperties({ limit: 1000 }).items;
    const csvRows = [
      ['Property ID', 'Holding Number', 'Owner Name', 'Block', 'Ward', 'Type', 'Demand', 'Paid', 'Outstanding', 'Arrears', 'Tax Status'],
      ...mockData.map(p => [
        p.propertyId,
        p.holdingNumber,
        `"${p.ownerName}"`,
        p.blockName,
        p.wardNumber,
        p.propertyType,
        p.annualDemand,
        p.paidAmount,
        p.outstandingAmount,
        p.arrearsAmount,
        p.taxStatus
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType || 'Revenue_Report'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowGenerateModal(false);
    setSelectedReport(null);
  }
}


function ReportCard({ report, onGenerate }) {
  const categoryColors = {
    registry: 'bg-blue-500',
    demand: 'bg-indigo-500',
    collection: 'bg-green-500',
    arrears: 'bg-red-500',
    assessment: 'bg-purple-500',
    recovery: 'bg-orange-500',
    analytics: 'bg-teal-500',
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onGenerate()}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[report.category] || 'bg-gray-500'}`}>
          <FileDown className="w-5 h-5 text-white" />
        </div>
        <Badge variant="outline" className="text-xs capitalize">{report.category}</Badge>
      </div>
      <h3 className="font-medium text-ink-900 mb-1">{report.label}</h3>
      <p className="text-sm text-ink-500 mb-3">
        {report.category === 'analytics' ? 'Analytical report with charts and trends' :
         report.category === 'registry' ? 'Complete property registry with details' :
         report.category === 'demand' ? 'Demand generation and tracking register' :
         report.category === 'collection' ? 'Payment collection and receipt register' :
         report.category === 'arrears' ? 'Outstanding arrears and aging analysis' :
         report.category === 'recovery' ? 'Recovery actions and case tracking' :
         'Standard revenue report'}
      </p>
      <div className="flex items-center justify-between pt-3 border-t border-ink-100">
        <span className="text-xs text-ink-400">Click to generate</span>
        <Button size="sm" variant="primary" onClick={e => { e.stopPropagation(); onGenerate() }} className="gap-1">
          <Download className="w-3.5 h-3.5" />
          Generate
        </Button>
      </div>
    </Card>
  )
}

function ReportHistoryTable({ reports }) {
  const columns = [
    { key: 'name', header: 'Report', render: r => <span className="font-medium text-ink-900">{r.name}</span> },
    { key: 'type', header: 'Type', render: r => <Badge variant="outline" className="text-xs">{r.type.replace(/_/g, ' ')}</Badge> },
    { key: 'fy', header: 'FY', render: r => <span className="text-ink-700">{r.fy}</span> },
    { key: 'generatedAt', header: 'Generated', render: r => <span className="text-ink-700">{formatDate(r.generatedAt)}</span> },
    { key: 'status', header: 'Status', render: r => (
      <Badge variant={r.status === 'completed' ? 'primary' : 'outline'} className="text-xs">
        {r.status === 'completed' ? 'Ready' : r.status}
      </Badge>
    )},
    { key: 'format', header: 'Format', render: r => <span className="text-ink-700 text-uppercase">{r.format}</span> },
    { key: 'size', header: 'Size', render: r => <span className="text-ink-700">{r.size}</span> },
    { key: 'actions', header: 'Actions', render: r => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Download className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="w-4 h-4" /></Button>
      </div>
    )},
  ]

  return (
    <Card>
      <DataTable data={reports} columns={columns} keyField="id" striped hoverable />
    </Card>
  )
}

function ScheduledReports() {
  return (
    <Card className="p-8 text-center">
      <Clock className="w-12 h-12 text-ink-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-ink-900 mb-2">Scheduled Reports</h3>
      <p className="text-ink-500 mb-4">Configure automated report generation and delivery</p>
      <Button variant="primary" className="gap-1">
        <Settings className="w-4 h-4" />
        Configure Schedule
      </Button>
    </Card>
  )
}

function GenerateReportModal({ isOpen, onClose, report, filters, onGenerate }) {
  if (!isOpen || !report) return null

  const [formData, setFormData] = useState({
    format: 'pdf',
    includeCharts: true,
    includeMaps: false,
    emailDelivery: false,
    emailRecipients: '',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generate: ${report.label}`} size="lg">
      <form className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Financial Year</label>
            <Select
              value={filters.financialYear}
              onValueChange={v => setFilters(prev => ({ ...prev, financialYear: v }))}
              options={FINANCIAL_YEARS.map(fy => ({ value: fy.id, label: fy.label }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Format</label>
            <Select
              value={formData.format}
              onValueChange={v => setFormData(prev => ({ ...prev, format: v }))}
              options={EXPORT_FORMATS.map(f => ({ value: f.id, label: f.label }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Block</label>
            <Select
              value={filters.blockId}
              onValueChange={v => setFilters(prev => ({ ...prev, blockId: v }))}
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
              value={filters.wardId}
              onValueChange={v => setFilters(prev => ({ ...prev, wardId: v }))}
              options={[{ value: '', label: 'All Wards' }]}
              disabled={!filters.blockId}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Date From</label>
            <Input type="date" value={filters.dateFrom} onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Date To</label>
            <Input type="date" value={filters.dateTo} onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-2 border-t border-ink-200 pt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.includeCharts} onChange={e => setFormData(prev => ({ ...prev, includeCharts: e.target.checked }))} className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-ink-700">Include Charts & Visualizations</span>
          </label>
          {report.category === 'analytics' && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.includeMaps} onChange={e => setFormData(prev => ({ ...prev, includeMaps: e.target.checked }))} className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-ink-700">Include GIS Maps</span>
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={formData.emailDelivery} onChange={e => setFormData(prev => ({ ...prev, emailDelivery: e.target.checked }))} className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-ink-700">Email Delivery</span>
          </label>
          {formData.emailDelivery && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-ink-700 mb-1">Email Recipients (comma separated)</label>
              <Input value={formData.emailRecipients} onChange={e => setFormData(prev => ({ ...prev, emailRecipients: e.target.value }))} placeholder="user1@domain.com, user2@domain.com" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-ink-200">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" onClick={() => onGenerate(report.id, { ...filters, ...formData })}>
            Generate Report
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default RevenueReportsPage