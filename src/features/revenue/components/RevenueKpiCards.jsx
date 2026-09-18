// Revenue & Property Intelligence — Revenue KPI Cards
// Professional government enterprise style KPI display

import { formatCurrency, formatIndianNumber } from '../utils'
import { StatCard } from '../../../components/ui'

const KPI_CONFIG = [
  {
    key: 'totalProperties',
    label: 'Total Properties',
    icon: 'Home',
    color: 'bg-blue-500',
    format: (v) => formatIndianNumber(v),
  },
  {
    key: 'totalAnnualDemand',
    label: 'Annual Demand',
    icon: 'FileText',
    color: 'bg-indigo-500',
    format: (v) => formatCurrency(v, { compact: true }),
  },
  {
    key: 'totalCollected',
    label: 'Collected',
    icon: 'CheckCircle',
    color: 'bg-green-500',
    format: (v) => formatCurrency(v, { compact: true }),
  },
  {
    key: 'totalOutstanding',
    label: 'Outstanding',
    icon: 'AlertTriangle',
    color: 'bg-orange-500',
    format: (v) => formatCurrency(v, { compact: true }),
  },
  {
    key: 'collectionRatePercentage',
    label: 'Collection Rate',
    icon: 'TrendingUp',
    color: 'bg-emerald-500',
    format: (v) => `${(v || 0).toFixed(1)}%`,
  },
  {
    key: 'totalArrears',
    label: 'Arrears',
    icon: 'Clock',
    color: 'bg-red-500',
    format: (v) => formatCurrency(v, { compact: true }),
  },
  {
    key: 'highRiskProperties',
    label: 'High Risk',
    icon: 'AlertCircle',
    color: 'bg-amber-500',
    format: (v) => formatIndianNumber(v),
  },
  {
    key: 'activeRecoveryCasesCount',
    label: 'Recovery Cases',
    icon: 'Gavel',
    color: 'bg-purple-500',
    format: (v) => formatIndianNumber(v),
  },
]

export function RevenueKpiCards({ data, className = '' }) {
  if (!data) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 ${className}`}>
        {KPI_CONFIG.map((config, i) => (
          <StatCard key={i} title={config.label} value="—" loading />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 ${className}`}>
      {KPI_CONFIG.map((config) => (
        <StatCard
          key={config.key}
          title={config.label}
          value={config.format(data[config.key] ?? 0)}
          icon={config.icon}
          iconColor={config.color}
        />
      ))}
    </div>
  )
}

export default RevenueKpiCards
