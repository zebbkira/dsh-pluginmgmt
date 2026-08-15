/** /api/dsh-pluginmgmt route family — the browser half's only data path.
 * Loopback-only trust fence: these endpoints run pnpm and edit user files,
 * so a LAN-exposed dsh web deployment must not serve them. */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { API, type MutationResult } from './protocol.ts'
import { listPlugins, type RuntimeEntry } from './engine/list.ts'
import { checkUpdates, installPlugin, removePlugin, togglePlugin, updatePlugin } from './engine/manager.ts'
import { getAutoUpdateState, runAutoUpdate } from './engine/autoupdate.ts'
import { readSettings, writeSettings } from './engine/registry.ts'
import { profileDir } from './engine/paths.ts'
import { parseGithubSource } from './engine/resolve.ts'
import { inspectSource } from './engine/verify.ts'

const MAX_JSON_BODY_BYTES = 1024 * 1024

function isLoopbackRequest(request: IncomingMessage): boolean {
  const address = request.socket.remoteAddress
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = request.headers.host
  if (typeof host !== 'string') return false
  let hostUrl: URL
  try { hostUrl = new URL('http://' + host) } catch { return false }
  if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]') return false
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  const origin = request.headers.origin
  if (origin === undefined) return true
  try { return new URL(origin).host === hostUrl.host } catch { return false }
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'referrer-policy': 'no-referrer' })
  res.end(JSON.stringify(body))
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown> | undefined> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = chunk as Buffer
    size += buffer.length
    if (size > MAX_JSON_BODY_BYTES) return undefined
    chunks.push(buffer)
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : undefined
  } catch { return undefined }
}

export interface RoutesDeps { getRuntimeEntries: () => RuntimeEntry[] }

export function makeRoutes(deps: RoutesDeps): WebRoute[] {
  const guard = (req: IncomingMessage, res: ServerResponse, method: string): boolean => {
    if (!isLoopbackRequest(req)) { writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' }); return false }
    if (req.method !== method) { writeJson(res, 405, { ok: false, error: 'method not allowed' }); return false }
    return true
  }

  const handle = (method: string, path: string, fn: (body: Record<string, unknown>) => Promise<unknown> | unknown): WebRoute => ({
    kind: 'exact',
    path,
    handler: async (req, res) => {
      if (!guard(req, res, method)) return
      let body: Record<string, unknown> = {}
      if (method === 'POST') {
        const parsed = await readJsonBody(req)
        if (parsed === undefined) { writeJson(res, 400, { ok: false, error: 'invalid or oversized JSON body' }); return }
        body = parsed
      }
      try {
        const result = await fn(body)
        writeJson(res, 200, result)
      } catch (e) {
        writeJson(res, 500, { ok: false, error: String((e as Error)?.message ?? e) })
      }
    },
  })

  return [
    handle('GET', API.plugins, () => {
      const rows = listPlugins(profileDir(), deps.getRuntimeEntries())
      return { ok: true, items: rows }
    }),

    handle('POST', API.inspect, (body) => {
      const url = typeof body?.url === 'string' ? body.url : ''
      if (url === '') return { ok: false, error: 'url required' }
      const source = parseGithubSource(url)
      if (source === null) return { ok: false, error: '无法解析为 GitHub 仓库链接' }
      const ref = typeof body?.ref === 'string' && body.ref !== '' ? body.ref : undefined
      const subdir = typeof body?.subdir === 'string' && body.subdir !== '' ? body.subdir : undefined
      if (ref !== undefined) source.ref = ref
      if (subdir !== undefined) source.subdir = subdir
      return inspectSource(source)
    }),

    handle('POST', API.install, (body) => installPlugin({
      url: typeof body?.url === 'string' ? body.url : '',
      ref: typeof body?.ref === 'string' ? body.ref : undefined,
      subdir: typeof body?.subdir === 'string' ? body.subdir : undefined,
      confirm: body?.confirm === true,
    })),

    handle('POST', API.remove, (body) => removePlugin(typeof body?.name === 'string' ? body.name : '')),
    handle('POST', API.update, (body) => updatePlugin(typeof body?.name === 'string' ? body.name : '')),
    handle('POST', API.checkUpdates, async () => ({ ok: true, updates: await checkUpdates() })),
    handle('POST', API.toggle, (body) => {
      const id = typeof body?.id === 'string' ? body.id : ''
      const enabled = body?.enabled === true
      const r: MutationResult = togglePlugin(id, enabled)
      return r
    }),
    {
      kind: 'exact',
      path: API.settings,
      handler: async (req, res) => {
        if (!isLoopbackRequest(req)) { writeJson(res, 403, { ok: false, error: 'forbidden: loopback-only' }); return }
        if (req.method === 'GET') { writeJson(res, 200, { ok: true, settings: readSettings() }); return }
        if (req.method === 'POST') {
          const body = await readJsonBody(req)
          if (body === undefined) { writeJson(res, 400, { ok: false, error: 'invalid or oversized JSON body' }); return }
          const autoUpdate = body.autoUpdate === true
          const intervalMin = typeof body.autoUpdateIntervalMin === 'number' && (body.autoUpdateIntervalMin as number) > 0
            ? (body.autoUpdateIntervalMin as number)
            : readSettings().autoUpdateIntervalMin
          const settings = { autoUpdate, autoUpdateIntervalMin: intervalMin }
          writeSettings(settings)
          if (autoUpdate) void runAutoUpdate(true)
          writeJson(res, 200, { ok: true, settings })
          return
        }
        writeJson(res, 405, { ok: false, error: 'method not allowed' })
      },
    },

    handle('POST', API.autoUpdate, async () => ({ ok: true, autoUpdate: await runAutoUpdate(true) })),

    handle('GET', API.status, () => ({ ok: true, busy: false, autoUpdate: getAutoUpdateState() })),
  ]
}
