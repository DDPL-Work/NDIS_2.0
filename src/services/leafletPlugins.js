// leaflet.heat / leaflet.markercluster attach to a global `L` (bare identifier
// in their sources), while Vite bundles Leaflet's ESM build which never sets
// window.L.  Bootstrap the global before the plugins evaluate.
import L from 'leaflet'

let pluginsPromise = null

export function ensureLeafletPlugins() {
  if (!pluginsPromise) {
    if (typeof window !== 'undefined' && !window.L) window.L = L
    pluginsPromise = Promise.all([import('leaflet.heat'), import('leaflet.markercluster')]).then(() => {})
  }
  return pluginsPromise
}
