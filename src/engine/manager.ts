/** Orchestration: install / remove / update / toggle / check-updates.
 * Mutations are serialized by an in-process lock (pnpm in one profile dir
 * must not run concurrently). */
import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { MutationResult, ParsedSource } from '../protocol.ts'
import { getBundleEntryId, resolvePackageDir } from './entry.ts'
import { profileDir, profilePatchPath } from './paths.ts'
import { addInsert, removeInsert, toggleDisabled } from './patch.ts'
import { runPnpm, type PnpmResult } from './pnpm.ts'
import { readProfileManifest, reconcileBundles } from './reconcile.ts'
import { readRegistry, removeEntry, setEntry } from './registry.ts'
import { parseGithubSource } from './resolve.ts'
import { gitUrl, inspectSource, resolveCommit } from './verify.ts'

let queue: Promise<unknown> = Promise.resolve()
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.then(() => undefined, () => undefined)
  return run
}

function pnpmError(res: PnpmResult): string {
  const tail = (res.stderr || res.stdout || '').trim().split('\n').slice(-15).join('\n')
  if (/allowBuilds/i.test(tail)) return 'pnpm 阻止了构建脚本，请在 profile 的 pnpm-workspace.yaml 的 allowBuilds 白名单加入该依赖后重试。' + tail
  return 'pnpm 失败：' + tail
}

export function buildGitSpec(source: ParsedSource, commit: string): string {
  let spec = 'github:' + source.owner + '/' + source.repo + '#' + commit
  if (source.subdir !== undefined && source.subdir !== '') spec += '&path:/' + source.subdir
  return spec
}

export interface InstallRequest { url: string; ref?: string; subdir?: string; confirm?: boolean }

