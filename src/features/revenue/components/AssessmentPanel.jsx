// Revenue & Property Intelligence — Assessment Panel
// Detailed assessment view for property drawer

import { useState } from 'react'
import { Card, Badge, Tabs } from '../../../components/ui'
import { formatCurrency, formatArea } from '../utils/revenueFormatters'

export function AssessmentPanel({ assessments = [], className = '' }) {
  if (assessments.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <p className="text-ink-500">No assessment records found</p>
        </div>
      </Card>
    )
  }

  const [activeAssessmentId, setActiveAssessmentId] = useState(assessments[0]?.id)

  const tabs = assessments.map(a => ({
    value: a.id,
    label: `${a.financialYear} (${a.status})`,
  }))

  const activeAssessment = assessments.find(a => a.id === activeAssessmentId)

  return (
    <Card className={className}>
      <Tabs
        tabs={tabs}
        active={activeAssessmentId}
        onChange={setActiveAssessmentId}
      />
      {activeAssessment && (
        <div className="p-4">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <dt className="text-ink-500">Property Type</dt>
            <dd className="text-ink-900"><Badge variant="outline">{activeAssessment.propertyType}</Badge></dd>
            <dt className="text-ink-500">Usage Type</dt>
            <dd className="text-ink-900">{activeAssessment.usageType}</dd>
            <dt className="text-ink-500">Construction</dt>
            <dd className="text-ink-900">{activeAssessment.constructionType}</dd>
            <dt className="text-ink-500">Floors</dt>
            <dd className="text-ink-900">{activeAssessment.floors}</dd>

            <dt className="text-ink-500">Land Area</dt>
            <dd className="text-ink-900">{formatArea(activeAssessment.landAreaSqft)}</dd>
            <dt className="text-ink-500">Built-up Area</dt>
            <dd className="text-ink-900">{formatArea(activeAssessment.builtUpAreaSqft)}</dd>
            <dt className="text-ink-500">Taxable Area</dt>
            <dd className="text-ink-900">{formatArea(activeAssessment.taxableAreaSqft)}</dd>
            <dt className="text-ink-500">Assessment Category</dt>
            <dd className="text-ink-900">{activeAssessment.assessmentCategory}</dd>

            <dt className="text-ink-500">Base Rate</dt>
            <dd className="text-ink-900">{formatCurrency(activeAssessment.baseRatePerSqft)}/sqft</dd>
            <dt className="text-ink-500">Rule Applied</dt>
            <dd className="text-ink-900">{activeAssessment.applicableRuleName}</dd>
            <dt className="text-ink-500">Rebate</dt>
            <dd className="text-ink-900">{activeAssessment.rebatePercent}% ({formatCurrency(activeAssessment.rebateAmount)})</dd>
            <dt className="text-ink-500">Penalty</dt>
            <dd className="text-ink-900">{activeAssessment.penaltyPercent}% ({formatCurrency(activeAssessment.penaltyAmount)})</dd>

            <dt className="text-ink-500">Annual Tax</dt>
            <dd className="text-ink-900 font-semibold text-lg">{formatCurrency(activeAssessment.annualTax)}</dd>
            <dt className="text-ink-500">Half-Yearly</dt>
            <dd className="text-ink-900">{formatCurrency(activeAssessment.halfYearlyTax)}</dd>
            <dt className="text-ink-500">Quarterly</dt>
            <dd className="text-ink-900">{formatCurrency(activeAssessment.quarterlyTax)}</dd>
            <dt className="text-ink-500">Status</dt>
            <dd className="text-ink-900"><Badge variant="outline">{activeAssessment.status}</Badge></dd>
          </dl>

          <div className="mt-4 pt-4 border-t border-ink-200">
            <p className="text-xs text-ink-500">
              Assessed by {activeAssessment.assessedBy} on {activeAssessment.assessmentDate ? new Date(activeAssessment.assessmentDate).toLocaleDateString('en-IN') : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

export default AssessmentPanel