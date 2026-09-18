// Revenue & Property Intelligence — Assessment Page
// Assessment management with tax rules configuration

import { useState } from 'react'
import { useAssessments, useTaxRules } from '../hooks'
import { Card, Button, Badge, Select, Tabs, DataTable, Modal } from '../../../components/ui'
import { Search, Calculator, Settings, Plus, Edit, Eye, Filter, Download, RefreshCw } from 'lucide-react'
import { PROPERTY_TYPES, USAGE_TYPES, CONSTRUCTION_TYPES, FINANCIAL_YEARS } from '../constants/revenueConstants'
import { formatCurrency, formatArea, formatIndianNumber } from '../utils/revenueFormatters'

export function AssessmentPage() {
  const [filters, setFilters] = useState({
    financialYear: '2025-26',
    propertyType: '',
    searchQuery: '',
  })
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: assessmentsData, isLoading, refetch } = useAssessments({
    ...filters,
    page,
    pageSize,
  })
  const { data: rulesData, isLoading: rulesLoading } = useTaxRules()

  const assessments = assessmentsData?.data || []
  const rules = rulesData || []
  const pagination = assessmentsData?.pagination || { count: 0, next: null, previous: null }
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
          <h1 className="text-xl font-semibold text-ink-900">Assessment Management</h1>
          <p className="text-sm text-ink-500">
            {formatIndianNumber(pagination.count)} assessments • Configure tax rules and review assessments
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
            value={filters.propertyType}
            onValueChange={v => setFilters(prev => ({ ...prev, propertyType: v }))}
            options={[
              { value: '', label: 'All Types' },
              ...PROPERTY_TYPES.map(t => ({ value: t.id, label: t.label })),
            ]}
            className="w-40"
            placeholder="Property Type"
          />
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditingRule(null); setShowRuleModal(true) }} className="gap-1">
            <Plus className="w-4 h-4" />
            Add Tax Rule
          </Button>
        </div>
      </div>

      {/* Backend Integration Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200 p-3 px-4 flex items-center justify-between text-xs text-amber-900">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <strong>System Notice:</strong> Detailed Property Assessment & Tax Rules endpoints are awaiting backend API deployment. Showing register records from <code>/api/gis/tax-list/</code>.
        </span>
      </div>


      {/* Tabs */}
      <Tabs defaultValue="assessments" className="flex-1 flex flex-col">
        <TabList className="flex gap-1 bg-white border border-ink-200 rounded-lg p-1 w-fit mb-4 px-4">
          <Tab value="assessments" className="px-4 py-2">Assessments ({formatIndianNumber(pagination.count)})</Tab>
          <Tab value="rules" className="px-4 py-2">Tax Rules ({rules.length})</Tab>
          <Tab value="pending" className="px-4 py-2">Pending Review</Tab>
        </TabList>

        <TabPanels className="flex-1 overflow-y-auto p-4">
          {/* Assessments Tab */}
          <TabPanel value="assessments">
            <AssessmentsList
              assessments={assessments}
              isLoading={isLoading}
              pagination={pagination}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onSelect={setSelectedAssessmentId}
              onRefetch={refetch}
            />
          </TabPanel>

          {/* Tax Rules Tab */}
          <TabPanel value="rules">
            <TaxRulesList
              rules={rules}
              isLoading={rulesLoading}
              onEdit={setEditingRule}
              onView={rule => { setEditingRule(rule); setShowRuleModal(true) }}
              onAdd={() => { setEditingRule(null); setShowRuleModal(true) }}
            />
          </TabPanel>

          {/* Pending Review Tab */}
          <TabPanel value="pending">
            <PendingReviewList onRefetch={refetch} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Tax Rule Modal */}
      <TaxRuleModal
        isOpen={showRuleModal}
        onClose={() => { setShowRuleModal(false); setEditingRule(null) }}
        rule={editingRule}
        onSave={handleRuleSave}
      />

      {/* Assessment Detail Modal */}
      {selectedAssessmentId && (
        <AssessmentDetailModal
          assessment={assessments.find(a => a.id === selectedAssessmentId)}
          onClose={() => setSelectedAssessmentId(null)}
        />
      )}
    </div>
  )

  function handleRuleSave(ruleData) {
    // Save rule via API
    setShowRuleModal(false)
    setEditingRule(null)
  }
}

