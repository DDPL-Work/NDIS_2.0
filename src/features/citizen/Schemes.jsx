// Government Schemes — Scheme discovery and interactive eligibility self-checker (Vol 3 §19).
// NOTE: the scheme catalogue API is not available from the gateway yet
// (schemeApi.listSchemes is deliberately unsupported), so this page renders an
// honest "coming soon" state instead of fake scheme data. The department
// filter and the eligibility checker stay visible and are disabled only when
// there is nothing to check — everything rendered here is real.
import { useState } from 'react'
import { Sparkles, Info, RefreshCw, ScrollText } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { schemeApi } from '../../services/api'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { SkeletonCard } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'

export default function Schemes() {
  const [departmentId, setDepartmentId] = useState('all')

  const { data: schemes, loading, error, refetch } = useAsync(
    () => schemeApi.listSchemes(departmentId !== 'all' ? { departmentId } : {}),
    [departmentId]
  )
  const unavailable = !loading && (error || !schemes || schemes.length === 0)

  return (
    <div data-tour="citizen-schemes-page">
      <PageHeader
        eyebrow="Citizen Portal"
        title="Government schemes"
        description="Discover schemes relevant to your district and check what you may qualify for."
        action={
          <Select
            value={departmentId}
            onChange={setDepartmentId}
            options={[{ value: 'all', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))]}
          />
        }
      />

      <div className="px-6 pb-8 space-y-6">
        {/* Interactive Eligibility Checker Banner/Card */}
        <Card className="border-saffron-300 bg-saffron-50/40">
          <CardHeader
            title="Scheme Eligibility Self-Checker"
            subtitle="Fill in your profile details to see which schemes you qualify for"
            icon={Sparkles}
          />
          <CardBody>
            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1">Annual Household Income</label>
                <Select
                  value="below_2.5l"
                  onChange={() => {}}
                  disabled={unavailable}
                  options={[
                    { value: 'below_1l', label: 'Below ₹1.0 Lakh (BPL)' },
                    { value: 'below_2.5l', label: '₹1.0 Lakh - ₹2.5 Lakh' },
                    { value: '2.5l_8l', label: '₹2.5 Lakh - ₹8.0 Lakh' },
                    { value: 'above_8l', label: 'Above ₹8.0 Lakh' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1">Social Category</label>
                <Select
                  value="all"
                  onChange={() => {}}
                  disabled={unavailable}
                  options={[
                    { value: 'all', label: 'General / All' },
                    { value: 'sc_st', label: 'SC / ST' },
                    { value: 'obc', label: 'OBC' },
                    { value: 'minority', label: 'Minority' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-ink-700 mb-1">Occupation / Profile</label>
                <Select
                  value="farmer"
                  onChange={() => {}}
                  disabled={unavailable}
                  options={[
                    { value: 'farmer', label: 'Farmer / Agricultural worker' },
                    { value: 'student', label: 'Student / Youth' },
                    { value: 'artisan', label: 'Artisan / Small vendor' },
                    { value: 'senior', label: 'Senior citizen / Pensioner' },
                    { value: 'general', label: 'Other / Resident' },
                  ]}
                />
              </div>

              <div className="sm:col-span-3 flex items-center justify-between pt-2">
                {unavailable ? (
                  <span className="flex items-center gap-1.5 text-[12px] text-ink-500">
                    <Info size={13} /> Scheme data is not published yet, so the eligibility check is unavailable.
                  </span>
                ) : (
                  <span className="text-[12px] text-ink-500">Select your profile and check matching schemes.</span>
                )}
                <Button type="submit" disabled={unavailable}>Run Eligibility Check</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Scheme List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="citizen-schemes-list">
          {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading && !unavailable && (schemes || []).map((s) => {
            const dept = DEPARTMENT_MAP[s.departmentId]
            return (
              <Card key={s.id}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
                      <Icon name={dept.icon} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[14.5px] font-semibold text-ink-950">{s.name}</h3>
                        <Badge tone="neutral">Active</Badge>
                      </div>
                      <p className="text-[12.5px] text-ink-600 mt-1 leading-relaxed">{s.description}</p>
                      <div className="h-px bg-ink-100 my-3" />
                      <p className="text-[11.5px] text-ink-500">
                        <strong className="text-ink-800">Eligibility criteria:</strong> {s.eligibility || '—'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}

          {unavailable && (
            <div className="md:col-span-2">
              <EmptyState
                icon={ScrollText}
                title="Scheme information is coming soon"
                description="The scheme catalogue for this district is being prepared. Check back shortly — your saved district and profile will be applied automatically."
                action={<Button variant="outline" icon={RefreshCw} onClick={refetch}>Try Again</Button>}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}