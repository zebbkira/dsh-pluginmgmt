/** End-to-end smoke against a TEMP profile (never touches the real web
 * profile): install a real git plugin, list it, then remove it. Run with:
 *   node --experimental-strip-types scripts/e2e.mjs
 */
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const home = mkdtempSync(join(tmpdir(), 'dsh-brat-e2e-'))
process.env.DSH_HOME = home
const profile = join(home, 'profiles', 'web')
mkdirSync(profile, { recursive: true })
writeFileSync(join(profile, 'package.json'), JSON.stringify({ name: 'dsh-profile-web', private: true, dependencies: {}, dsh: { profile: { bundles: [] } } }, null, 2) + '\n')
writeFileSync(join(profile, 'cordis.patch.yml'), '[]\n')
writeFileSync(join(profile, 'pnpm-workspace.yaml'), 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n')

const { installPlugin, removePlugin } = await import('../src/engine/manager.ts')
const { listPlugins } = await import('../src/engine/list.ts')
const { readRegistry } = await import('../src/engine/registry.ts')

console.log('[e2e] installing dsh-annotation into temp profile...')
const r = await installPlugin({ url: 'https://github.com/omdsh-dev/dsh-annotation' })
console.log('[e2e] install =', JSON.stringify(r))
if (!r.ok) { rmSync(home, { recursive: true, force: true }); process.exit(1) }

const manifest = JSON.parse(readFileSync(join(profile, 'package.json'), 'utf8'))
console.log('[e2e] deps =', JSON.stringify(manifest.dependencies))
console.log('[e2e] bundles =', JSON.stringify(manifest.dsh?.profile?.bundles))
if (manifest.dependencies?.['@omdsh-dev/dsh-annotation'] === undefined) { console.error('[e2e] FAIL: dep missing'); process.exit(1) }
if (!(manifest.dsh?.profile?.bundles ?? []).includes('@omdsh-dev/dsh-annotation')) { console.error('[e2e] FAIL: bundle layer missing'); process.exit(1) }

const rows = listPlugins(profile, [])
console.log('[e2e] list =', rows.map((x) => x.name + ':' + x.type + (x.managedByBrat ? ':managed' : '')).join(', '))
if (!rows.some((x) => x.name === '@omdsh-dev/dsh-annotation')) { console.error('[e2e] FAIL: not listed'); process.exit(1) }

const reg = readRegistry()
console.log('[e2e] registry keys =', Object.keys(reg.plugins).join(', '))

console.log('[e2e] removing...')
const rm = await removePlugin('@omdsh-dev/dsh-annotation')
console.log('[e2e] remove =', JSON.stringify(rm))
const manifest2 = JSON.parse(readFileSync(join(profile, 'package.json'), 'utf8'))
console.log('[e2e] deps after remove =', JSON.stringify(manifest2.dependencies))
if ((manifest2.dependencies ?? {})['@omdsh-dev/dsh-annotation'] !== undefined) { console.error('[e2e] FAIL: dep not removed'); process.exit(1) }

rmSync(home, { recursive: true, force: true })
console.log('[e2e] E2E OK')
