/** Produces lightweight client-side density bins; production adapters can delegate to PostGIS. */
export function buildHeatmap(points = [], precision = 2) {
  const bins = new Map()
  points.filter((point) => point.position).forEach((point) => {
    const key = `${point.position[0].toFixed(precision)},${point.position[1].toFixed(precision)}`
    const bin = bins.get(key) || { position: point.position, weight: 0, points: [] }
    bin.weight += point.priority === 'urgent' ? 3 : point.priority === 'high' ? 2 : 1
    bin.points.push(point.id); bins.set(key, bin)
  })
  return [...bins.values()]
}
