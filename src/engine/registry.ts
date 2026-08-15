/** dsh-pluginmgmt install registry (~/.dsh/dsh-pluginmgmt.json). */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import type { AutoUpdateSettings, RegistryDoc, RegistryEntry } from '../protocol.ts'
import { registryPath } from './paths.ts'

function atomicWrite(path: string, content: string): void {
  const tmp = path + '.tmp-' + process.pid
  writeFileSync(tmp, content, { encoding: 'utf8', mode: 0o600 })
  renameSync(tmp, path)
}

export function readRegistry(): RegistryDoc {
  const path = registryPath()
  if (!existsSync(path)) return { version: 1, plugins: {} }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as RegistryDoc
    if (parsed === null || typeof parsed !== 'object' || parsed.version !== 1 || typeof parsed.plugins !== 'object' || parsed.plugins === null) {
      return { version: 1, plugins: {} }
    }
    return parsed
  } catch {
    return { version: 1, plugins: {} }
  }
}

export function writeRegistry(doc: RegistryDoc): void {
  atomicWrite(registryPath(), JSON.stringify(doc, null, 2) + '\n')
}

export function setEntry(entry: RegistryEntry): void {
  const doc = readRegistry()
  doc.plugins[entry.name] = entry
  writeRegistry(doc)
}

export function removeEntry(name: string): boolean {
  const doc = readRegistry()
  if (doc.plugins[name] === undefined) return false
  delete doc.plugins[name]
  writeRegistry(doc)
  return true
}

const DEFAULT_SETTINGS: AutoUpdateSettings = { autoUpdate: false, autoUpdateIntervalMin: 30 }

/** Read the auto-update settings (with defaults). */
export function readSettings(): AutoUpdateSettings {
  const doc = readRegistry()
  return { ...DEFAULT_SETTINGS, ...(doc.settings ?? {}) }
}

/** Persist the auto-update settings. */
export function writeSettings(settings: AutoUpdateSettings): void {
  const doc = readRegistry()
  doc.settings = settings
  writeRegistry(doc)
}
