const PREFIX = 'ndisp-gis-window-'
export const GISWindowManager = {
  load(id, fallback) { try { return { ...fallback, ...(JSON.parse(localStorage.getItem(`${PREFIX}${id}`)) || {}) } } catch { return fallback } },
  save(id, layout) { try { localStorage.setItem(`${PREFIX}${id}`, JSON.stringify(layout)) } catch { /* storage may be unavailable */ } },
  bringToFront() { const next = Number(localStorage.getItem('ndisp-gis-window-z') || 40) + 1; localStorage.setItem('ndisp-gis-window-z', String(next)); return next },
}
