/** Resolve a package dir and read its bundle insert id (for enable/disable). */
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { ProfileManifest } from './types.ts'

export function resolvePackageDir(packageName: string, profileDir: string): string | null {
  let req: NodeRequire
  try { req = createRequire(join(profileDir, 'package.json')) } catch { return null }
  const paths = req.resolve.paths(packageName) ?? []
  for (const searchPath of paths) {
    const manifestPath = join(searchPath, packageName, 'package.json')
    if (existsSync(manifestPath)) return join(searchPath, packageName)
  }
  return null
}

/** The first insert id a bundle declares (its own patch entry), if any. */
export function getBundleEntryId(packageName: string, profileDir: string): string | null {
  const dir = resolvePackageDir(packageName, profileDir)
  if (dir === null) return null
  let manifest: ProfileManifest
  try { manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as ProfileManifest } catch { return null }
  const patchRel = manifest.dsh?.bundle?.patch
  if (typeof patchRel !== 'string') return null
  let raw: string
  try { raw = readFileSync(join(dir, patchRel), 'utf8') } catch { return null }
  const m = /^\s*-\s+id:\s*(.+?)\s*$/m.exec(raw)
  if (m !== null) return m[1].trim()
  return null
}
