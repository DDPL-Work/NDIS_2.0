// Revenue & Property Intelligence — Demand Panel
// Demand history and current demand display

import { Card, Badge, Button } from '../../../components/ui'
import { formatCurrency, formatDate } from '../utils/revenueFormatters'

const DEMAND_STATUS_COLORS = {
  generated: 'bg-blue-100 text-blue-800',
  sent: 'bg-orange-100 text-orange-800',
  partially_paid: 'bg-yellow-100 text-yellow-800',
  fully_paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  revised: 'bg-purple-100 text-purple-800',
}

export function DemandPanel({ demands = [], onAction, className = '' }) {
  if (demands.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <p className="text-ink-500">No demands generated for this property</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => onAction?.('generate_demand')}>
            Generate Demand
          </Button>
        </div>
      </Card>
    )
  }

  // Sort demands by financial year descending
  const sortedDemands = [...demands].sort((a, b) =>
    (b.financialYear || '').localeCompare(a.financialYear || '')
  )

  const currentFYDemand = sortedDemands[0]

  return (
    <Card className={className}>
      {/* Current Demand Summary */}
      <div className="p-4 border-b border-ink-200 bg-ink-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-ink-900">Current Demand (FY {currentFYDemand?.financialYear})</h4>
          <Badge className={DEMAND_STATUS_COLORS[currentFYDemand?.status] || 'bg-gray-100 text-gray-800'}>
            {currentFYDemand?.status?.replace('_', ' ') || 'Unknown'}
          </Badge>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <dt className="text-ink-500">Annual Demand</dt>
          <dd className="text-ink-900 font-semibold text-lg">{formatCurrency(currentFYDemand?.annualDemand)}</dd>
          <dt className="text-ink-500">Rebate</dt>
          <dd className="text-green-700">-{formatCurrency(currentFYDemand?.rebateAmount)}</dd>
          <dt className="text-ink-500">Penalty</dt>
          <dd className="text-red-700">+{formatCurrency(currentFYDemand?.penaltyAmount)}</dd>
          <dt className="text-ink-500">Net Demand</dt>
          <dd className="text-ink-900 font-bold text-lg">{formatCurrency(currentFYDemand?.netDemand)}</dd>
          <dt className="text-ink-500">Paid</dt>
          <dd className="text-green-700 font-medium">{formatCurrency(currentFYDemand?.paidAmount)}</dd>
          <dt className="text-ink-500">Outstanding</dt>
          <dd className="text-red-700 font-medium">{formatCurrency(currentFYDemand?.outstandingAmount)}</dd>
          <dt className="text-ink-500">Collection Rate</dt>
          <dd className="text-ink-900 font-medium">
            {currentFYDemand?.netDemand > 0
              ? `${((currentFYDemand.paidAmount / currentFYDemand.netDemand) * 100).toFixed(1)}%`
              : 'N/A'}
          </dd>
          <dt className="text-ink-500">Due Date</dt>
          <dd className="text-ink-900">{formatDate(currentFYDemand?.dueDate)}</dd>
          <dt className="text-ink-500">Notice Sent</dt>
          <dd className="text-ink-900">{formatDate(currentFYDemand?.noticeSentDate)}</dd>
        </dl>
        {(currentFYDemand?.outstandingAmount > 0) && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" onClick={() => onAction?.('pay_now', currentFYDemand)}>
              Pay Now
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onAction?.('view_demand', currentFYDemand)}>
              View Details
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction?.('send_notice', currentFYDemand)}>
              Send Notice
            </Button>
          </div>
        )}
      </div>

      {/* Demand History */}
      <div className="p-4">
        <h4 className="font-medium text-ink-900 mb-3">Demand History</h4>
        <div className="space-y-2">
          {sortedDemands.map(d => (
            <Card key={d.id} variant="outline" className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-ink-900">FY {d.financialYear}</span>
                <Badge className={DEMAND_STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-800'}>
                  {d.status?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-ink-500">Demand</dt>
                  <dd className="text-ink-900">{formatCurrency(d.netDemand)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Collected</dt>
                  <dd className="text-green-700">{formatCurrency(d.paidAmount)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Outstanding</dt>
                  <dd className="text-red-700">{formatCurrency(d.outstandingAmount)}</dd>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default DemandPanel