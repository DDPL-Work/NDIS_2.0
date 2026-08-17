// System Health & Gateway Monitor — Vol 1 §8.7 Microservice Architecture & Gateway Telemetry.
import { useState } from 'react'
import { Server, Activity, Clock, ShieldCheck, RefreshCw, Cpu, Layers, HardDrive } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useAsync } from '../../hooks/useAsync'
import { getSystemHealth } from '../../services/mock/systemHealth'
import { formatNumber } from '../../utils/format'

export default function SystemHealth() {
  const { data: health, loading, refetch } = useAsync(() => Promise.resolve(getSystemHealth()), [])

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Vol 1 §8.7"
        title="Microservices platform health & API gateway"
        description="Real-time telemetry, latency metrics, and throughput for NDISP backend microservices catalog."
        action={
          <Button icon={RefreshCw} variant="outline" onClick={refetch}>
            Refresh Status
          </Button>
        }
      />

      <div className="px-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Overall Platform Uptime"
          value={`${health?.overallUptime ?? 99.9}%`}
          icon={ShieldCheck}
          tone="leaf"
          sub="SLO Target ≥ 99.5%"
        />
        <StatCard
          label="Avg p95 Gateway Latency"
          value={`${health?.avgP95 ?? 140} ms`}
          icon={Clock}
          tone="sky"
          sub="Target < 300ms non-spatial"
        />
        <StatCard
          label="Total System Throughput"
          value={`${formatNumber(health?.totalRps)} rps`}
          icon={Activity}
          tone="saffron"
          sub="Requests per second"
        />
        <StatCard
          label="Microservices Monitored"
          value={health?.services?.length || 8}
          icon={Server}
          tone="ink"
          sub="All 8 catalog services"
        />
      </div>

      <div className="px-6 mt-6 pb-8 space-y-4">
        <Card>
          <CardHeader
            title="Microservices Diagnostics Catalog"
            subtitle="Health state, latency distribution, throughput, and error rates per service"
          />
          <CardBody className="!p-0 divide-y divide-ink-50">
            {loading ? (
              <div className="p-6 text-center text-ink-400 text-[12.5px]">Loading microservices telemetry…</div>
            ) : (
              health?.services.map((svc) => (
                <div key={svc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ink-50/50 transition-colors">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="kbd-mono text-[11px] bg-ink-100 text-ink-700 px-1.5 py-0.5 rounded">{svc.id}</span>
                      <h4 className="text-[13.5px] font-semibold text-ink-950">{svc.name}</h4>
                      <Badge tone={svc.status === 'healthy' ? 'positive' : 'warning'}>
                        {svc.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-ink-600 leading-snug">{svc.description}</p>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center shrink-0">
                    <div className="bg-ink-50/70 p-2 rounded-lg min-w-[80px]">
                      <p className="text-[10px] uppercase text-ink-400 font-semibold">p95 Latency</p>
                      <p className="text-[13px] font-semibold text-ink-900">{svc.p95LatencyMs} ms</p>
                    </div>
                    <div className="bg-ink-50/70 p-2 rounded-lg min-w-[80px]">
                      <p className="text-[10px] uppercase text-ink-400 font-semibold">Throughput</p>
                      <p className="text-[13px] font-semibold text-ink-900">{svc.throughputRps} rps</p>
                    </div>
                    <div className="bg-ink-50/70 p-2 rounded-lg min-w-[80px]">
                      <p className="text-[10px] uppercase text-ink-400 font-semibold">Error Rate</p>
                      <p className="text-[13px] font-semibold text-leaf-700">{svc.errorRatePct.toFixed(2)}%</p>
                    </div>
                    <div className="bg-ink-50/70 p-2 rounded-lg min-w-[80px]">
                      <p className="text-[10px] uppercase text-ink-400 font-semibold">Uptime</p>
                      <p className="text-[13px] font-semibold text-ink-900">{svc.uptimePct}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
