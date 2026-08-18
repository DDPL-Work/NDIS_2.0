// Device-local notification read tracking.
//
// The notification API exposes only the list endpoint — there is no backend
// mark-read action — so "read" is a local preference stored on this device
// (key ndisp.notifications.read, a JSON array of notification ids).  It is
// applied ON TOP of the server-reported `read` flag: a notification is unread
// only when the backend says so AND this device has never marked it read.
// When the gateway gains a mark-read endpoint, this layer can be swapped for
// the API call without touching the UI.
const READ_KEY = 'ndisp.notifications.read'

export function getLocallyReadIds() {
  try {
    const raw = localStorage.getItem(READ_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function markReadLocal(ids) {
  const next = new Set(getLocallyReadIds())
  for (const id of ids) if (id != null) next.add(String(id))
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...next]))
  } catch { /* storage unavailable — read state stays in memory */ }
  return next
}

export function isReadLocally(id, serverRead = false) {
  return Boolean(serverRead) || getLocallyReadIds().has(String(id))
}