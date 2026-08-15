/** Browser-side API client for /api/dsh-pluginmgmt. */
import { API, type AutoUpdateSettings, type AutoUpdateState, type InspectResult, type InstalledPlugin, type MutationResult } from '../protocol.ts'

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  return res.json() as Promise<T>
}

export class BratApi {
  list(): Promise<{ ok: boolean; items: InstalledPlugin[] }> { return get(API.plugins) }
  inspect(url: string, ref?: string, subdir?: string): Promise<InspectResult> { return post(API.inspect, { url, ref, subdir }) }
  install(url: string, ref?: string, subdir?: string, confirm?: boolean): Promise<MutationResult> { return post(API.install, { url, ref, subdir, confirm }) }
  remove(name: string): Promise<MutationResult> { return post(API.remove, { name }) }
  update(name: string): Promise<MutationResult> { return post(API.update, { name }) }
  checkUpdates(): Promise<{ ok: boolean; updates: Record<string, string> }> { return post(API.checkUpdates, {}) }
  toggle(id: string, enabled: boolean): Promise<MutationResult> { return post(API.toggle, { id, enabled }) }
  getSettings(): Promise<{ ok: boolean; settings: AutoUpdateSettings }> { return get(API.settings) }
  setSettings(settings: Partial<AutoUpdateSettings>): Promise<{ ok: boolean; settings: AutoUpdateSettings }> { return post(API.settings, settings) }
  triggerAutoUpdate(): Promise<{ ok: boolean; autoUpdate: AutoUpdateState }> { return post(API.autoUpdate, {}) }
  status(): Promise<{ ok: boolean; autoUpdate: AutoUpdateState }> { return get(API.status) }
}
