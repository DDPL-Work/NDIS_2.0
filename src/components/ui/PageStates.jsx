import { AlertTriangle, ArrowLeft, Clock, RefreshCw, ShieldAlert, WifiOff, ServerCrash, Database, Search } from 'lucide-react'
import Button from './Button'

export function LoadingState({ label = 'Loading data…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-sky-600" />
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action, compact }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}>
      {Icon && <div className={`grid h-10 w-10 place-items-center rounded-full bg-ink-100 text-ink-400 ${compact ? 'mb-2' : 'mb-3'}`}><Icon size={18} /></div>}
      <h4 className="text-[14px] font-semibold text-ink-800">{title}</h4>
      {description && <p className="text-[12.5px] text-ink-500 mt-1 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Unable to load data', message, status, onRetry, onBack }) {
  const is401 = status === 401
  const is403 = status === 403
  const is404 = status === 404
  const is429 = status === 429
  const is5xx = status >= 500 && status < 600

  const IconComponent = is401 || is403 ? ShieldAlert : is404 ? Search : is429 ? Clock : is5xx ? ServerCrash : WifiOff

  const defaultTitle = is401 ? 'Authentication required' : is403 ? 'Access denied' : is404 ? 'Not found' : is429 ? 'Rate limited' : is5xx ? 'Server error' : title
  const defaultMsg = is401
    ? 'Your session has expired. Please sign in again.'
    : is403
    ? 'You do not have permission to access this information.'
    : is404
    ? 'The requested resource was not found on the server.'
    : is429
    ? 'Too many requests. Please wait a moment and try again.'
    : is5xx
    ? 'The server encountered an internal error. Please try again later.'
    : message || 'An unexpected error occurred.'

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-alert-50 text-alert-500 mb-3">
        <IconComponent size={20} />
      </div>
      <h4 className="text-[14px] font-semibold text-ink-800">{defaultTitle}</h4>
      <p className="text-[12.5px] text-ink-500 mt-1 max-w-sm leading-relaxed">{defaultMsg}</p>
      <div className="mt-4 flex gap-2">
        {onBack && (
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>
            Go back
          </Button>
        )}
        {onRetry && (
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

export function AccessDenied({ permission, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-alert-50 text-alert-500 mb-3">
        <ShieldAlert size={20} />
      </div>
      <h4 className="text-[14px] font-semibold text-ink-800">Access denied</h4>
      <p className="text-[12.5px] text-ink-500 mt-1 max-w-sm leading-relaxed">
        {permission
          ? `Your active role does not grant the "${permission}" permission.`
          : 'You do not have permission to access this information.'}
      </p>
      {onBack && (
        <div className="mt-4">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>Go back</Button>
        </div>
      )}
    </div>
  )
}

export function NotFoundState({ resource = 'page', onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400 mb-3">
        <Search size={20} />
      </div>
      <h4 className="text-[14px] font-semibold text-ink-800">Not found</h4>
      <p className="text-[12.5px] text-ink-500 mt-1 max-w-sm leading-relaxed">
        The {resource} you are looking for does not exist or has been removed.
      </p>
      {onBack && (
        <div className="mt-4">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={onBack}>Go back</Button>
        </div>
      )}
    </div>
  )
}

export function RetryButton({ onClick, loading, size = 'sm' }) {
  return (
    <Button variant="outline" size={size} icon={RefreshCw} onClick={onClick} disabled={loading}>
      {loading ? 'Retrying…' : 'Retry'}
    </Button>
  )
}

export function InlineApiError({ error, onRetry, className = '' }) {
  if (!error) return null
  const status = error.status
  const isAuth = status === 401 || status === 403
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{isAuth ? 'Restricted information' : 'Unable to load data'}</p>
          <p className="mt-0.5 text-xs text-red-600">
            {isAuth ? 'You are not authorized to access this information.' : error.message || 'An error occurred.'}
          </p>
        </div>
        {onRetry && !isAuth && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="shrink-0">
            <RefreshCw size={13} />
          </Button>
        )}
      </div>
    </div>
  )
}

export function LastUpdated({ date, source = 'backend' }) {
  if (!date) return null
  const formatted = new Date(date).toLocaleString()
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-ink-400">
      <Clock size={10} />
      <span>Updated {formatted}</span>
      {source && <span className="text-ink-300">· {source}</span>}
    </div>
  )
}

export function DataSource({ source, className = '' }) {
  if (!source) return null
  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-[10px] text-ink-400 ${className}`}>
      <Database size={9} />
      <span>{source}</span>
    </div>
  )
}
