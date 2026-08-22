import { useState, useEffect, useCallback } from 'react'
import { Check, ChevronRight, Star, MessageSquare, AlertCircle, Loader2 } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { backendFeedbackApi } from '../../api/feedbackApi'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { FEEDBACK_RESPONSE_TYPES, validateResponse, formatResponse } from '../feedback/feedbackConstants'

// Rating component for 1-5 stars
function Rating({ value, onChange, disabled, size = 'md' }) {
  const stars = [1, 2, 3, 4, 5]
  const sizeClasses = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          disabled={disabled}
          className={`transition-colors ${sizeClasses[size]} ${
            star <= value ? 'text-saffron-500' : 'text-ink-200 hover:text-saffron-300'
          }`}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          aria-checked={star <= value}
        >
          <Star size={24} fill={star <= value ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}

// Single question renderer
function QuestionCard({ question, response, onChange, isSubmitting }) {
  const isRequired = question.required
  const error = validateResponse(question.responseType, response, question.options || [])

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <label className="flex items-center gap-1.5 text-[13px] font-medium text-ink-950">
            {question.text}
            {isRequired && <span className="text-alert-500" aria-hidden="true">*</span>}
          </label>
          {question.helpText && <p className="text-[11.5px] text-ink-500 mt-0.5">{question.helpText}</p>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-[12px] text-alert-600 bg-alert-50 rounded-lg p-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div>
        {question.responseType === FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE && (
          <div className="space-y-2" role="radiogroup" aria-label={question.text}>
            {question.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 p-3 rounded-lg border border-ink-200 bg-white hover:border-sky-300 hover:bg-sky-50 cursor-pointer transition">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={opt.value}
                  checked={response === opt.value}
                  onChange={() => onChange(question.id, opt.value)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-sky-600 border-ink-300 focus:ring-sky-500"
                />
                <span className="text-[13px] text-ink-800">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.responseType === FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE && (
          <div className="space-y-2" role="group" aria-label={question.text}>
            {question.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 p-3 rounded-lg border border-ink-200 bg-white hover:border-sky-300 hover:bg-sky-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={Array.isArray(response) && response.includes(opt.value)}
                  onChange={(e) => {
                    const current = Array.isArray(response) ? response : []
                    if (e.target.checked) {
                      onChange(question.id, [...current, opt.value])
                    } else {
                      onChange(question.id, current.filter((v) => v !== opt.value))
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-sky-600 rounded border-ink-300 focus:ring-sky-500"
                />
                <span className="text-[13px] text-ink-800">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {question.responseType === FEEDBACK_RESPONSE_TYPES.RATING && (
          <div className="flex items-center gap-3">
            <Rating value={Number(response) || 0} onChange={(v) => onChange(question.id, v)} disabled={isSubmitting} size="lg" />
            {response && <span className="text-sky-700 font-semibold text-[14px]">{Number(response)}/5</span>}
          </div>
        )}

        {question.responseType === FEEDBACK_RESPONSE_TYPES.TEXT && (
          <textarea
            value={response || ''}
            onChange={(e) => onChange(question.id, e.target.value)}
            disabled={isSubmitting}
            placeholder="Share your experience…"
            rows={3}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        )}
      </div>
    </div>
  )
}

// Mobile-first feedback wizard
export default function CitizenFeedbackWizard({ facility, questionSet, onSubmit, onCancel }) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const questions = questionSet?.questions || []
  const totalSteps = questions.length

  // Handle facility/service context
  const context = {
    facilityId: facility?.id,
    facilityName: facility?.name,
    village: facility?.village,
    block: facility?.block,
    departmentId: facility?.departmentId,
  }

  const currentQuestion = questions[currentStep]
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  const handleResponseChange = useCallback((questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }, [])

  const handleNext = () => {
    if (!currentQuestion) return
    const val = responses[currentQuestion.id]
    const err = validateResponse(currentQuestion.responseType, val, currentQuestion.options || [])
    if (err && currentQuestion.required) {
      setError(err)
      return
    }
    setError(null)
    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  const handleSubmit = async () => {
    // Validate all required questions
    const missing = questions
      .filter((q) => q.required)
      .filter((q) => {
        const val = responses[q.id]
        return val === undefined || val === '' || (Array.isArray(val) && val.length === 0)
      })
    if (missing.length > 0) {
      setError('Please answer all required questions')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        questionSetId: questionSet.id,
        facilityId: facility?.id,
        location: facility?.position ? { lng: facility.position[0], lat: facility.position[1] } : null,
        village: facility?.village,
        block: facility?.block,
        responses: Object.entries(responses).map(([questionId, value]) => ({
          questionId,
          value,
        })),
      }

      await backendFeedbackApi.createSubmission(payload)
      pushToast('Feedback submitted successfully!', 'success')
      onSubmit?.(payload)
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.')
      pushToast('Failed to submit feedback', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!questionSet || !questions.length) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <MessageSquare className="mx-auto text-ink-300 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-ink-950">No feedback questions available</h2>
          <p className="text-ink-500 mt-2">This facility does not have a structured feedback form configured yet.</p>
          <Button variant="outline" onClick={onCancel} className="mt-4">Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Progress Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-ink-100 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-ink-500 truncate">{questionSet.title || 'Feedback'}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-ink-400 shrink-0">
                {currentStep + 1} / {totalSteps}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {facility && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <MessageSquare className="text-sky-600" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-950 truncate">{facility.name}</p>
              <p className="text-[11.5px] text-ink-500 truncate">
                {facility.village}{facility.block && `, ${facility.block}`}
              </p>
            </div>
          </div>
        )}

        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            response={responses[currentQuestion.id]}
            onChange={handleResponseChange}
            isSubmitting={submitting}
          />
        )}

        {error && (
          <div className="rounded-lg border border-alert-200 bg-alert-50 p-3 text-[12.5px] text-alert-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {error && !currentQuestion && (
          <div className="rounded-lg border border-alert-200 bg-alert-50 p-3 text-[12.5px] text-alert-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className="sticky bottom-0 z-10 bg-white border-t border-ink-100 px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
          {!isFirstStep && (
            <Button variant="outline" onClick={handleBack} disabled={submitting} className="flex-1">
              <ChevronRight className="-rotate-90" size={16} /> Back
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={submitting}
            loading={submitting}
            className={`flex-1 ${!isFirstStep ? '' : 'ml-auto'}`}
          >
            {isLastStep ? 'Submit Feedback' : 'Next'}
            {!isFirstStep && <ChevronRight size={16} />}
          </Button>
        </div>
      </footer>
    </div>
  )
}