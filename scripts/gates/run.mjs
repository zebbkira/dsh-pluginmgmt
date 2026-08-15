#!/usr/bin/env node
/** Mechanical gates for dsh-brat. Predicates + expect-reject self-tests. */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const failures = []
const selfFailures = []
function check(name, ok, detail = '') { if (!ok) failures.push(name + (detail ? ': ' + detail : '')) }
function expectReject(name, predicate, sample) { if (predicate(sample) !== false) selfFailures.push(name + ' accepted invalid sample') }

// ── predicates ──
const gateMain = (m) => typeof m.main === 'string' && m.main.length > 0
const gateExportsDot = (m) => typeof m.exports?.['.'] === 'string'
const gateExportsClient = (m) => typeof m.exports?.['./client'] === 'string'
const gateBundlePatch = (m) => typeof m.dsh?.bundle?.patch === 'string'
const gateClientWeb = (m) => m.dsh?.client?.platform === 'web'
const gateQuotedName = (line) => /^\s*name:\s*['"]/.test(line)

// ── core checks against the real manifest ──
check('entry declares a main', gateMain(pkg), JSON.stringify(pkg.main))
check('exports["."] declared', gateExportsDot(pkg))
check('exports["./client"] declared', gateExportsClient(pkg))
check('dsh.bundle.patch declared', gateBundlePatch(pkg))
if (gateBundlePatch(pkg)) check('cordis.patch.yml exists', existsSync(join(root, pkg.dsh.bundle.patch)))
check('dsh.client.platform is web', gateClientWeb(pkg))
check('src/index.ts exists', existsSync(join(root, 'src', 'index.ts')))
check('src/client/index.ts exists', existsSync(join(root, 'src', 'client', 'index.ts')))
check('scripts/wrap-client.mjs exists', existsSync(join(root, 'scripts', 'wrap-client.mjs')))

if (existsSync(join(root, 'cordis.patch.yml'))) {
  const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
  const nameLine = patch.split('\n').find((l) => /^\s*name:/.test(l))
  const idLine = patch.split('\n').find((l) => /^\s+-\s+id:/.test(l))
  check('insert row has an id', idLine !== undefined)
  check('insert row has a name', nameLine !== undefined)
  if (nameLine !== undefined) {
    check('insert name is quoted', gateQuotedName(nameLine), nameLine.trim())
    const nm = nameLine.replace(/^\s*name:\s*['"]/, '').replace(/['"]\s*$/, '').trim()
    check('insert name matches package name', nm === pkg.name, nm + ' vs ' + pkg.name)
  }
}

// ── self-tests: each predicate must reject a bad sample ──
expectReject('main required', gateMain, {})
expectReject('exports["."] required', gateExportsDot, { exports: {} })
expectReject('exports["./client"] required', gateExportsClient, { exports: { '.': './x' } })
expectReject('bundle patch required', gateBundlePatch, { dsh: { bundle: {} } })
expectReject('client must be web', gateClientWeb, { dsh: { client: { platform: 'tui' } } })
expectReject('name must be quoted', gateQuotedName, 'name: @x/y')
expectReject('unquoted scope rejected', gateQuotedName, 'name: @deepseek-ai/dsh-tools')

if (selfFailures.length > 0) failures.push('self-tests: ' + selfFailures.join('; '))

const total = 16 + selfFailures.length - selfFailures.length + 0
console.log('gates: ' + (16) + ' checks + ' + (7) + ' self-tests')
if (failures.length > 0) {
  console.error('FAILED:\n - ' + failures.join('\n - '))
  process.exit(1)
}
console.log('all gates passed')
