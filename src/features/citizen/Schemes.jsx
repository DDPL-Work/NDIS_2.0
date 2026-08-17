// Government Schemes — Scheme discovery and interactive eligibility self-checker (Vol 3 §19).
import { useState } from 'react'
import { CheckCircle2, HelpCircle, ExternalLink, Sparkles, Filter } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { schemeApi } from '../../services/api'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'
import { formatNumber } from '../../utils/format'
import { useUiStore } from '../../app/store/uiStore'

export default function Schemes() {
  const [departmentId, setDepartmentId] = useState('all')
  const [showChecker, setShowChecker] = useState(false)
  const [incomeRange, setIncomeRange] = useState('below_2.5l')
  const [category, setCategory] = useState('all')
  const [occupation, setOccupation] = useState('farmer')
  const [eligibleResults, setEligibleResults] = useState(null)
  const [checking, setChecking] = useState(false)
  const [applyingScheme, setApplyingScheme] = useState(null)

  const pushToast = useUiStore((s) => s.pushToast)

  const { data: schemes, loading } = useAsync(
    () => schemeApi.listSchemes(departmentId !== 'all' ? { departmentId } : {}),
    [departmentId]
  )

  function runEligibilityCheck(e) {
    e.preventDefault()
    setChecking(true)
    setTimeout(() => {
      // Filter schemes based on criteria
      const matched = (schemes || []).filter((s) => {
        const text = (s.eligibility + ' ' + s.description).toLowerCase()
        if (incomeRange === 'above_8l' && text.includes('bpl')) return false
        if (occupation === 'student' && !text.includes('student') && !text.includes('school') && !text.includes('education')) return false
        if (occupation === 'farmer' && !text.includes('farmer') && !text.includes('agriculture') && !text.includes('water') && !text.includes('solar')) return false
        return true
      })
      setEligibleResults(matched)
      setChecking(false)
      pushToast(`Eligibility check complete: ${matched.length} scheme(s) match your profile!`, 'success')
    }, 600)
  }

  function handleApply(scheme) {
    setApplyingScheme(scheme)
  }

  function submitApplication() {
    pushToast(`Application for ${applyingScheme.name} submitted successfully! Reference: APPL-${Math.floor(100000 + Math.random() * 900000)}`, 'success')
    setApplyingScheme(null)
  }

  return (
    <div data-tour="citizen-schemes-page">
      <PageHeader
        eyebrow="Citizen Portal · Vol 3 §19"
        title="Government schemes"
        description="Discover schemes relevant to your district, run instant eligibility checks, and apply online."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="positive"
              icon={Sparkles}
              onClick={() => setShowChecker((v) => !v)}
            >
              {showChecker ? 'Hide Eligibility Checker' : 'Check My Eligibility'}
            </Button>
            <Select
              value={departmentId}
              onChange={setDepartmentId}
              options={[{ value: 'all', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))]}
            />
          </div>
        }
      />

      <div className="px-6 pb-8 space-y-6">
        {/* Interactive Eligibility Checker Banner/Card */}
        {showChecker && (
          <Card className="border-saffron-300 bg-saffron-50/40 animate-fade-in">
            <CardHeader
              title="Scheme Eligibility Self-Checker"
              subtitle="Fill in your profile details to see which schemes you qualify for"
              icon={Sparkles}
            />
            <CardBody>
              <form onSubmit={runEligibilityCheck} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-ink-700 mb-1">Annual Household Income</label>
                  <Select
                    value={incomeRange}
                    onChange={setIncomeRange}
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
                    value={category}
                    onChange={setCategory}
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
                    value={occupation}
                    onChange={setOccupation}
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
                  <span className="text-[12px] text-ink-500">
                    {eligibleResults ? `Showing ${eligibleResults.length} matching scheme(s)` : 'Click check to see matched schemes'}
                  </span>
                  <div className="flex gap-2">
                    {eligibleResults && (
                      <Button variant="ghost" size="sm" onClick={() => setEligibleResults(null)}>Clear filter</Button>
                    )}
                    <Button type="submit" loading={checking} size="sm">Run Eligibility Check</Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Scheme List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="citizen-schemes-list">
          {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          {!loading &&
            (eligibleResults || schemes || []).map((s) => {
              const dept = DEPARTMENT_MAP[s.departmentId]
              const isEligibleMatch = eligibleResults?.some((x) => x.id === s.id)
              return (
                <Card key={s.id} className={isEligibleMatch ? 'ring-2 ring-leaf-500' : ''}>
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: dept.color }}>
                        <Icon name={dept.icon} size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[14.5px] font-semibold text-ink-950">{s.name}</h3>
                          {isEligibleMatch ? (
                            <Badge tone="positive">Eligible Match</Badge>
                          ) : (
                            <Badge tone="neutral">Active</Badge>
                          )}
                        </div>
                        <p className="text-[12.5px] text-ink-600 mt-1 leading-relaxed">{s.description}</p>
                        <div className="h-px bg-ink-100 my-3" />
                        <p className="text-[11.5px] text-ink-500">
                          <strong className="text-ink-800">Eligibility criteria:</strong> {s.eligibility}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-ink-50">
                          <span className="text-[12px] text-ink-800 font-medium">
                            {formatNumber(s.beneficiariesInDistrict)} beneficiaries in-district
                          </span>
                          <Button size="sm" variant="outline" icon={ExternalLink} onClick={() => handleApply(s)}>
                            Apply online
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Online Application Simulation Modal */}
      <Modal
        open={!!applyingScheme}
        onClose={() => setApplyingScheme(null)}
        title={`Apply for ${applyingScheme?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setApplyingScheme(null)}>Cancel</Button>
            <Button icon={CheckCircle2} onClick={submitApplication}>Submit Application</Button>
          </>
        }
      >
        {applyingScheme && (
          <div className="space-y-3 text-[12.5px]">
            <p className="text-ink-600">{applyingScheme.description}</p>
            <div className="p-3 bg-ink-50 rounded-lg space-y-1.5">
              <p><strong className="text-ink-800">Department:</strong> {DEPARTMENT_MAP[applyingScheme.departmentId]?.label}</p>
              <p><strong className="text-ink-800">Eligibility:</strong> {applyingScheme.eligibility}</p>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Aadhaar / Ration Card ID</label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[12.5px]"
                defaultValue="7849-2019-4820"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Applicant Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[12.5px]"
                defaultValue={user?.name || 'Ramesh Kumar'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