function AssessmentsList({ assessments, isLoading, pagination, page, totalPages, onPageChange, onSelect, onRefetch }) {
  const columns = [
    { key: 'financialYear', header: 'FY', render: a => <span className="font-medium text-ink-900">{a.financialYear}</span> },
    { key: 'propertyPlotNo', header: 'Plot No', render: a => <span className="font-mono text-ink-900">{a.propertyPlotNo || '—'}</span> },
    { key: 'propertyType', header: 'Type', render: a => <Badge variant="outline" className="text-xs">{a.propertyType}</Badge> },
    { key: 'usageType', header: 'Usage', render: a => <span className="text-ink-700">{a.usageType}</span> },
    { key: 'constructionType', header: 'Construction', render: a => <span className="text-ink-700">{a.constructionType}</span> },
    { key: 'landAreaSqft', header: 'Land Area', render: a => <span className="text-ink-700">{formatArea(a.landAreaSqft)}</span> },
    { key: 'builtUpAreaSqft', header: 'Built-up', render: a => <span className="text-ink-700">{formatArea(a.builtUpAreaSqft)}</span> },
    { key: 'taxableAreaSqft', header: 'Taxable Area', render: a => <span className="text-ink-700">{formatArea(a.taxableAreaSqft)}</span> },
    { key: 'baseRatePerSqft', header: 'Rate/sqft', render: a => <span className="text-ink-900">{formatCurrency(a.baseRatePerSqft)}/sqft</span> },
    { key: 'applicableRuleName', header: 'Rule', render: a => <span className="text-ink-700 truncate max-w-[120px]">{a.applicableRuleName}</span> },
    { key: 'annualTax', header: 'Annual Tax', render: a => <span className="text-ink-900 font-medium">{formatCurrency(a.annualTax)}</span> },
    { key: 'status', header: 'Status', render: a => <Badge variant="outline" className="text-xs">{a.status}</Badge> },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <DataTable
          data={assessments}
          columns={columns}
          keyField="id"
          onRowClick={onSelect}
          striped
          hoverable
          loading={isLoading}
        />
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

function TaxRulesList({ rules, isLoading, onEdit, onView, onAdd }) {
  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading tax rules...</div>
  }

  if (rules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Calculator className="w-12 h-12 text-ink-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-ink-900 mb-2">No Tax Rules Configured</h3>
        <p className="text-ink-500 mb-4">Create tax rules to define assessment calculations for different property types</p>
        <Button onClick={onAdd} className="gap-1">
          <Plus className="w-4 h-4" />
          Create First Rule
        </Button>
      </Card>
    )
  }

  const columns = [
    { key: 'code', header: 'Code', render: r => <span className="font-mono text-ink-900">{r.code}</span> },
    { key: 'name', header: 'Rule Name', render: r => <span className="font-medium text-ink-900">{r.name}</span> },
    { key: 'propertyType', header: 'Property Type', render: r => <Badge variant="outline" className="text-xs">{r.propertyType === 'all' ? 'All' : r.propertyType}</Badge> },
    { key: 'usageType', header: 'Usage', render: r => <Badge variant="outline" className="text-xs">{r.usageType === 'all' ? 'All' : r.usageType}</Badge> },
    { key: 'constructionType', header: 'Construction', render: r => <Badge variant="outline" className="text-xs">{r.constructionType === 'all' ? 'All' : r.constructionType}</Badge> },
    { key: 'baseRatePerSqft', header: 'Base Rate', render: r => <span className="text-ink-900">{formatCurrency(r.baseRatePerSqft)}/sqft</span> },
    { key: 'minAreaSqft', header: 'Min Area', render: r => <span className="text-ink-700">{formatArea(r.minAreaSqft)}</span> },
    { key: 'maxAreaSqft', header: 'Max Area', render: r => <span className="text-ink-700">{r.maxAreaSqft ? formatArea(r.maxAreaSqft) : 'No limit'}</span> },
    { key: 'isActive', header: 'Status', render: r => <Badge variant={r.isActive ? 'primary' : 'outline'} className="text-xs">{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: 'Actions', render: r => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(r)}><Eye className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(r)}><Edit className="w-4 h-4" /></Button>
      </div>
    )},
  ]

  return (
    <Card>
      <DataTable data={rules} columns={columns} keyField="id" striped hoverable />
    </Card>
  )
}

