import { parseSpatialIntent } from './SpatialIntentParser'
import { rankSpatialResults } from './SpatialRankingEngine'
import { resolveAccessibleLayers } from './LayerResolver'
import { executeSpatialQuery } from './GISQueryExecutor'

/** Shared portal-neutral GIS entry point. The caller supplies identity and datasets. */
export function executeGISQuery(query, context = {}) {
  const intent = parseSpatialIntent(query)
  const allowedLayers = resolveAccessibleLayers(context.user, context.allowedDepartments)
  const outcome = executeSpatialQuery(intent, { ...context, allowedLayers })
  const results = rankSpatialResults(outcome.results, { center: context.center, intent })
  return { ...outcome, intent, results, allowedLayers, generatedAt: new Date().toISOString() }
}
