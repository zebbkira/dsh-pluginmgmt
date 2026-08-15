/** Verify a GitHub source: resolve the commit via git ls-remote, fetch the
 * package.json, and classify it as bundle / pure cordis / not-a-plugin. */
import { execFile } from 'node:child_process'
import type { InspectResult, ParsedSource, PluginType } from '../protocol.ts'

export function gitUrl(source: ParsedSource): string {
  return 'https://github.com/' + source.owner + '/' + source.repo + '.git'
}

function git(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile('git', args, { shell: process.platform === 'win32', timeout: 30000 }, (error, stdout, stderr) => {
      const code = error ? ((error as NodeJS.ErrnoException & { code?: number | string }).code as number) ?? 1 : 0
      resolve({ code: typeof code === 'number' ? code : 1, stdout: String(stdout), stderr: String(stderr) })
    })
  })
}

/** Resolve the default branch + its commit, and (optionally) a specific ref. */
export async function resolveCommit(url: string, ref?: string): Promise<{ commit?: string; defaultBranch?: string; error?: string }> {
  const head = await git(['ls-remote', '--symref', url, 'HEAD'])
  if (head.code !== 0) return { error: (head.stderr || head.stdout || 'git ls-remote 失败').trim() }
  let defaultBranch: string | undefined
  let commit: string | undefined
  for (const line of head.stdout.split('\n')) {
    if (line.startsWith('ref: refs/heads/')) {
      defaultBranch = line.split('\t')[0].slice('ref: refs/heads/'.length)
    }
    const fields = line.split('\t')
    if (commit === undefined && /^[0-9a-f]{40}$/.test(fields[0] ?? '')) commit = fields[0]
  }
  if (commit === undefined) return { error: '无法解析 HEAD commit' }
  if (ref !== undefined && ref !== '' && ref !== 'HEAD' && ref !== defaultBranch) {
    const r = await git(['ls-remote', url, ref])
    if (r.code !== 0) return { error: ('无法解析 ref ' + ref).trim() }
    const first = r.stdout.split('\n').find((l) => /^[0-9a-f]{40}\s/.test(l))
    if (first !== undefined) commit = first.split(/\s+/)[0]
  }
  return { commit, defaultBranch }
}

function isObject(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null }

/** Fetch package.json from raw.githubusercontent.com (public repos). */
async function fetchManifest(source: ParsedSource, ref: string): Promise<{ manifest?: Record<string, unknown>; error?: string }> {
  const seg = source.subdir ? source.subdir + '/' : ''
  const url = 'https://raw.githubusercontent.com/' + source.owner + '/' + source.repo + '/' + encodeURIComponent(ref) + '/' + seg + 'package.json'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' })
    if (!res.ok) return { error: 'package.json 拉取失败（HTTP ' + res.status + '；私有仓库需 token，v1 仅支持公共仓库）' }
    const text = await res.text()
    const parsed: unknown = JSON.parse(text)
    if (!isObject(parsed)) return { error: 'package.json 不是 JSON 对象' }
    return { manifest: parsed }
  } catch (e) {
    return { error: 'package.json 拉取失败：' + String((e as Error)?.message ?? e) }
  } finally { clearTimeout(timer) }
}

function classify(manifest: Record<string, unknown>): { ok: boolean; type?: PluginType; reason?: string; capabilities: string[]; warnings: string[] } {
  const dsh = isObject(manifest.dsh) ? manifest.dsh : {}
  const caps: string[] = []
  if (isObject(dsh.bundle) && typeof (dsh.bundle as Record<string, unknown>).patch === 'string') caps.push('bundle')
  if (Array.isArray(dsh.skills) && dsh.skills.length > 0) caps.push('skills')
  if (isObject(dsh.mcpServers) && Object.keys(dsh.mcpServers).length > 0) caps.push('mcp')
  if (isObject(dsh.client) && typeof (dsh.client as Record<string, unknown>).platform === 'string') caps.push('client')
  const main = typeof manifest.main === 'string' && manifest.main !== ''
  const exp = isObject(manifest.exports) && typeof (manifest.exports as Record<string, unknown>)['.'] === 'string'
  const hasEntry = main || exp
  if (caps.includes('bundle')) return { ok: true, type: 'bundle', capabilities: caps, warnings: [] }
  if (hasEntry) return { ok: true, type: 'cordis', capabilities: caps, warnings: ['未声明 dsh.bundle，按纯 cordis 插件处理（清单级判断，安装前请确认）'] }
  return { ok: false, reason: '不是 dsh 插件：package.json 既无 dsh.bundle 也无 cordis 入口（main / exports）', capabilities: caps, warnings: [] }
}

/** Inspect a source: resolve + fetch + classify. */
export async function inspectSource(source: ParsedSource): Promise<InspectResult> {
  const resolved = await resolveCommit(gitUrl(source), source.ref)
  if (resolved.error !== undefined) return { ok: false, reason: resolved.error }
  const commit = resolved.commit as string
  const fetchRef = source.ref ?? resolved.defaultBranch ?? 'HEAD'
  const fetched = await fetchManifest(source, fetchRef)
  if (fetched.error !== undefined) return { ok: false, reason: fetched.error, source, commit, defaultBranch: resolved.defaultBranch }
  const manifest = fetched.manifest as Record<string, unknown>
  const c = classify(manifest)
  return {
    ok: c.ok,
    reason: c.reason,
    source,
    commit,
    defaultBranch: resolved.defaultBranch,
    type: c.type,
    packageName: typeof manifest.name === 'string' ? manifest.name : undefined,
    capabilities: c.capabilities,
    warnings: c.warnings,
  }
}