function PendingReviewList({ onRefetch }) {
  // This would use usePendingAssessmentReview hook
  return (
    <Card className="p-8 text-center">
      <Search className="w-12 h-12 text-ink-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-ink-900 mb-2">Pending Assessment Review</h3>
      <p className="text-ink-500 mb-4">Assessments flagged for review will appear here</p>
      <Button variant="outline" onClick={onRefetch}>Refresh</Button>
    </Card>
  )
}

function TaxRuleModal({ isOpen, onClose, rule, onSave }) {
  if (!isOpen) return null

  const isEditing = !!rule
  const [formData, setFormData] = useState({
    code: rule?.code || '',
    name: rule?.name || '',
    description: rule?.description || '',
    propertyType: rule?.propertyType || 'all',
    usageType: rule?.usageType || 'all',
    constructionType: rule?.constructionType || 'all',
    minAreaSqft: rule?.minAreaSqft || 0,
    maxAreaSqft: rule?.maxAreaSqft || '',
    baseRatePerSqft: rule?.baseRatePerSqft || 0,
    rebateRules: rule?.rebateRules || [],
    penaltyRules: rule?.penaltyRules || [],
    effectiveFrom: rule?.effectiveFrom || '',
    effectiveTo: rule?.effectiveTo || '',
    isActive: rule?.isActive !== false,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Tax Rule' : 'Create Tax Rule'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Rule Code *</label>
            <Input value={formData.code} onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="e.g., RES_STD_2025" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Rule Name *</label>
            <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Residential Standard Rate" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border border-ink-300 rounded-lg text-sm"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Property Type</label>
            <Select
              value={formData.propertyType}
              onValueChange={v => setFormData(prev => ({ ...prev, propertyType: v }))}
              options={[{ value: 'all', label: 'All Types' }, ...PROPERTY_TYPES.map(t => ({ value: t.id, label: t.label }))]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Usage Type</label>
            <Select
              value={formData.usageType}
              onValueChange={v => setFormData(prev => ({ ...prev, usageType: v }))}
              options={[{ value: 'all', label: 'All Usage' }, ...USAGE_TYPES.map(t => ({ value: t.id, label: t.label }))]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Construction</label>
            <Select
              value={formData.constructionType}
              onValueChange={v => setFormData(prev => ({ ...prev, constructionType: v }))}
              options={[{ value: 'all', label: 'All Types' }, ...CONSTRUCTION_TYPES.map(t => ({ value: t.id, label: t.label }))]}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Min Area (sqft)</label>
            <Input
              type="number"
              value={formData.minAreaSqft}
              onChange={e => setFormData(prev => ({ ...prev, minAreaSqft: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Max Area (sqft)</label>
            <Input
              type="number"
              value={formData.maxAreaSqft}
              onChange={e => setFormData(prev => ({ ...prev, maxAreaSqft: e.target.value }))}
              placeholder="No limit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Base Rate/sqft *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.baseRatePerSqft}
              onChange={e => setFormData(prev => ({ ...prev, baseRatePerSqft: parseFloat(e.target.value) || 0 }))}
              placeholder="50.00"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Effective From</label>
            <Input type="date" value={formData.effectiveFrom} onChange={e => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Effective To</label>
            <Input type="date" value={formData.effectiveTo} onChange={e => setFormData(prev => ({ ...prev, effectiveTo: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-ink-300 rounded"
          />
          <label htmlFor="isActive" className="text-sm text-ink-700">Active</label>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-ink-200">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'} Rule</Button>
        </div>
      </form>
    </Modal>
  )
}

function AssessmentDetailModal({ assessment, onClose }) {
  if (!assessment) return null

  return (
    <Modal isOpen={true} onClose={onClose} title={`Assessment: ${assessment.financialYear}`} size="lg">
      <div className="p-4 space-y-4">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <dt className="text-ink-500">FY</dt>
          <dd className="text-ink-900">{assessment.financialYear}</dd>
          <dt className="text-ink-500">Plot</dt>
          <dd className="text-ink-900 font-mono">{assessment.propertyPlotNo}</dd>
          <dt className="text-ink-500">Type</dt>
          <dd className="text-ink-900"><Badge variant="outline">{assessment.propertyType}</Badge></dd>
          <dt className="text-ink-500">Usage</dt>
          <dd className="text-ink-900">{assessment.usageType}</dd>
          <dt className="text-ink-500">Construction</dt>
          <dd className="text-ink-900">{assessment.constructionType}</dd>
          <dt className="text-ink-500">Floors</dt>
          <dd className="text-ink-900">{assessment.floors}</dd>
          <dt className="text-ink-500">Land Area</dt>
          <dd className="text-ink-900">{formatArea(assessment.landAreaSqft)}</dd>
          <dt className="text-ink-500">Built-up</dt>
          <dd className="text-ink-900">{formatArea(assessment.builtUpAreaSqft)}</dd>
          <dt className="text-ink-500">Taxable Area</dt>
          <dd className="text-ink-900">{formatArea(assessment.taxableAreaSqft)}</dd>
          <dt className="text-ink-500">Base Rate</dt>
          <dd className="text-ink-900">{formatCurrency(assessment.baseRatePerSqft)}/sqft</dd>
          <dt className="text-ink-500">Rebate</dt>
          <dd className="text-ink-900">{assessment.rebatePercent}% ({formatCurrency(assessment.rebateAmount)})</dd>
          <dt className="text-ink-500">Penalty</dt>
          <dd className="text-ink-900">{assessment.penaltyPercent}% ({formatCurrency(assessment.penaltyAmount)})</dd>
          <dt className="text-ink-500">Annual Tax</dt>
          <dd className="text-ink-900 font-bold text-lg">{formatCurrency(assessment.annualTax)}</dd>
          <dt className="text-ink-500">Half-Yearly</dt>
          <dd className="text-ink-900">{formatCurrency(assessment.halfYearlyTax)}</dd>
          <dt className="text-ink-500">Quarterly</dt>
          <dd className="text-ink-900">{formatCurrency(assessment.quarterlyTax)}</dd>
          <dt className="text-ink-500">Rule</dt>
          <dd className="text-ink-900">{assessment.applicableRuleName}</dd>
          <dt className="text-ink-500">Status</dt>
          <dd className="text-ink-900"><Badge variant="outline">{assessment.status}</Badge></dd>
        </dl>
      </div>
    </Modal>
  )
}

function Pagination({ currentPage, totalPages, onPageChange, showFirstLast, maxButtons }) {
  // Simplified pagination component
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 text-sm border border-ink-300 rounded hover:bg-ink-50 disabled:opacity-50">‹</button>
      {Array.from({ length: Math.min(totalPages, maxButtons) }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 text-sm rounded ${p === currentPage ? 'bg-blue-600 text-white' : 'border border-ink-300 hover:bg-ink-50'}`}>{p}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1 text-sm border border-ink-300 rounded hover:bg-ink-50 disabled:opacity-50">›</button>
    </div>
  )
}

export default AssessmentPage