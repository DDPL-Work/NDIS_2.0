import { useState } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2, Mail, RotateCcw } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { AuthService } from '../../services/auth/AuthService'
import { useUiStore } from '../../app/store/uiStore'

// Forgot Password Modal - requests OTP
export default function ForgotPasswordModal({ isOpen, onClose, onOtpSent }) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [form, setForm] = useState({ identifier: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.identifier.trim()) {
      setError('Username or email is required')
      return
    }
    setLoading(true)
    try {
      await AuthService.forgotPassword({ identifier: form.identifier.trim() })
      pushToast('If the account exists, a password reset OTP has been sent', 'success')
      setForm({ identifier: '' })
      onClose()
      if (onOtpSent) onOtpSent(form.identifier.trim())
    } catch (err) {
      setError(err.message || 'Failed to send reset OTP')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal open={isOpen} onClose={onClose} title="Reset Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-[12.5px] text-ink-500">
          Enter your username or registered email. If the account exists, a 6-digit OTP will be sent to you.
        </p>
        <div>
          <label htmlFor="identifier" className="block text-[12px] font-semibold text-ink-700 mb-1">
            Username or Email
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="identifier"
              type="text"
              value={form.identifier}
              onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
              className={`w-full rounded-lg border pl-10 pr-3 py-2 text-sm outline-none focus:border-sky-500 ${
                error ? 'border-alert-500' : 'border-ink-200'
              }`}
              placeholder="username or email"
              disabled={loading}
            />
          </div>
          {error && <p className="mt-1 text-[11px] text-alert-600">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <span className="flex items-center gap-1.5"><RotateCcw size={14} /> Send OTP</span>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}