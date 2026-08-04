// Microservices Health & Gateway Telemetry Mock Service — Vol 1 §8.7, Vol 4 API contracts.
// Returns real-time metrics for all 8 core NDISP microservices.
import { makeRng, randInt, randFloat } from '../../utils/random'

export function getSystemHealth() {
  const rng = makeRng(`system-health-${Math.floor(Date.now() / 60000)}`)

  const services = [
    {
      id: 'svc-gis',
      name: 'GIS & Tile Service',
      description: 'GeoServer WMTS tile rendering & vector point spatial indexing engine.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 180, 420),
      p99LatencyMs: randInt(rng, 450, 780),
      throughputRps: randInt(rng, 120, 450),
      errorRatePct: randFloat(rng, 0.01, 0.12),
      uptimePct: 99.94,
      tileCacheHitPct: randInt(rng, 84, 96),
    },
    {
      id: 'svc-asset',
      name: 'Asset Registry Service',
      description: 'Master asset catalog, category schema JSONB store, and CRUD operations.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 60, 140),
      p99LatencyMs: randInt(rng, 150, 290),
      throughputRps: randInt(rng, 80, 220),
      errorRatePct: randFloat(rng, 0.0, 0.05),
      uptimePct: 99.98,
      dbConnectionsActive: randInt(rng, 12, 38),
    },
    {
      id: 'svc-workflow',
      name: 'Workflow & Proposal Engine',
      description: 'Finite state machine managing proposal sanctions and grievance escalation.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 80, 190),
      p99LatencyMs: randInt(rng, 200, 380),
      throughputRps: randInt(rng, 45, 110),
      errorRatePct: randFloat(rng, 0.0, 0.08),
      uptimePct: 99.91,
      dbConnectionsActive: randInt(rng, 8, 24),
    },
    {
      id: 'svc-analytics',
      name: 'Spatial Analytics Engine',
      description: 'MCDA deficit detection, kernel density hotspot computation, and KPI rollup.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 220, 580),
      p99LatencyMs: randInt(rng, 600, 1100),
      throughputRps: randInt(rng, 25, 75),
      errorRatePct: randFloat(rng, 0.02, 0.25),
      uptimePct: 99.85,
      mcdaComputeQueue: randInt(rng, 0, 4),
    },
    {
      id: 'svc-notification',
      name: 'Notification Gateway',
      description: 'SMS, email, and portal push dispatch service for SLA breach alerts.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 110, 240),
      p99LatencyMs: randInt(rng, 250, 480),
      throughputRps: randInt(rng, 30, 90),
      errorRatePct: randFloat(rng, 0.01, 0.15),
      uptimePct: 99.89,
      queuePendingCount: randInt(rng, 2, 18),
    },
    {
      id: 'svc-ingestion',
      name: 'CSV Data Ingestion Pipeline',
      description: 'Asynchronous CSV parsing, geocoding validation, and quarantine staging.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 340, 850),
      p99LatencyMs: randInt(rng, 900, 1800),
      throughputRps: randInt(rng, 10, 40),
      errorRatePct: randFloat(rng, 0.1, 0.8),
      uptimePct: 99.78,
      activeWorkerNodes: 4,
    },
    {
      id: 'svc-reporting',
      name: 'Reporting & PDF Worker',
      description: 'Async headless report rendering service (PDF/Excel exports).',
      status: 'degraded',
      p95LatencyMs: randInt(rng, 1200, 2400),
      p99LatencyMs: randInt(rng, 2800, 4500),
      throughputRps: randInt(rng, 5, 18),
      errorRatePct: randFloat(rng, 0.8, 2.4),
      uptimePct: 99.52,
      activeWorkerNodes: 2,
    },
    {
      id: 'svc-auth',
      name: 'OIDC Auth & RBAC Service',
      description: 'State Single Sign-On (e-Pramaan/OIDC) identity & RBAC token verification.',
      status: 'healthy',
      p95LatencyMs: randInt(rng, 35, 85),
      p99LatencyMs: randInt(rng, 90, 160),
      throughputRps: randInt(rng, 180, 520),
      errorRatePct: randFloat(rng, 0.0, 0.02),
      uptimePct: 99.99,
      tokenCacheHitPct: 98.4,
    },
  ]

  const overallUptime = 99.88
  const totalRps = services.reduce((s, x) => s + x.throughputRps, 0)
  const avgP95 = Math.round(services.reduce((s, x) => s + x.p95LatencyMs, 0) / services.length)

  return {
    timestamp: new Date().toISOString(),
    overallUptime,
    totalRps,
    avgP95,
    services,
  }
}
