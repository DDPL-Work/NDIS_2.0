// Revenue & Property Intelligence — Revenue Heatmap Legend
// Legend component for collection/arrears/demand heatmaps

import { Card } from '../../../components/ui'

const HEATMAP_GRADIENTS = {
  collection: [
    { color: 'rgba(31,122,84,0)', label: 'Low' },
    { color: 'rgba(224,122,44,0.55)', label: '' },
    { color: 'rgba(192,57,43,0.7)', label: '' },
    { color: 'rgba(139,28,17,0.85)', label: 'High' },
  ],
  arrears: [
    { color: 'rgba(34,197,94,0)', label: 'No Arrears' },
    { color: 'rgba(249,115,22,0.55)', label: '' },
    { color: 'rgba(239,68,68,0.7)', label: '' },
    { color: 'rgba(220,38,38,0.85)', label: 'High Arrears' },
  ],
  demand: [
    { color: 'rgba(59,130,246,0)', label: 'Low Demand' },
    { color: 'rgba(139,92,246,0.55)', label: '' },
    { color: 'rgba(168,85,247,0.7)', label: '' },
    { color: 'rgba(124,58,237,0.85)', label: 'High Demand' },
  ],
}

export function RevenueHeatmapLegend({
  type = 'collection',
  title = 'Collection Rate',
  className = '',
  position = 'bottom-right',
}) {
  const gradient = HEATMAP_GRADIENTS[type] || HEATMAP_GRADIENTS.collection

  return (
    <Card className={`${className} w-48 shadow-lg`}>
      <div className="p-2 border-b border-ink-200">
        <h4 className="text-xs font-medium text-ink-900">{title}</h4>
      </div>
      <div className="p-2 space-y-1">
        <div className="h-6 rounded" style={{
          background: `linear-gradient(to right, ${gradient.map(g => g.color).join(', ')})`,
        }} />
        <div className="flex justify-between text-[10px] text-ink-500">
          <span>{gradient[0].label}</span>
          <span>{gradient[gradient.length - 1].label}</span>
        </div>
      </div>
    </Card>
  )
}

export function RevenueHeatmapLegendHorizontal({
  type = 'collection',
  title = 'Collection Rate',
  className = '',
}) {
  const gradient = HEATMAP_GRADIENTS[type] || HEATMAP_GRADIENTS.collection

  return (
    <Card className={`${className} w-full shadow-lg`}>
      <div className="p-3 border-b border-ink-200">
        <h4 className="text-sm font-medium text-ink-900">{title}</h4>
      </div>
      <div className="p-3">
        <div className="h-4 rounded mb-2" style={{
          background: `linear-gradient(to right, ${gradient.map(g => g.color).join(', ')})`,
        }} />
        <div className="flex justify-between text-xs text-ink-500">
          <span>{gradient[0].label}</span>
          <span>{gradient[gradient.length - 1].label}</span>
        </div>
      </div>
    </Card>
  )
}

export default RevenueHeatmapLegend