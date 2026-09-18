import { tokenManager } from './auth/tokenManager.js'

// The citizen deployment consumes the published Nalanda backend by default.
// A local or staging server can still override this through VITE_API_BASE_URL.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}
const API_BASE_URL = (env.VITE_API_BASE_URL || 'https://nalanda.drdesigntech.com/api').replace(/\/$/, '')

// Refresh lock: only one token refresh in flight at a time
let refreshPromise = null

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

function messageFor(status, body) {
  if (body?.detail) return body.detail
  if (body?.message) return body.message
  return ({
    400: 'Please check the submitted information.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission for this action.',
    404: 'The requested resource was not found.',
    409: 'There is a conflict with the current state of the resource.',
    422: 'The submitted information is invalid.',
    429: 'Too many requests. Please try again later.',
    500: 'The service is temporarily unavailable.',
    502: 'The service is temporarily unavailable.',
    503: 'The service is temporarily unavailable.',
  })[status] || 'The request could not be completed.'
}

function extractFieldErrors(body) {
  if (!body || typeof body !== 'object') return null
  const errors = {}
  let hasErrors = false
  for (const [key, value] of Object.entries(body)) {
    if (key === 'detail' || key === 'message' || key === 'non_field_errors') continue
    if (Array.isArray(value) && value.length > 0) {
      errors[key] = value[0]
      hasErrors = true
    } else if (typeof value === 'string' && value) {
      errors[key] = value
      hasErrors = true
    }
  }
  return hasErrors ? errors : null
}

// ---------------------------------------------------------------------------
// ApiError — unified error type for all API failures
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(status, body, url, method) {
    super(messageFor(status, body))
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.url = url
    this.method = method
    this.fieldErrors = extractFieldErrors(body)
    this.isNetworkError = false
    this.isTimeout = false
    this.isAborted = false
    this.isRateLimited = status === 429
    this.isConflict = status === 409
    this.retryAfter = null
    this.code = body?.code || null
  }

  static networkError(message, url, method) {
    const err = new ApiError(0, null, url, method)
    err.message = message
    err.isNetworkError = true
    return err
  }

  static timeoutError(message, url, method) {
    const err = new ApiError(408, null, url, method)
    err.message = message
    err.isTimeout = true
    return err
  }

  static abortError(message, url, method) {
    const err = new ApiError(499, null, url, method)
    err.message = message
    err.isAborted = true
    return err
  }
}

// ---------------------------------------------------------------------------
// Token refresh — single in-flight mutex with queue draining
// ---------------------------------------------------------------------------

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  const { refresh } = tokenManager.get()
  if (!refresh) throw new ApiError(401, null, '/auth/token/refresh/', 'POST')

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok || !body.access) throw new ApiError(response.status, body, '/auth/token/refresh/', 'POST')
      const old = tokenManager.get()
      tokenManager.save({ access: body.access, refresh: body.refresh || refresh, user: old.user })
      return body.access
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ---------------------------------------------------------------------------
// Query string builder
// ---------------------------------------------------------------------------

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item))
        }
      }
    } else {
      searchParams.set(key, String(value))
    }
  }
  return searchParams.toString()
}

// Convenience: append query string to a path if params are present.
function withQuery(path, params) {
  const qs = buildQueryString(params)
  return qs ? `${path}?${qs}` : path
}

// ---------------------------------------------------------------------------
// Response normalization — consistent extraction from backend envelopes
// ---------------------------------------------------------------------------

// Normalize any backend response into a flat array of rows.
// Handles: bare arrays, { results: [...] }, { data: [...] }, { records: [...] },
// { inspections: [...] }, { proposals: [...] }, nested collection wrappers,
// and paginated envelopes.
function normalizeRows(response) {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    // Direct array properties
    if (Array.isArray(response.results)) return response.results
    if (Array.isArray(response.data)) return response.data
    if (Array.isArray(response.records)) return response.records
    // Named collection keys (inspections, proposals, complaints, etc.)
    if (Array.isArray(response.inspections)) return response.inspections
    if (Array.isArray(response.proposals)) return response.proposals
    if (Array.isArray(response.complaints)) return response.complaints
    // Nested paginated envelopes: { data: { results } }, { data: { records } }
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      if (Array.isArray(response.data.results)) return response.data.results
      if (Array.isArray(response.data.records)) return response.data.records
      if (Array.isArray(response.data.inspections)) return response.data.inspections
      if (Array.isArray(response.data.proposals)) return response.data.proposals
    }
    // Fallback: scan ALL values for the first array found
    const values = Object.values(response)
    for (const val of values) {
      if (Array.isArray(val)) return val
    }
  }
  return []
}

// Extract pagination metadata when present.
function normalizePagination(response) {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return { count: 0, next: null, previous: null }
  }
  return {
    count: response.count ?? 0,
    next: response.next ?? null,
    previous: response.previous ?? null,
  }
}

