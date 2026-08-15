/** Browser-half entry: contributes a first-class settings page + a floating
 * bottom-left toast that polls auto-update status and prompts a restart. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { API } from '../protocol.ts'
import { en, zh, type BratKey } from './locales.ts'
import { BratSection } from './BratSection.tsx'

const NS = 'dsh-pluginmgmt'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { 'dsh-pluginmgmt': BratKey }
}

export const inject = ['slots', 'workspaces', 'locale']

/** Render the floating restart prompt (plain DOM, no React). */
function mountToast(ctx: ClientContext): () => void {
  const el = document.createElement('div')
  el.setAttribute('data-dsh-pluginmgmt-toast', '')
  el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:9999;display:none;max-width:340px;padding:12px 14px;border-radius:12px;border:1px solid #d97706;background:#2c2c2e;color:#eee;box-shadow:0 8px 24px rgba(0,0,0,.35);font-family:system-ui;font-size:12px;line-height:1.5;'
  document.body.appendChild(el)

  let shown = false
  const show = (updated: string[], failed: { name: string }[]) => {
    el.textContent = ''
    const strong = document.createElement('strong')
    strong.textContent = 'dsh-pluginmgmt 已自动更新 ' + updated.length + ' 个插件'
    el.appendChild(strong)
    if (updated.length > 0) {
      const names = document.createElement('div')
      names.style.cssText = 'margin-top:4px;opacity:.85;word-break:break-all;'
      names.textContent = updated.join('、')
      el.appendChild(names)
    }
    if (failed.length > 0) {
      const f = document.createElement('div')
      f.style.cssText = 'margin-top:4px;opacity:.7;color:#f0a;'
      f.textContent = '失败：' + failed.map((x) => x.name).join('、')
      el.appendChild(f)
    }
    const hint = document.createElement('div')
    hint.style.cssText = 'margin-top:6px;opacity:.85;'
    hint.textContent = '改动已写入，请适时重启 dsh web 生效。'
    el.appendChild(hint)
    const btn = document.createElement('button')
    btn.textContent = '知道了'
    btn.style.cssText = 'margin-top:8px;padding:4px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;font-size:11px;'
    btn.addEventListener('click', () => { el.style.display = 'none' })
    el.appendChild(btn)
    el.style.display = 'block'
  }

  const poll = async () => {
    try {
      const res = await fetch(API.status).then((r) => r.json())
      const st = res?.autoUpdate
      if (st && st.restartPending && !shown) { shown = true; show(st.updated ?? [], st.failed ?? []) }
    } catch { /* ignore */ }
  }
  void poll()
  const timer = setInterval(poll, 15000)
  return () => { clearInterval(timer); el.remove() }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-pluginmgmt: dictionaries')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-pluginmgmt',
    order: 30,
    label: () => ctx.locale.bind(NS)('title'),
    locale: NS,
    inject: () => ({}),
  }, BratSection))
  ctx.effect(() => mountToast(ctx), 'dsh-pluginmgmt: auto-update-toast')
}