export function installPlugin(req: InstallRequest): Promise<MutationResult> {
  return withLock(async () => {
    const source = parseGithubSource(req.url)
    if (source === null) return { ok: false, error: '无法解析为 GitHub 仓库链接，请粘贴 https://github.com/owner/repo 形式' }
    if (req.ref !== undefined && req.ref !== '') source.ref = req.ref
    if (req.subdir !== undefined && req.subdir !== '') source.subdir = req.subdir

    const inspect = await inspectSource(source)
    if (!inspect.ok) return { ok: false, error: inspect.reason ?? '校验失败' }
    if (inspect.type === 'cordis' && req.confirm !== true) {
      return { ok: false, error: 'NEEDS_CONFIRM', detail: inspect.warnings?.join('；') ?? '疑似纯 cordis 插件' }
    }
    const pkgName = inspect.packageName ?? source.repo
    const spec = buildGitSpec(source, inspect.commit ?? 'HEAD')

    const before = readProfileManifest(profileDir())
    const res = await runPnpm(['add', spec])
    if (res.exitCode !== 0) return { ok: false, error: pnpmError(res) }
    reconcileBundles(before, profileDir())

    let entryId: string | undefined
    if (inspect.type === 'cordis') {
      entryId = 'ui-' + pkgName.replace(/^@/, '').replace(/\//g, '-')
      addInsert(profilePatchPath(), entryId, pkgName)
    }

    setEntry({
      name: pkgName,
      type: inspect.type ?? 'cordis',
      sourceUrl: 'https://github.com/' + source.owner + '/' + source.repo,
      spec,
      owner: source.owner,
      repo: source.repo,
      ref: inspect.commit ?? '',
      branch: inspect.defaultBranch ?? source.ref,
      subdir: source.subdir,
      entryId,
      installedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return {
      ok: true,
      restartRequired: inspect.type === 'bundle',
      detail: '已安装 ' + pkgName + (inspect.type === 'bundle' ? '（bundle，需重启 web 生效）' : '（纯 cordis，HMR 生效）'),
    }
  })
}

export function removePlugin(name: string): Promise<MutationResult> {
  return withLock(async () => {
    const entry = readRegistry().plugins[name]
    const before = readProfileManifest(profileDir())
    if (before.dependencies?.[name] === undefined) return { ok: false, error: '未找到已安装插件 ' + name }
    const wasBundle = (before.dsh?.profile?.bundles ?? []).includes(name)
    const res = await runPnpm(['rm', name])
    if (res.exitCode !== 0) return { ok: false, error: pnpmError(res) }
    reconcileBundles(before, profileDir())
    if (entry?.type === 'cordis' && entry.entryId !== undefined) removeInsert(profilePatchPath(), entry.entryId)
    removeEntry(name)
    return { ok: true, restartRequired: wasBundle, detail: '已删除 ' + name }
  })
}

export function updatePlugin(name: string): Promise<MutationResult> {
  return withLock(async () => {
    const manifest = readProfileManifest(profileDir())
    const spec = manifest.dependencies?.[name]
    if (spec === undefined) return { ok: false, error: '未找到已安装插件 ' + name }
    const entry = readRegistry().plugins[name]
    const isGit = spec.startsWith('github:') || spec.startsWith('git+') || spec.startsWith('git:') || spec.includes('.git')

    if (isGit && entry !== undefined) {
      const url = gitUrl({ host: 'github', owner: entry.owner, repo: entry.repo })
      const latest = await resolveCommit(url, entry.branch)
      if (latest.error !== undefined) return { ok: false, error: latest.error }
      if (latest.commit === entry.ref) return { ok: false, error: '已是最新（' + entry.ref.slice(0, 7) + '）' }
      const spec2 = buildGitSpec({ host: 'github', owner: entry.owner, repo: entry.repo, subdir: entry.subdir }, latest.commit ?? '')
      const before = readProfileManifest(profileDir())
      const res = await runPnpm(['add', spec2])
      if (res.exitCode !== 0) return { ok: false, error: pnpmError(res) }
      reconcileBundles(before, profileDir())
      setEntry({ ...entry, spec: spec2, ref: latest.commit ?? entry.ref, updatedAt: Date.now() })
      return { ok: true, restartRequired: entry.type === 'bundle', detail: '已更新 ' + name + '（' + entry.ref.slice(0, 7) + ' → ' + (latest.commit ?? '').slice(0, 7) + '）' }
    }

    const before = readProfileManifest(profileDir())
    const res = await runPnpm(['up', '--latest', name])
    if (res.exitCode !== 0) return { ok: false, error: pnpmError(res) }
    reconcileBundles(before, profileDir())
    if (entry !== undefined) setEntry({ ...entry, updatedAt: Date.now() })
    return { ok: true, restartRequired: true, detail: '已更新 ' + name }
  })
}

export function togglePlugin(id: string, enabled: boolean): MutationResult {
  if (id === undefined || id === '') return { ok: false, error: '缺少插件入口 id' }
  if (id === 'ui-dsh-pluginmgmt' && !enabled) return { ok: false, error: '不能禁用 dsh-pluginmgmt 自身（会失去所有管理入口）' }
  toggleDisabled(profilePatchPath(), id, enabled)
  return { ok: true, restartRequired: false, detail: (enabled ? '已启用 ' : '已禁用 ') + id }
}

const PROXY_VARS = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'all_proxy']

function isGitSpec(spec: string): boolean {
  return spec.startsWith('github:') || spec.startsWith('git+') || spec.startsWith('git:') || spec.includes('.git')
}

function installedVersion(packageName: string, dir: string): string | undefined {
  const pkgDir = resolvePackageDir(packageName, dir)
  if (pkgDir === null) return undefined
  try {
    const m = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')) as { version?: string }
    return typeof m.version === 'string' ? m.version : undefined
  } catch { return undefined }
}

function latestNpmVersion(packageName: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const env: NodeJS.ProcessEnv = { ...process.env }
    for (const key of PROXY_VARS) delete env[key]
    execFile('npm', ['view', packageName, 'version'], { timeout: 30000, shell: process.platform === 'win32', env }, (error, stdout) => {
      if (error !== null) { resolve(undefined); return }
      const v = String(stdout).trim().split('\n').pop()?.trim()
      resolve(v !== undefined && /^[0-9]/.test(v) ? v : undefined)
    })
  })
}

/** Map plugin name -> latest version (npm) or short commit (git) when a newer one exists. */
export function checkUpdates(): Promise<Record<string, string>> {
  return withLock(async () => {
    const dir = profileDir()
    const manifest = readProfileManifest(dir)
    const deps = manifest.dependencies ?? {}
    const registry = readRegistry()
    const result: Record<string, string> = {}

    const npmNames: string[] = []
    const gitTasks: Array<Promise<void>> = []

    for (const [name, spec] of Object.entries(deps)) {
      if (isGitSpec(spec)) {
        gitTasks.push((async () => {
          const entry = registry.plugins[name]
          let owner: string | undefined
          let repo: string | undefined
          let branch: string | undefined
          if (entry !== undefined) { owner = entry.owner; repo = entry.repo; branch = entry.branch }
          else { const src = parseGithubSource(spec); if (src !== null) { owner = src.owner; repo = src.repo; branch = src.ref } }
          if (owner === undefined || repo === undefined) return
          const latest = await resolveCommit(gitUrl({ host: 'github', owner, repo }), branch)
          if (latest.commit !== undefined && entry !== undefined && latest.commit !== entry.ref) result[name] = latest.commit.slice(0, 7)
        })())
      } else {
        npmNames.push(name)
      }
    }

    await Promise.all(gitTasks)
    await Promise.all(npmNames.map(async (name) => {
      const installed = installedVersion(name, dir)
      const latest = await latestNpmVersion(name)
      if (installed !== undefined && latest !== undefined && installed !== latest) result[name] = latest
    }))

    return result
  })
}

export { getBundleEntryId }
