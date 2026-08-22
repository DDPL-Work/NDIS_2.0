import { useMemo, useState } from 'react'
import { CheckCircle2, MessageSquare, Star } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { getCitizenFeedbackQuestions } from '../../data/citizenFeedbackQuestions'
import { citizenFeedbackApi } from '../../services/citizenFeedbackApi'

function QuestionRenderer({ question, value, onChange, invalid, disabled }) {
  const id = `feedback-${question.id}`
  const options = question.type === 'yes_no' ? [{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }] : question.options || []
  return <fieldset id={id} aria-invalid={invalid} className={`rounded-xl border p-4 ${invalid ? 'border-alert-300 bg-alert-50/30' : 'border-ink-100 bg-white'}`}>
    <legend className="px-1 text-[13px] font-semibold text-ink-900">{question.question}{question.required && <span className="ml-1 text-alert-600">*</span>}</legend>
    {['single_choice', 'yes_no'].includes(question.type) && <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={question.question}>{options.map((option) => <label key={option.value} className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition ${value === option.value ? 'border-sky-600 bg-sky-50 text-sky-900' : 'border-ink-200 hover:border-ink-300'}`}><input type="radio" name={id} value={option.value} checked={value === option.value} disabled={disabled} onChange={() => onChange(question.id, option.value)} />{option.label}</label>)}</div>}
    {question.type === 'rating' && <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label={question.question}>{Array.from({ length: question.max || 5 }, (_, index) => index + 1).map((rating) => <button key={rating} type="button" disabled={disabled} onClick={() => onChange(question.id, rating)} aria-label={`${rating} out of ${question.max || 5}`} aria-pressed={Number(value) === rating} className={`grid h-11 w-11 place-items-center rounded-lg focus-visible:ring-2 focus-visible:ring-sky-500 ${rating <= Number(value || 0) ? 'bg-saffron-50 text-saffron-500' : 'text-ink-300 hover:bg-ink-50'}`}><Star size={24} fill={rating <= Number(value || 0) ? 'currentColor' : 'none'} /></button>)}</div>}
    {question.type === 'optional_text' && <div className="mt-3"><textarea value={value || ''} disabled={disabled} maxLength={question.maxLength || 300} onChange={(event) => onChange(question.id, event.target.value)} rows={3} className="input-field resize-none" placeholder="Optional, up to 300 characters" /><p className="mt-1 text-right text-[11px] text-ink-400">{String(value || '').length}/{question.maxLength || 300}</p></div>}
    {invalid && <p className="mt-2 text-[12px] text-alert-700">Please answer this required question.</p>}
  </fieldset>
}

export default function CitizenFeedbackModal({ facility, open, onClose }) {
  const questions = useMemo(() => getCitizenFeedbackQuestions({ departmentId: facility?.departmentId, category: facility?.categoryId }), [facility?.departmentId, facility?.categoryId])
  const [answers, setAnswers] = useState({}); const [invalid, setInvalid] = useState([]); const [submitting, setSubmitting] = useState(false); const [result, setResult] = useState(null); const [submitError, setSubmitError] = useState('')
  const change = (id, value) => { setAnswers((current) => ({ ...current, [id]: value })); setInvalid((current) => current.filter((key) => key !== id)); setSubmitError('') }
  const close = () => { setAnswers({}); setInvalid([]); setResult(null); setSubmitError(''); onClose() }
  const submit = async () => {
    const missing = questions.filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === '')).map((q) => q.id)
    if (missing.length) { setInvalid(missing); requestAnimationFrame(() => { const field = document.getElementById(`feedback-${missing[0]}`); field?.scrollIntoView({ behavior: 'smooth', block: 'center' }); field?.querySelector('input, button, textarea')?.focus() }); return }
    setSubmitting(true); setSubmitError('')
    try { setResult(await citizenFeedbackApi.submitFeedback({ facility, answers, questions })) } catch { setSubmitError('We could not submit your feedback. Please try again.') } finally { setSubmitting(false) }
  }
  const footer = result ? <Button onClick={close}>Done</Button> : <><Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button><Button onClick={submit} loading={submitting} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit feedback'}</Button></>
  return <Modal open={open} onClose={close} title="Give Feedback" width="max-w-2xl" footer={footer}>
    {result ? <div className="py-6 text-center"><CheckCircle2 size={52} className="mx-auto text-leaf-600" /><h4 className="mt-3 text-lg font-semibold text-ink-950">Feedback submitted</h4><p className="mt-1 text-[13px] text-ink-600">Thank you for helping improve services in your area.</p><div className="mx-auto mt-5 max-w-md rounded-xl bg-ink-50 p-4 text-left text-[13px]"><p><span className="text-ink-500">Facility:</span> <strong>{facility?.name}</strong></p><p className="mt-1"><span className="text-ink-500">Feedback reference:</span> <span className="kbd-mono">{result.id}</span></p></div></div> : <div className="space-y-4"><div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4"><div className="flex gap-3"><MessageSquare className="mt-0.5 text-sky-700" size={20} /><div><p className="font-semibold text-ink-950">Help us understand how this facility or service is performing.</p><dl className="mt-2 grid gap-1 text-[12px] text-ink-600"><div><dt className="inline text-ink-500">Facility: </dt><dd className="inline font-medium">{facility?.name}</dd></div><div><dt className="inline text-ink-500">Department: </dt><dd className="inline">{facility?.departmentName || 'Department'}</dd></div><div><dt className="inline text-ink-500">Location: </dt><dd className="inline">{facility?.village || facility?.districtName || 'Location unavailable'}</dd></div></dl><p className="mt-2 text-[11px] text-ink-500">Development feedback questions — not a complaint report.</p></div></div></div>{questions.map((question) => <QuestionRenderer key={question.id} question={question} value={answers[question.id]} onChange={change} invalid={invalid.includes(question.id)} disabled={submitting} />)}{submitError && <p className="rounded-lg border border-alert-200 bg-alert-50 p-3 text-[12px] text-alert-700" role="alert">{submitError}</p>}</div>}
  </Modal>
}
