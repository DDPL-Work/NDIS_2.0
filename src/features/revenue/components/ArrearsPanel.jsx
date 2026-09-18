// Revenue & Property Intelligence — Arrears Panel
// Arrears display with aging and recovery actions

import { Card, Badge, Button } from '../../../components/ui'
import { formatCurrency, formatDate } from '../utils/revenueFormatters'
import { ARREARS_AGING, RECOVERY_STATUS, RECOVERY_STATUS_LABELS } from '../constants/revenueConstants'

const RECOVERY_STATUS_COLORS = {
  initiated: 'bg-blue-100 text-blue-800',
  notice_sent: 'bg-orange-100 text-orange-800',
  field_visit: 'bg-yellow-100 text-yellow-800',
  attachment: 'bg-red-100 text-red-800',
  auction: 'bg-red-200 text-red-900',
  settled: 'bg-green-100 text-green-800',
  write_off: 'bg-gray-100 text-gray-800',
}

export function ArrearsPanel({ arrears = [], recoveryActions = [], onAction, className = '' }) {
  if (arrears.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <p className="text-ink-500">No arrears for this property</p>
        </div>
      </Card>
    )
  }

  // Sort by financial year ascending (oldest first)
  const sortedArrears = [...arrears].sort((a, b) =>
    (a.financialYear || '').localeCompare(b.financialYear || '')
  )

  const totalArrears = sortedArrears.reduce((sum, a) => sum + (a.totalArrears || 0), 0)
  const totalOutstanding = sortedArrears.reduce((sum, a) => sum + (a.outstandingAmount || 0), 0)
  const totalPenalty = sortedArrears.reduce((sum, a) => sum + (a.penaltyAmount || 0), 0)
  const totalInterest = sortedArrears.reduce((sum, a) => sum + (a.interestAmount || 0), 0)

  // Group by aging bucket
  const byAging = sortedArrears.reduce((acc, a) => {
    const bucket = a.agingBucket || 'current'
    if (!acc[bucket]) acc[bucket] = []
    acc[bucket].push(a)
    return acc
  }, {})

  return (
    <Card className={className}>
      {/* Summary */}
      <div className="p-4 border-b border-ink-200 bg-ink-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-ink-900">Arrears Summary</h4>
          <div className="text-right">
            <p className="text-ink-900 font-bold text-lg">{formatCurrency(totalArrears)}</p>
            <p className="text-xs text-ink-500">Total Arrears</p>
          </div>
        </div>
        <dl className="grid grid-cols-4 gap-3 text-sm">
          <dt className="text-ink-500">Outstanding Principal</dt>
          <dd className="text-ink-900">{formatCurrency(totalOutstanding)}</dd>
          <dt className="text-ink-500">Penalty</dt>
          <dd className="text-red-700">{formatCurrency(totalPenalty)}</dd>
          <dt className="text-ink-500">Interest</dt>
          <dd className="text-red-700">{formatCurrency(totalInterest)}</dd>
          <dt className="text-ink-500">Total Arrears</dt>
          <dd className="text-ink-900 font-bold">{formatCurrency(totalArrears)}</dd>
        </dl>
      </div>

      {/* Aging Breakdown */}
      <div className="p-4 border-b border-ink-200">
        <h5 className="font-medium text-ink-900 mb-3">Aging Analysis</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ARREARS_AGING.map(bucket => {
            const bucketArrears = byAging[bucket.id] || []
            const bucketTotal = bucketArrears.reduce((sum, a) => sum + (a.totalArrears || 0), 0)
            const count = bucketArrears.length
            return (
              <Card key={bucket.id} variant="outline" className="p-3 text-center border-l-4" style={{ borderLeftColor: bucket.color }}>
                <p className="text-xs text-ink-500">{bucket.label}</p>
                <p className="font-bold text-ink-900">{formatCurrency(bucketTotal)}</p>
                <p className="text-xs text-ink-500">{count} FYs</p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Arrears Detail */}
      <div className="p-4">
        <h5 className="font-medium text-ink-900 mb-3">Arrears by Financial Year</h5>
        <div className="space-y-2">
          {sortedArrears.map(a => {
            const recovery = recoveryActions.find(r => r.arrearId === a.arrearId || r.propertyId === a.propertyId)
            const agingBucket = ARREARS_AGING.find(b => b.id === a.agingBucket) || ARREARS_AGING[0]
            return (
              <Card key={a.id} variant="outline" className="p-3 border-l-4" style={{ borderLeftColor: agingBucket.color }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-ink-900">FY {a.financialYear}</span>
                      <Badge className="text-xs" style={{ backgroundColor: `${agingBucket.color}15`, color: agingBucket.color, borderColor: `${agingBucket.color}40` }}>
                        {agingBucket.label}
                      </Badge>
                      {a.isDisputed && (
                        <Badge variant="outline" className="text-xs text-purple-700 border-purple-200">Disputed</Badge>
                      )}
                    </div>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <dt className="text-ink-500">Original</dt>
                      <dd className="text-ink-900">{formatCurrency(a.originalDemand)}</dd>
                      <dt className="text-ink-500">Paid</dt>
                      <dd className="text-green-700">{formatCurrency(a.paidAmount)}</dd>
                      <dt className="text-ink-500">Outstanding</dt>
                      <dd className="text-red-700">{formatCurrency(a.outstandingAmount)}</dd>
                      <dt className="text-ink-500">Penalty</dt>
                      <dd className="text-red-700">{formatCurrency(a.penaltyAmount)}</dd>
                      <dt className="text-ink-500">Interest</dt>
                      <dd className="text-red-700">{formatCurrency(a.interestAmount)}</dd>
                      <dt className="text-ink-500">Total</dt>
                      <dd className="text-ink-900 font-bold">{formatCurrency(a.totalArrears)}</dd>
                      <dt className="text-ink-500">Years</dt>
                      <dd className="text-ink-900">{a.yearsPending}</dd>
                      <dt className="text-ink-500">Last Payment</dt>
                      <dd className="text-ink-900">{formatDate(a.lastPaymentDate)}</dd>
                    </dl>
                  </div>
                  {recovery && (
                    <div className="ml-4 flex flex-col items-end gap-1">
                      <Badge className={RECOVERY_STATUS_COLORS[recovery.status] || 'bg-gray-100 text-gray-800'}>
                        {RECOVERY_STATUS_LABELS[recovery.status] || recovery.status}
                      </Badge>
                      {recovery.nextActionDate && (
                        <span className="text-xs text-ink-500">
                          Next: {formatDate(recovery.nextActionDate)}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAction?.('view_recovery', recovery)}
                        className="h-7 px-2"
                      >
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recovery Actions */}
      {recoveryActions.length > 0 && (
        <div className="p-4 border-t border-ink-200">
          <h5 className="font-medium text-ink-900 mb-3">Recovery Actions</h5>
          <div className="space-y-2">
            {recoveryActions.map(r => (
              <Card key={r.id} variant="outline" className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-ink-900">{r.actionType?.replace('_', ' ')}</span>
                  <Badge className={RECOVERY_STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-800'}>
                    {RECOVERY_STATUS_LABELS[r.status] || r.status}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <dt className="text-ink-500">Date</dt>
                  <dd className="text-ink-900">{formatDate(r.actionDate)}</dd>
                  <dt className="text-ink-500">By</dt>
                  <dd className="text-ink-900">{r.actionBy}</dd>
                  <dt className="text-ink-500">Next Action</dt>
                  <dd className="text-ink-900">{r.nextActionType ? r.nextActionType.replace('_', ' ') : '—'}</dd>
                  <dt className="text-ink-500">Next Date</dt>
                  <dd className="text-ink-900">{formatDate(r.nextActionDate)}</dd>
                </dl>
                {r.description && (
                  <p className="mt-2 text-sm text-ink-600">{r.description}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

export default ArrearsPanel