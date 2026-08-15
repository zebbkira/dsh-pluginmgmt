/** Background auto-update: check for git-source updates and apply them one
 * by one. State is in-memory (a fresh web process after restart starts clean
 * and the already-applied updates load on boot). */
import type { AutoUpdateState } from '../protocol.ts'
import { checkUpdates, updatePlugin } from './manager.ts'
import { readSettings } from './registry.ts'

export const state: AutoUpdateState = { running: false, lastCheckAt: 0, updated: [], failed: [], restartPending: false }

export function getAutoUpdateState(): AutoUpdateState { return state }

/** Run one check-and-update pass; no-op when already running or auto-update off. */
export async function runAutoUpdate(force = false): Promise<AutoUpdateState> {
  if (state.running) return state
  if (!force && !readSettings().autoUpdate) return state
  state.running = true
  state.lastCheckAt = Date.now()
  state.updated = []
  state.failed = []
  try {
    const updates = await checkUpdates()
    const names = Object.keys(updates)
    for (const name of names) {
      const r = await updatePlugin(name)
      if (r.ok) state.updated.push(name)
      else state.failed.push({ name, error: r.error ?? 'unknown' })
    }
    if (state.updated.length > 0) state.restartPending = true
  } catch (e) {
    state.failed.push({ name: '(check)', error: String((e as Error)?.message ?? e) })
  } finally {
    state.running = false
  }
  return state
}
