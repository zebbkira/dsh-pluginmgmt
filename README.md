<h1 align="center">dsh-pluginmgmt</h1>
<p align="center">DSH 插件管理器：粘贴 GitHub 链接，校验后一键安装，并对已装插件做更新 / 删除 / 启停全生命周期管理，支持后台自动更新。</p>

## Overview

**解决什么问题**：DeepSeek Harness 的插件默认只能通过 `dsh plugin --profile web add <包>` 命令行安装。dsh-pluginmgmt 在 Web GUI 里加了一个「插件管理」设置页，让你：

- 粘贴 GitHub 仓库链接 → 自动校验（是不是 dsh 插件、bundle 还是纯 cordis、monorepo 子目录）→ 一键安装；
- 对已装插件做更新 / 删除 / 启用停用；
- 可选的后台自动更新：定时检查所有已装插件（npm 源 + git 源）是否有新版本并更新，全部完成后左下角浮动窗口提示重启。

**适合谁**：所有 DSH 用户。核心价值有两块——**安装更省事**（粘贴 GitHub 链接即可，不用记 `dsh plugin` 命令）和**管理更省心**（更新 / 删除 / 启停 / 查更新 / 自动更新都在一个图形界面里完成，不用手改 profile 配置）。尤其适合不想记命令、需要集中管理多个插件的人。

### Tools

| 工具 | 说明 |
| --- | --- |
| `plugin_install` | 从 GitHub 链接安装插件（先校验 bundle / 纯 cordis，再 pnpm 安装） |
| `plugin_list` | 列出 web profile 已装插件（bundle / 纯 cordis / npm，含运行态） |
| `plugin_remove` | 卸载插件（pnpm rm + 层栈 reconcile + 清理 cordis insert） |
| `plugin_update` | 更新插件（git 源对比最新 commit 重装；npm 源 pnpm up --latest） |
| `plugin_check_updates` | 检查插件是否有新版本（npm 源 + git 源） |
| `plugin_auto_update` | 立即检查并自动更新所有可更新插件 |
| `plugin_set_auto_update` | 开启/关闭后台自动更新 |

## Compatibility

- 依赖官方 SDK：`@deepseek-ai/*` `^0.1.0-rc.6`（由 profile 闭包注入，插件 `dependencies` 声明为空）。
- 验证环境：dsh `0.1.0-rc.6`（npm 发行版）、Node 22。
- 最后验证日期：2026-08-16。

## Install / Uninstall

### 安装（方式一：npm）

```bash
dsh plugin --profile web add dsh-pluginmgmt
```

### 安装（方式二：GitHub）

```bash
dsh plugin --profile web add "github:zebbkira/dsh-pluginmgmt#<ref>"
```

装完**重启 dsh web** 生效（bundle 层栈在 boot 合成）。

### 升级

推荐在设置页「插件管理」里点「更新」按钮（内部用 `pnpm up --latest`）。命令行等价：

```bash
dsh plugin --profile web add dsh-pluginmgmt@latest
```

> 注意：`dsh plugin --profile web update <名>`（即 `pnpm up`）对精确锁定的版本号（如 `0.1.0`）不会升级，需用上面带 `@latest` 或 `pnpm up --latest` 的形式。

### 禁用 / 启用

设置页「插件管理」里点「禁用」，或手改 `~/.dsh/profiles/web/cordis.patch.yml` 中 `- id: ui-dsh-pluginmgmt` 的 `disabled: true/false`。

### 彻底移除

```bash
dsh plugin --profile web remove dsh-pluginmgmt
```

## Quick start

零配置可用：

1. 安装并重启：`dsh plugin --profile web add dsh-pluginmgmt` → 重启 `dsh web`。
2. 打开设置 → 「插件管理」。
3. 粘贴 `https://github.com/omdsh-dev/dsh-annotation` → 点「校验」→ 看到「bundle · commit …」结论 → 点「安装」。
4. 已装列表里出现该插件，可更新 / 删除 / 启停。

可复现示例：第 3 步换成任意 dsh 插件仓库链接即可（例如 `https://github.com/zebbkira/dsh-skills-mcp-manager`）。

## Configuration

配置存 `~/.dsh/dsh-pluginmgmt.json`（权限 0600）：

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `settings.autoUpdate` | `false` | 是否后台自动更新 |
| `settings.autoUpdateIntervalMin` | `30` | 自动更新检查间隔（分钟） |

- 环境变量：`DSH_HOME`（默认 `~/.dsh`）。
- 敏感项：登记簿只存来源 URL / ref / 类型，**不存任何凭据**（无 GitHub token）。

## Permissions & data

- **文件读写**：`~/.dsh/profiles/web/package.json`（依赖 + bundle 层栈）、`~/.dsh/profiles/web/cordis.patch.yml`（insert 行 + 启停）、`~/.dsh/dsh-pluginmgmt.json`（登记簿 + 设置）。安装 / 更新 / 删除时调用 pnpm，由 pnpm 写 node_modules 与锁文件。
- **网络**：`git ls-remote` 与 `raw.githubusercontent.com`（校验）、npm registry / `codeload.github.com`（经 pnpm 安装）。
- **凭据**：插件自身不收集、不存储凭据；复用系统已有的 git / npm 凭据。
- **用户数据**：不收集、不上传任何用户数据。

## Troubleshooting

- **常见错误**：
  - `不是 dsh 插件` → 仓库 package.json 既无 `dsh.bundle` 也无 cordis 入口（main / exports）。
  - `pnpm 阻止了构建脚本` → 按提示把该依赖加入 profile `pnpm-workspace.yaml` 的 `allowBuilds` 后重试。
  - 装完没生效 → bundle 需重启 dsh web（层栈 boot 合成）。
- **日志**：dsh web 的 boot 日志（`plugin tree failed to load`、`loader: load plugin …`）。
- **回滚**：`dsh plugin --profile web remove dsh-pluginmgmt`；已装 git 源插件可重新安装旧 ref 回滚。

## Development

```bash
pnpm install
pnpm run build   # tsdown + wrap-client，产物在 lib/
pnpm test        # vitest
pnpm run gates   # 机械门禁 + 自测
```

贡献：fork → 改 → 门禁 + 测试通过 → PR。

## License & security

- 许可证：MIT（见 LICENSE）。
- 安全问题请**私下报告**（不要在公开 issue 里贴），可通过 GitHub 私信 / 邮箱联系维护者。
