import { useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Icon from '../../components/ui/Icon'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useAsync } from '../../hooks/useAsync'
import { analyticsApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatCurrencyINR, formatDate } from '../../utils/format'

export default function Recommendations() {
  const user = useAuthStore((s) => s.user)
  const districtId = user?.districtId || 'nalanda'
  const { data: recs, loading } = useAsync(() => analyticsApi.getRecommendations(districtId), [districtId])
  const [expanded, setExpanded] = useState(null)

  return (
    <div>
      <PageHeader
        eyebrow="Admin Portal · Ch. 17.5"
        title="GIS Decision Support"
        description="Rules-based Spatial Decision Support (MCDA over gap score, terrain constraints and budget-approval history). Every ranking retains its underlying spatial evidence."
      />
      <div className="px-6 pb-8 space-y-3 max-w-3xl">
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading &&
          (recs || []).map((r) => {
            const dept = DEPARTMENT_MAP[r.departmentId]
            const open = expanded === r.id
            return (
              <Card key={r.id}>
                <button className="w-full text-left" onClick={() => setExpanded(open ? null : r.id)}>
                  <CardBody className="flex items-start gap-3.5">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
                      <Icon name={dept.icon} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13.5px] font-semibold text-ink-950 leading-snug">{r.title}</p>
                        <ChevronDown size={16} className={clsx('shrink-0 text-ink-400 transition-transform mt-0.5', open && 'rotate-180')} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge tone={r.priority === 'high' ? 'negative' : r.priority === 'medium' ? 'warning' : 'neutral'}>{r.priority} priority</Badge>
                        <Badge tone="info">Confidence {(r.confidence * 100).toFixed(0)}%</Badge>
                        <span className="text-[11.5px] text-ink-400 flex items-center gap-1"><MapPin size={11} />{r.village}</span>
                        <span className="text-[11.5px] text-ink-400">Est. {formatCurrencyINR(r.estimatedCost)}</span>
                      </div>
                      {open && (
                        <div className="mt-3.5 pt-3.5 border-t border-ink-100">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2">Spatial evidence</p>
                          <ul className="space-y-1.5">
                            {r.evidence.map((e, i) => (
                              <li key={i} className="text-[12.5px] text-ink-700 flex gap-2"><span className="text-ink-300">—</span>{e}</li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-ink-400 mt-2.5">Generated {formatDate(r.generatedAt)} · anl_recommendation.confidence retained for audit</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </button>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
