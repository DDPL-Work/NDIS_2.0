// Node ESM loader — resolves extensionless relative imports (the app's
// established import style, e.g. `from '../../utils/geo'`) for Node test runs.
import { existsSync } from 'node:fs'
import { resolve as resolvePath, dirname, join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    const base = fileURLToPath(context.parentURL)
    const candidate = resolvePath(dirname(base), specifier)
    const withExt = existsSync(candidate) ? candidate
      : existsSync(`${candidate}.js`) ? `${candidate}.js`
      : existsSync(join(candidate, 'index.js')) ? join(candidate, 'index.js')
      : null
    if (withExt) return { url: pathToFileURL(withExt).href, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}