import { useState } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { AuthService } from '../../services/auth/AuthService'
import { useUiStore } from '../../app/store/uiStore'

// Reusable Change Password Modal
export default function ChangePasswordModal({ open, onClose }) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.old_password) newErrors.old_password = 'Current password is required'
    if (!form.new_password) newErrors.new_password = 'New password is required'
    else if (form.new_password.length < 8) newErrors.new_password = 'Password must be at least 8 characters'
    if (form.new_password !== form.confirm_password) newErrors.confirm_password = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await AuthService.changePassword({
        old_password: form.old_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      })
      pushToast('Password changed successfully', 'success')
      setForm({ old_password: '', new_password: '', confirm_password: '' })
      onClose()
    } catch (error) {
      if (error.fieldErrors) {
        setErrors(error.fieldErrors)
      } else {
        pushToast(error.message || 'Failed to change password', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <Modal open onClose={onClose} width="max-w-md" title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="old_password" className="block text-[12px] font-semibold text-ink-700 mb-1">
            Current Password
          </label>
          <input
            id="old_password"
            type="password"
            value={form.old_password}
            onChange={(e) => setForm((f) => ({ ...f, old_password: e.target.value }))}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500 ${
              errors.old_password ? 'border-alert-500' : 'border-ink-200'
            }`}
            autoComplete="current-password"
            disabled={loading}
          />
          {errors.old_password && <p className="mt-1 text-[11px] text-alert-600">{errors.old_password}</p>}
        </div>

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

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}