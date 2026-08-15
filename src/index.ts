/** dsh-pluginmgmt — host half. Mounts the plugin-management engine, the
 * /api/dsh-pluginmgmt route family, agent tools, and a system-prompt
 * announcement. The browser half (./client) renders the settings page. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import type { RuntimePhase } from './protocol.ts'
import { makeRoutes } from './routes.ts'
import { makeTools } from './tools.ts'
import { runAutoUpdate } from './engine/autoupdate.ts'
import { readSettings } from './engine/registry.ts'
import type { RuntimeEntry } from './engine/list.ts'

export const name = 'dsh-pluginmgmt'
export const inject = ['webServer', 'tools', 'systemPrompt', 'loader']

const FIBER_PHASE: Record<number, RuntimePhase> = { 0: 'pending', 1: 'loading', 2: 'active', 3: 'failed', 4: null, 5: 'unloading' }

const GUIDANCE = '本机已安装 dsh-pluginmgmt 插件（插件管理器）：设置页「插件管理」。能力：输入 GitHub 仓库链接 → 校验（git ls-remote 确认仓库 + 读 package.json 判定 bundle / 纯 cordis）→ 一键安装 → 全生命周期 更新 / 删除 / 启用停用；支持自动更新（可开关，后台定时检查并更新 git 源插件，完成后左下角浮动窗口提示重启）。限制：bundle 安装/更新/删除需重启 dsh web 生效（层栈 boot 合成）；纯 cordis 走 HMR；v1 仅支持公共 GitHub 仓库；安装第三方代码 = 运行任意代码，需用户确认。用户提到「插件管理 / 安装插件 / GitHub 直装 / 自动更新」时即指本插件，请据此协作。'

/** Read the current Loader entries (same source as the official inventory). */
function runtimeEntries(ctx: Context): RuntimeEntry[] {
  const loader = (ctx as unknown as { loader: { entries(): Array<{ id: string; disabled: boolean; options: { name: string; group?: unknown }; fiber?: { state: number } | null }> } }).loader
  const entries: RuntimeEntry[] = []
  for (const entry of loader.entries()) {
    if (entry.options.group) continue
    entries.push({
      entryId: entry.id,
      moduleName: entry.options.name,
      enabled: !entry.disabled,
      phase: entry.fiber ? (FIBER_PHASE[entry.fiber.state] ?? null) : null,
    })
  }
  return entries
}

export function apply(ctx: Context): void {
  const deps = { getRuntimeEntries: () => runtimeEntries(ctx) }

  ctx.effect(() => ctx.systemPrompt.section({ name: 'plugin:dsh-pluginmgmt', order: 161, text: GUIDANCE }), 'dsh-pluginmgmt: prompt')

  ctx.effect(() => {
    const routes = makeRoutes(deps)
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-pluginmgmt: routes')

  ctx.effect(() => {
    const tools = makeTools(deps)
    const disposers = tools.map((tool) => ctx.tools.register(tool))
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-pluginmgmt: tools')

  // Background auto-update: a periodic pass; the callback no-ops while the
  // toggle is off, and toggling on triggers an immediate run via /settings.
  ctx.effect(() => {
    const intervalMs = Math.max(5, readSettings().autoUpdateIntervalMin) * 60 * 1000
    const timer = setInterval(() => { void runAutoUpdate() }, intervalMs)
    return () => { clearInterval(timer) }
  }, 'dsh-pluginmgmt: auto-update')
}
