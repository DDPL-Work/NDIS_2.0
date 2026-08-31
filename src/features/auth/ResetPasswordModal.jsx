import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2, Lock, Mail, RotateCcw } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { AuthService } from '../../services/auth/AuthService'
import { useUiStore } from '../../app/store/uiStore'

// Reset Password Modal - OTP verification + new password
export default function ResetPasswordModal({ isOpen, onClose, initialIdentifier }) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [step, setStep] = useState('otp') // 'otp' | 'password'
  const [form, setForm] = useState({
    identifier: initialIdentifier || '',
    otp: '',
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (initialIdentifier) setForm((f) => ({ ...f, identifier: initialIdentifier }))
  }, [initialIdentifier])

  const validateOtp = () => {
    if (!form.otp.trim()) {
      setErrors({ otp: 'OTP is required' })
      return false
    }
    if (!/^\d{6}$/.test(form.otp)) {
      setErrors({ otp: 'OTP must be 6 digits' })
      return false
    }
    setErrors({})
    return true
  }

  const validatePassword = () => {
    const newErrors = {}
    if (!form.new_password) newErrors.new_password = 'New password is required'
    else if (form.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters'
    if (form.new_password !== form.confirm_password) newErrors.confirm_password = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    if (!validateOtp()) return
    setLoading(true)
    try {
      await AuthService.resetPassword({
        identifier: form.identifier,
        otp: form.otp,
        new_password: 'placeholder', // Will be validated in next step
        confirm_password: 'placeholder',
      })
      setStep('password')
      setSent(true)
      setErrors({})
    } catch (err) {
      if (err.fieldErrors?.otp) setErrors({ otp: err.fieldErrors.otp })
      else if (err.fieldErrors) setErrors(err.fieldErrors)
      else setErrors({ otp: err.message || 'Invalid or expired OTP' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return
    setLoading(true)
    try {
      await AuthService.resetPassword({
        identifier: form.identifier,
        otp: form.otp,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      })
      pushToast('Password reset successfully. You can now sign in.', 'success')
      setForm({ identifier: '', otp: '', new_password: '', confirm_password: '' })
      onClose()
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors)
      else setErrors({ general: err.message || 'Failed to reset password' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal open={isOpen} onClose={onClose} width="max-w-md" title={step === 'otp' ? 'Verify OTP' : 'Set New Password'}>
      {step === 'otp' ? (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <p className="text-[12.5px] text-ink-500">
            A 6-digit OTP has been sent to your registered contact. Enter it below to verify.
          </p>
          <div>
            <label htmlFor="otp" className="block text-[12px] font-semibold text-ink-700 mb-1">
              OTP
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                id="otp"
                type="text"
                value={form.otp}
                onChange={(e) => setForm((f) => ({ ...f, otp: e.target.value }))}
                maxLength={6}
                className={`w-full rounded-lg border pl-10 pr-3 py-2 text-sm outline-none focus:border-sky-500 text-center tracking-widest ${
                  errors.otp ? 'border-alert-500' : 'border-ink-200'
                }`}
                placeholder="000000"
                disabled={loading}
                autoComplete="one-time-code"
              />
            </div>
            {errors.otp && <p className="mt-1 text-[11px] text-alert-600">{errors.otp}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <span className="flex items-center gap-1.5"><RotateCcw size={14} /> Verify OTP</span>}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <p className="text-[12.5px] text-ink-500">
            OTP verified. Please set your new password.
          </p>
          <div>
            <label htmlFor="new_password" className="block text-[12px] font-semibold text-ink-700 mb-1">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              value={form.new_password}
              onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500 ${
                errors.new_password ? 'border-alert-500' : 'border-ink-200'
              }`}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.new_password && <p className="mt-1 text-[11px] text-alert-600">{errors.new_password}</p>}
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-[12px] font-semibold text-ink-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500 ${
                errors.confirm_password ? 'border-alert-500' : 'border-ink-200'
              }`}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.confirm_password && <p className="mt-1 text-[11px] text-alert-600">{errors.confirm_password}</p>}
          </div>

          {errors.general && <p className="text-[11px] text-alert-600">{errors.general}</p>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep('otp')} disabled={loading} className="flex-1">
              Back
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Reset Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}