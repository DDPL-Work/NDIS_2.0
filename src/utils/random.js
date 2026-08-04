// Deterministic PRNG (mulberry32) so mock data (facility positions, KPI numbers)
// stays stable across reloads instead of reshuffling on every render — makes the
// demo feel like a real, persisted dataset rather than obviously randomized.
export function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i)
    h |= 0
  }
  return h
}

export function makeRng(seedStr) {
  return mulberry32(hashSeed(seedStr))
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

export function pickWeighted(rng, entries) {
  // entries: [[value, weight], ...]
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [value, weight] of entries) {
    r -= weight
    if (r <= 0) return value
  }
  return entries[entries.length - 1][0]
}

export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function randFloat(rng, min, max, decimals = 2) {
  const v = rng() * (max - min) + min
  return Number(v.toFixed(decimals))
}
