import { useState, useCallback } from 'react'
import { MessageSquare, Star, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import GapScoreRing from '../../components/ui/GapScoreRing'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { backendFeedbackApi } from '../../api/feedbackApi'
import CitizenFeedbackWizard from './CitizenFeedbackWizard'

export default function CitizenFeedbackPage({ facility, questionSet, onBack }) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardQuestionSet, setWizardQuestionSet] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleOpenWizard = useCallback(async (fs, qs) => {
    if (!qs) {
      setLoading(true)
      try {
        const sets = await backendFeedbackApi.listQuestionSets({
          department: fs?.departmentId,
          service_type: fs?.serviceType,
          location_type: 'facility',
        })
        const matched = sets.find((s) => s.activeFrom ? new Date(s.activeFrom) <= new Date() : true)
        setWizardQuestionSet(matched || sets[0] || null)
      } catch (err) {
        pushToast('Failed to load feedback form', 'error')
      } finally {
        setLoading(false)
      }
    } else {
      setWizardQuestionSet(qs)
    }
    if (wizardQuestionSet || qs) setShowWizard(true)
  }, [pushToast])

  const handleSubmit = useCallback((payload) => {
    pushToast('Thank you for your feedback!', 'success')
    setShowWizard(false)
    setWizardQuestionSet(null)
  }, [pushToast])

  const handleCancel = useCallback(() => {
    setShowWizard(false)
    setWizardQuestionSet(null)
  }, [])

  if (!facility) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <MessageSquare className="mx-auto text-ink-300 mb-4" size={48} />
          <h2 className="text-lg font-semibold text-ink-950">Select a facility</h2>
          <p className="text-ink-500 mt-2">Tap a facility on the map to give structured feedback.</p>
          <Button variant="outline" onClick={onBack} className="mt-4">Back to Map</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-ink-100 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ChevronLeft size={16} /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-ink-950 truncate">{facility.name}</p>
            <p className="text-[11.5px] text-ink-500 truncate">{facility.village}{facility.block && `, ${facility.block}`}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {facility.gapScore != null && (
              <GapScoreRing score={facility.gapScore} size={36} strokeWidth={4} />
            )}
          </div>
        </div>
      </header>

      {/* Facility Card */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <MessageSquare className="text-sky-600" size={24} />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-ink-950">Share Your Experience</h3>
              <p className="text-[12px] text-ink-500">Help improve services by answering a few quick questions.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatPill icon={<MapPin size={14} />} label="Location" value={facility.village || '—'} />
            <StatPill icon={<MessageSquare size={14} />} label="Feedback Type" value="Structured" />
            <StatPill icon={<CheckCircle2 size={14} />} label="Time" value="< 2 min" />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => handleOpenWizard(facility, questionSet)}
            disabled={loading}
            loading={loading}
          >
            <MessageSquare size={18} /> Give Feedback
          </Button>

          <p className="text-center text-[11px] text-ink-400">
            Your responses are anonymous and used only for service improvement.
          </p>
        </div>

        {/* Nearby facilities with feedback */}
        <div className="rounded-xl border border-ink-100 bg-white p-4">
          <h3 className="text-[13px] font-semibold text-ink-950 mb-3">Nearby Facilities</h3>
          <p className="text-[12px] text-ink-500 text-center py-6">
            Tap facilities on the map to view and submit feedback.
          </p>
        </div>
      </main>

      {/* Feedback Wizard Modal */}
      {showWizard && wizardQuestionSet && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center sm:justify-center p-4">
          <div className="w-full max-w-md sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] bg-white rounded-t-2xl sm:rounded-xl shadow-xl animate-slide-up overflow-hidden">
            <CitizenFeedbackWizard
              facility={facility}
              questionSet={wizardQuestionSet}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatPill({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-ink-500 mb-1">{icon}</div>
      <p className="text-[11px] font-medium text-ink-800 truncate">{value}</p>
      <p className="text-[9px] text-ink-400">{label}</p>
    </div>
  )
}