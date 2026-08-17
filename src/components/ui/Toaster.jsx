import { useUiStore } from '../../app/store/uiStore'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import clsx from 'clsx'

const ICONS = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: AlertTriangle }

export default function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)
  return (
    <div className="fixed bottom-4 z-[100] inset-x-4 sm:inset-x-auto sm:right-4 flex flex-col gap-2 sm:w-full sm:max-w-xs">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone] || Info
        return (
          <div key={t.id} className={clsx(
            'animate-fade-in flex items-start gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-popover',
            t.tone === 'success' && 'border-leaf-200', t.tone === 'error' && 'border-alert-200',
            t.tone === 'warning' && 'border-saffron-200', t.tone === 'info' && 'border-ink-200'
          )}>
            <Icon size={17} className={clsx(
              t.tone === 'success' && 'text-leaf-600', t.tone === 'error' && 'text-alert-500',
              t.tone === 'warning' && 'text-saffron-600', t.tone === 'info' && 'text-ink-500'
            )} />
            <p className="text-[13px] text-ink-800 flex-1 break-words">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-700"><X size={14} /></button>
          </div>
        )
      })}
    </div>
  )
}