// ---------------------------------------------------------------------------
// Request ID tracking — prevents stale responses from overwriting newer state
// ---------------------------------------------------------------------------

let requestCounter = 0
function nextRequestId() {
  requestCounter += 1
  return requestCounter
}

// ---------------------------------------------------------------------------
// 429 Retry-After parsing
// ---------------------------------------------------------------------------

function parseRetryAfter(response) {
  const header = response.headers?.get?.('Retry-After')
  if (!header) return null
  const seconds = Number(header)
  return Number.isFinite(seconds) ? seconds * 1000 : null
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

export async function apiRequest(path, {
  method = 'GET',
  body,
  headers = {},
  authenticated = true,
  retry = true,
  timeout = 15000,
  raw = false,
  signal,
} = {}) {
  const fullUrl = `${API_BASE_URL}${path}`
  const requestId = nextRequestId()
  let access = tokenManager.get().access

  if (authenticated && tokenManager.isExpired() && tokenManager.get().refresh) {
    access = await refreshAccessToken()
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  // Support external AbortSignal
  let externalAbortHandler = null
  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      externalAbortHandler = () => controller.abort()
      signal.addEventListener('abort', externalAbortHandler)
    }
  }

  try {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    const requestHeaders = {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(authenticated && access ? { Authorization: `Bearer ${access}` } : {}),
      ...headers,
    }

    const response = await fetch(fullUrl, {
      method,
      signal: controller.signal,
      headers: requestHeaders,
      ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    })

    // Handle 401 with single refresh retry
    if (response.status === 401 && authenticated && retry && tokenManager.get().refresh) {
      try {
        await refreshAccessToken()
        return apiRequest(path, { method, body, headers, authenticated, retry: false, timeout, raw, signal })
      } catch {
        tokenManager.clear()
        window.dispatchEvent(new Event('ndisp-auth-expired'))
        throw new ApiError(401, { detail: 'Session expired. Please sign in again.' }, fullUrl, method)
      }
    }

    // Handle 429 Rate Limited — expose Retry-After to callers
    if (response.status === 429) {
      const retryAfter = parseRetryAfter(response)
      const data = await response.json().catch(() => ({}))
      const err = new ApiError(429, data, fullUrl, method)
      err.retryAfter = retryAfter
      throw err
    }

    if (raw) {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new ApiError(response.status, data, fullUrl, method)
      }
      return Object.assign(response, { requestId })
    }

    const data = response.status === 204 ? null : await response.json().catch(() => ({}))
    if (!response.ok) throw new ApiError(response.status, data, fullUrl, method)

    // Attach requestId so callers can detect stale responses
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      data._requestId = requestId
    }
    return data
  } catch (error) {
    if (error.name === 'AbortError' || error?.code === 'ECONNABORTED') {
      throw ApiError.timeoutError('The request timed out. Please try again.', fullUrl, method)
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw ApiError.networkError('Network error. Please check your connection.', fullUrl, method)
    }
    if (error instanceof ApiError) throw error
    throw new ApiError(0, { message: error?.message }, fullUrl, method)
  } finally {
    window.clearTimeout(timer)
    if (externalAbortHandler && signal) {
      signal.removeEventListener('abort', externalAbortHandler)
    }
  }
}

// ---------------------------------------------------------------------------
// File download — returns a Blob with metadata
// ---------------------------------------------------------------------------

async function downloadFile(path, { timeout: dlTimeout = 60000, signal, headers: extraHeaders = {} } = {}) {
  const fullUrl = `${API_BASE_URL}${path}`
  const requestId = nextRequestId()
  let access = tokenManager.get().access

  if (tokenManager.isExpired() && tokenManager.get().refresh) {
    access = await refreshAccessToken()
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), dlTimeout)

  let externalAbortHandler = null
  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      externalAbortHandler = () => controller.abort()
      signal.addEventListener('abort', externalAbortHandler)
    }
  }

  try {
    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        Accept: '*/*',
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...extraHeaders,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new ApiError(response.status, data, fullUrl, 'GET')
    }

    const disposition = response.headers.get('Content-Disposition') || ''
    const match = disposition.match(/filename="?([^";]+)"?/)
    const filename = match ? match[1] : ''
    const contentType = response.headers.get('Content-Type') || ''

    return {
      blob: await response.blob(),
      filename,
      contentType,
      requestId,
    }
  } finally {
    window.clearTimeout(timer)
    if (externalAbortHandler && signal) {
      signal.removeEventListener('abort', externalAbortHandler)
    }
  }
}

// ---------------------------------------------------------------------------
// Logout helper — clears tokens and notifies the app
// ---------------------------------------------------------------------------

function logout() {
  tokenManager.clear()
  window.dispatchEvent(new Event('ndisp-auth-expired'))
}

export {
  buildQueryString,
  withQuery,
  normalizeRows,
  normalizePagination,
  downloadFile,
  logout,
}
