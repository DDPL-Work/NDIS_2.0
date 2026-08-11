// Minimal deterministic SHA-256-ish content hash for audit signatures.
// This mirrors the existing mock audit-trail convention (0x-prefixed hex,
// VERIFIED_IMMUTABLE). When a real backend exists, hashes are computed
// server-side and verified against the append-only log.

export function sha(input) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  const str = typeof input === 'string' ? input : JSON.stringify(input)
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const value = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return value.toString(16).padStart(16, '0')
}