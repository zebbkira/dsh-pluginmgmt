/** Mount smoke: import the built entry and drive apply() with a mock ctx,
 * asserting the entry contract (name/inject/apply) and surface registration.
 * This catches entry-import errors and defineTool schema violations without a
 * web restart. */
import { name, inject, apply } from '../lib/index.js'

const routes = []
const tools = []
const effects = []
const ctx = {
  effect(fn, label) { effects.push(label); const d = fn(); return typeof d === 'function' ? d : () => {} },
  systemPrompt: { section: () => () => {} },
  webServer: { register: (r) => { routes.push(r); return () => {} } },
  tools: { register: (t) => { tools.push(t); return () => {} } },
  loader: { entries: () => [] },
}

if (name !== 'dsh-pluginmgmt') throw new Error('bad name: ' + name)
if (!Array.isArray(inject)) throw new Error('inject not an array')
if (typeof apply !== 'function') throw new Error('apply not a function')

apply(ctx)

const paths = routes.map((r) => r.path)
if (new Set(paths).size !== paths.length) throw new Error('duplicate route paths: ' + paths.join(', '))
if (routes.length < 10) throw new Error('expected >=10 routes, got ' + routes.length)
if (tools.length !== 7) throw new Error('expected 7 tools, got ' + tools.length)

console.log('name =', name)
console.log('inject =', inject.join(', '))
console.log('routes =', routes.length, '->', routes.map((r) => r.path).join(', '))
console.log('tools =', tools.length, '->', tools.map((t) => t.name).join(', '))
console.log('effects =', effects.join(', '))
console.log('SMOKE OK')
process.exit(0)
