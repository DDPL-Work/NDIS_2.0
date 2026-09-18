// Revenue & Property Intelligence — Risk Model Component
import { AlertCircle, AlertTriangle, CheckCircle, Shield, TrendingUp, TrendingDown, Info, AlertOctagon } from 'lucide-react'
import { Card, Badge, Progress, Tooltip } from '../../../components/ui'
import { formatCurrency, formatDate } from '../utils/revenueFormatters'

const RISK_LEVELS = {
  critical: { label: 'Critical', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca', icon: AlertOctagon },
  high: { label: 'High', color: '#ef4444', bgColor: '#fef2f2', borderColor: '#fecaca', icon: AlertTriangle },
  medium: { label: 'Medium', color: '#f97316', bgColor: '#fff7ed', borderColor: '#fed7aa', icon: AlertCircle },
  low: { label: 'Low', color: '#22c55e', bgColor: '#f0fdf4', borderColor: '#bbf7d0', icon: CheckCircle },
  unknown: { label: 'Unknown', color: '#6b7280', bgColor: '#f9fafb', borderColor: '#e5e7eb', icon: Info },
}

const RISK_FACTOR_LABELS = {
  high_arrears: 'High Arrears Amount',
  long_term_arrears: 'Long-term Arrears (>3 years)',
  repeated_partial_payments: 'Repeated Partial Payments',
  no_payment_history: 'No Payment History',
  high_value_property: 'High Value Property',
  assessment_mismatch: 'GIS/Assessment Area Mismatch',
  frequent_disputes: 'Frequent Disputes',
  failed_inspections: 'Failed Inspections',
  recovery_actions_failed: 'Recovery Actions Failed',
  ownership_changes: 'Frequent Ownership Changes',
}

export function RiskModel({ riskData, className = '', showDetails = true, compact = false }) {
  if (!riskData) {
    return (
      <Card className={`${className} p-4`}>
        <div className="text-center py-8 text-ink-500">
          <p>No risk assessment available</p>
          <p className="text-xs text-ink-400 mt-1">Run risk assessment to view risk profile</p>
        </div>
      </Card>
    )
  }

  const { riskScore = 0, riskLevel = 'unknown', riskFactors = [], isMockData = false, mockDataDisclaimer, assessmentDate, nextReviewDate, assessedBy, riskLevel: level } = riskData
  const levelData = RISK_LEVELS[riskLevel] || RISK_LEVELS.unknown
  const LevelIcon = levelData.icon

  return (
    <Card className={`${className} border-${levelData.color.replace('#', '')}`} style={{ borderColor: levelData.borderColor }}>
      {/* Header */}
      <div className="p-4 border-b border-ink-200 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center`} style={{ backgroundColor: levelData.bgColor }}>
            <LevelIcon className="w-6 h-6" style={{ color: levelData.color }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink-900">Risk Assessment</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="text-sm" style={{ backgroundColor: levelData.bgColor, color: levelData.color, borderColor: levelData.borderColor }}>
                {levelData.label} Risk
              </Badge>
              {isMockData && (
                <Badge variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                  Demo Data
                </Badge>
              )}
            </div>
          </div>
        </div>
        {isMockData && mockDataDisclaimer && (
          <Tooltip content={mockDataDisclaimer}>
            <Info className="w-4 h-4 text-amber-600 cursor-help" />
          </Tooltip>
        )}
      </div>

      {/* Risk Score */}
      <div className="p-4 border-b border-ink-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Risk Score</p>
            <p className="text-3xl font-bold text-ink-900" style={{ color: levelData.color }}>
              {riskScore}/100
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-500">
            {assessmentDate && (
              <div>
                <p>Assessed</p>
                <p className="font-medium text-ink-900">{formatDate(assessmentDate)}</p>
              </div>
            )}
            {nextReviewDate && (
              <div>
                <p>Next Review</p>
                <p className="font-medium text-ink-900">{formatDate(nextReviewDate)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      {showDetails && riskFactors.length > 0 && (
        <div className="p-4 border-b border-ink-200">
          <h4 className="text-sm font-medium text-ink-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Risk Factors ({riskFactors.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {riskFactors.map((factor, index) => {
              const label = RISK_FACTOR_LABELS[factor] || factor
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-amber-800">{label}</span>
                </div>
              )}
            )}
          </div>
        </div>
      )}

      {/* Mock Data Disclaimer */}
      {isMockData && mockDataDisclaimer && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mt-4" style={{ marginTop: showDetails ? 0 : '0.5rem' }}>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-medium">Demo Data Notice</p>
              <p>{mockDataDisclaimer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Info */}
      {assessedBy && (
        <div className="p-4 bg-ink-50 border-t border-ink-200">
          <p className="text-xs text-ink-500">
            Assessed by {assessedBy} on {formatDate(assessmentDate)}
          </p>
        </div>
      )}
    </Card>
  )
}

export function RiskScoreIndicator({ score, size = 'md', showLabel = true }) {
  const level = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : score >= 20 ? 'low' : 'unknown'
  const levelData = RISK_LEVELS[level]

  const sizes = {
    sm: { score: 'text-lg', icon: 'w-4 h-4', badge: 'text-xs' },
    md: { score: 'text-xl', icon: 'w-5 h-5', badge: 'text-sm' },
    lg: { score: 'text-2xl', icon: 'w-6 h-6', badge: 'text-base' },
  }

  const s = sizes[size] || sizes.md

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center`} style={{ backgroundColor: levelData.bgColor }}>
          <span className={s.score} style={{ color: levelData.color, fontWeight: 'bold' }}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <Badge className={s.badge} style={{ backgroundColor: levelData.bgColor, color: levelData.color, borderColor: levelData.borderColor }}>
          {RISK_LEVELS[level].label}
        </Badge>
      )}
    </div>
  )
}

export function RiskFactorList({ factors = [], className = '' }) {
  if (!factors.length) {
    return <p className="text-sm text-ink-500 text-center py-4">No risk factors identified</p>
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {factors.map((factor, index) => {
        const label = RISK_FACTOR_LABELS[factor] || factor
        return (
          <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default RiskModel