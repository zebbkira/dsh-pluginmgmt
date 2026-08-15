/** Merge profile manifest + patch + runtime entries into installed-plugin rows. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { InstalledPlugin, PluginType, RuntimePhase } from '../protocol.ts'
import { getBundleEntryId, resolvePackageDir } from './entry.ts'
import { readPatch } from './patch.ts'
import { readProfileManifest } from './reconcile.ts'
import { readRegistry } from './registry.ts'

export interface RuntimeEntry {
  entryId: string
  moduleName: string
  enabled: boolean
  phase: RuntimePhase
}

function isGitSpec(spec: string): boolean {
  return spec.startsWith('github:') || spec.startsWith('git+') || spec.startsWith('git:') || spec.includes('.git')
}

/** Derive a github.com URL from a git spec (undefined for npm specs). */
function gitSpecUrl(spec: string, entryOwner?: string, entryRepo?: string): string | undefined {
  if (entryOwner !== undefined && entryRepo !== undefined) return 'https://github.com/' + entryOwner + '/' + entryRepo
  if (spec.startsWith('github:')) {
    const rest = spec.slice('github:'.length).split('#')[0]
    return 'https://github.com/' + rest.replace(/&.*$/, '')
  }
  if (spec.startsWith('git+')) return spec.slice('git+'.length).replace(/#.*$/, '').replace(/\.git$/, '')
  return undefined
}

/** The actual installed version (semver for npm, short commit for git). */
function installedVersion(name: string, spec: string, entry: { ref?: string } | undefined, profileDir: string): string {
  const dir = resolvePackageDir(name, profileDir)
  if (dir !== null) {
    try {
      const m = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { version?: string }
      if (typeof m.version === 'string' && m.version !== '') return m.version
    } catch { /* fall through */ }
  }
  if (entry?.ref !== undefined && entry.ref !== '') return entry.ref.slice(0, 7)
  if (isGitSpec(spec)) {
    const hash = spec.indexOf('#')
    if (hash >= 0) return spec.slice(hash + 1).split('&')[0].slice(0, 7)
    return 'git'
  }
  return spec
}

/** Normalize a repository/homepage value to a clickable github.com URL. */
function normalizeGithubUrl(url: string): string | undefined {
  let s = url.trim().replace(/^git\+/, '')
  if (s.startsWith('git@github.com:')) s = 'https://github.com/' + s.slice('git@github.com:'.length)
  else if (s.startsWith('git://github.com/')) s = 'https://github.com/' + s.slice('git://github.com/'.length)
  s = s.replace(/\.git$/, '').replace(/#.*$/, '')
  if (s.startsWith('https://github.com/') || s.startsWith('http://github.com/')) return s
  return undefined
}

/** Derive a GitHub URL from an installed package's repository/homepage field. */
function githubUrlFromPackage(packageName: string, profileDir: string): string | undefined {
  const dir = resolvePackageDir(packageName, profileDir)
  if (dir === null) return undefined
  let manifest: Record<string, unknown>
  try { manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Record<string, unknown> } catch { return undefined }
  const repo = manifest.repository
  let url: string | undefined
  if (typeof repo === 'string') url = repo
  else if (repo !== null && typeof repo === 'object' && typeof (repo as Record<string, unknown>).url === 'string') url = (repo as Record<string, unknown>).url as string
  if (url === undefined && typeof manifest.homepage === 'string') url = manifest.homepage
  if (url === undefined) return undefined
  return normalizeGithubUrl(url)
}

export function listPlugins(profileDir: string, runtimeEntries: RuntimeEntry[]): InstalledPlugin[] {
  const manifest = readProfileManifest(profileDir)
  const deps = manifest.dependencies ?? {}
  const bundles = new Set(manifest.dsh?.profile?.bundles ?? [])
  const patch = readPatch(join(profileDir, 'cordis.patch.yml'))
  const registry = readRegistry()
  const runtimeByModule = new Map(runtimeEntries.map((e) => [e.moduleName, e]))
  const runtimeById = new Map(runtimeEntries.map((e) => [e.entryId, e]))

  const rows: InstalledPlugin[] = []
  for (const [name, spec] of Object.entries(deps)) {
    const entry = registry.plugins[name]
    const isBundle = bundles.has(name)
    const insert = patch.inserts.find((i) => i.name === name)
    let type: PluginType
    if (isBundle) type = 'bundle'
    else if (insert !== undefined) type = 'cordis'
    else type = 'npm'

    const entryId = isBundle ? (getBundleEntryId(name, profileDir) ?? name) : (insert?.id ?? entry?.entryId)
    const runtime = runtimeByModule.get(name) ?? (entryId !== undefined ? runtimeById.get(entryId) : undefined)

    let enabled = true
    if (entryId !== undefined) {
      const dis = patch.disabled.get(entryId)
      if (dis === true) enabled = false
    }
    if (runtime !== undefined) enabled = runtime.enabled

    rows.push({
      name,
      type,
      version: installedVersion(name, spec, entry, profileDir),
      sourceUrl: isGitSpec(spec) ? gitSpecUrl(spec, entry?.owner, entry?.repo) : githubUrlFromPackage(name, profileDir),
      entryId,
      enabled,
      runtimePhase: runtime?.phase ?? null,
      managedByBrat: entry !== undefined,
    })
  }
  return rows
}
