// Revenue & Property Intelligence — Payment History
// Payment records display with receipt links

import { Card, Badge, Button } from '../../../components/ui'
import { formatCurrency, formatDate, truncate } from '../utils/revenueFormatters'

export function PaymentHistory({ payments = [], receipts = [], onAction, className = '' }) {
  if (payments.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <p className="text-ink-500">No payment records found</p>
        </div>
      </Card>
    )
  }

  // Sort payments by date descending
  const sortedPayments = [...payments].sort((a, b) =>
    new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0)
  )

  return (
    <Card className={className}>
      <div className="p-4 border-b border-ink-200">
        <h4 className="font-medium text-ink-900">Payment History ({payments.length} records)</h4>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-500">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Receipt</th>
                <th className="pb-2 font-medium">Mode</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Transaction ID</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPayments.map(p => {
                const receipt = receipts.find(r => r.paymentId === p.paymentId || r.receiptNumber === p.receiptNumber)
                return (
                  <tr key={p.id} className="border-b border-ink-100 hover:bg-ink-50">
                    <td className="py-2 text-ink-900">{formatDate(p.paymentDate)}</td>
                    <td className="py-2">
                      {receipt ? (
                        <span className="font-mono text-ink-900">{receipt.receiptNumber}</span>
                      ) : (
                        <span className="font-mono text-ink-900">{p.receiptNumber || '—'}</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className="text-xs">{p.paymentMode}</Badge>
                    </td>
                    <td className="py-2 text-ink-900 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="py-2 text-ink-500 font-mono text-xs">{truncate(p.transactionId)}</td>
                    <td className="py-2">
                      <Badge variant="outline" className="text-xs">{p.status}</Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        {receipt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => onAction?.('view_receipt', receipt)}
                          >
                            Receipt
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => onAction?.('view_payment', p)}
                        >
                          Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}

export default PaymentHistory