/** Bundle-layer reconcile: mirror the official 'dsh plugin' post-pnpm step. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { ProfileManifest } from './types.ts'

export function exportsPatch(packageName: string, profileDir: string): boolean {
  let req: NodeRequire
  try { req = createRequire(join(profileDir, 'package.json')) } catch { return false }
  const paths = req.resolve.paths(packageName) ?? []
  for (const searchPath of paths) {
    const manifestPath = join(searchPath, packageName, 'package.json')
    if (!existsSync(manifestPath)) continue
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ProfileManifest
      return manifest.dsh?.bundle?.patch !== undefined
    } catch { return false }
  }
  return false
}

export function readProfileManifest(profileDir: string): ProfileManifest {
  return JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8')) as ProfileManifest
}

export function writeProfileManifest(profileDir: string, manifest: ProfileManifest): void {
  writeFileSync(join(profileDir, 'package.json'), JSON.stringify(manifest, undefined, 2) + '\n')
}

export function reconcileBundles(before: ProfileManifest, profileDir: string): { changed: boolean; bundles: string[]; warnings: string[] } {
  const after = readProfileManifest(profileDir)
  const beforeDeps = new Set(Object.keys(before.dependencies ?? {}))
  const dependencies = Object.keys(after.dependencies ?? {})
  const plugins = [...(after.dsh?.profile?.bundles ?? [])]
  let changed = false
  const warnings: string[] = []

  for (const packageName of dependencies) {
    const isBundle = exportsPatch(packageName, profileDir)
    if (isBundle && !plugins.includes(packageName)) {
      plugins.push(packageName)
      changed = true
    } else if (!isBundle && !beforeDeps.has(packageName)) {
      warnings.push(packageName)
    }
  }

  const dependencySet = new Set(dependencies)
  for (const packageName of [...plugins]) {
    const wasDependency = beforeDeps.has(packageName) || dependencySet.has(packageName)
    const stillBundle = dependencySet.has(packageName) && exportsPatch(packageName, profileDir)
    if (wasDependency && !stillBundle) {
      plugins.splice(plugins.indexOf(packageName), 1)
      changed = true
    }
  }

  if (changed) {
    after.dsh = { ...after.dsh, profile: { ...after.dsh?.profile, bundles: plugins } }
    writeProfileManifest(profileDir, after)
  }
  return { changed, bundles: plugins, warnings }
}
