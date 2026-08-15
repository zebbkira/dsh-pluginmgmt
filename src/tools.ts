/** Agent-facing tools sharing the same engine as the routes. */
import { defineTool } from '@deepseek-ai/dsh-tools'
import { listPlugins, type RuntimeEntry } from './engine/list.ts'
import { checkUpdates, installPlugin, removePlugin, updatePlugin } from './engine/manager.ts'
import { runAutoUpdate } from './engine/autoupdate.ts'
import { readSettings, writeSettings } from './engine/registry.ts'
import { profileDir } from './engine/paths.ts'

const text = (value: string) => [{ type: 'text', text: value }]

function jsonTool(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
  fn: (args: Record<string, unknown>) => Promise<unknown>,
) {
  return defineTool({
    name,
    description,
    parameters: parameters as never,
    output: {
      schema: { type: 'string' } as never,
      render: (_args: unknown, value: string) => text(value),
    },
    execute: async (args: never) => JSON.stringify(await fn(args as unknown as Record<string, unknown>), null, 2),
  })
}

export function makeTools(deps: { getRuntimeEntries: () => RuntimeEntry[] }): ReturnType<typeof defineTool>[] {
  const list = () => Promise.resolve({ items: listPlugins(profileDir(), deps.getRuntimeEntries()) })

  return [
    jsonTool('plugin_install', '从 GitHub 仓库链接安装一个 dsh 插件（先校验是 bundle 还是纯 cordis，再 pnpm 安装）。参数 url 必填。', {
      url: { type: 'string', required: true, description: 'GitHub 仓库链接，如 https://github.com/owner/repo' },
      ref: { type: 'string', description: '分支/标签/commit（可选，默认默认分支）' },
      subdir: { type: 'string', description: 'monorepo 子目录（可选）' },
      confirm: { type: 'boolean', description: '纯 cordis 插件需二次确认（true）' },
    }, (a) => installPlugin({ url: String(a.url ?? ''), ref: a.ref as string | undefined, subdir: a.subdir as string | undefined, confirm: a.confirm === true })),

    jsonTool('plugin_list', '列出当前 web profile 已安装的插件（bundle / 纯 cordis / npm，含运行态）。', {}, () => list()),

    jsonTool('plugin_remove', '卸载一个已安装插件（pnpm rm + 层栈 reconcile + 清理 cordis insert）。参数 name 必填。', {
      name: { type: 'string', required: true, description: '插件包名' },
    }, (a) => removePlugin(String(a.name ?? ''))),

    jsonTool('plugin_update', '更新一个已安装插件到最新版本（git 源对比最新 commit 后重装；npm 源 pnpm up）。参数 name 必填。', {
      name: { type: 'string', required: true, description: '插件包名' },
    }, (a) => updatePlugin(String(a.name ?? ''))),

    jsonTool('plugin_check_updates', '检查 git 源插件是否有可更新的 commit。', {}, () => checkUpdates()),

    jsonTool('plugin_auto_update', '立即检查并自动更新所有可更新的 git 源插件（强制运行，忽略自动更新开关），完成后返回更新清单。', {}, () => runAutoUpdate(true)),

    jsonTool('plugin_set_auto_update', '开启或关闭后台自动更新（持久化到登记簿）。参数 enabled 必填。', {
      enabled: { type: 'boolean', required: true, description: '是否开启后台自动更新' },
    }, async (a) => {
      const s = readSettings()
      const settings = { ...s, autoUpdate: a.enabled === true }
      writeSettings(settings)
      if (settings.autoUpdate) void runAutoUpdate(true)
      return { ok: true, settings }
    }),
  ]
}
