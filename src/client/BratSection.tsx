/** The dsh-pluginmgmt settings page: URL input + verify + install, the installed
 * list with update / remove / toggle actions, and auto-update controls. */
import { useCallback, useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { InspectResult, InstalledPlugin } from '../protocol.ts'
import { BratApi } from './api.ts'
import css from './brat-section.module.css'

type Props = PropsRuntime<'settings.section'> & PropsLocale<'dsh-pluginmgmt'>

const api = new BratApi()

type Notice = { kind: 'ok' | 'err'; text: string } | null

const TYPE_LABEL: Record<string, string> = { bundle: 'bundle', cordis: '纯 cordis', npm: 'npm' }
const PHASE_LABEL: Record<string, string> = { pending: '挂起', loading: '加载中', active: '运行中', failed: '失败', unloading: '卸载中' }

export function BratSection({ t }: Props) {
  const [url, setUrl] = useState('')
  const [inspect, setInspect] = useState<InspectResult | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const [restartBanner, setRestartBanner] = useState(false)
  const [needConfirm, setNeedConfirm] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [updates, setUpdates] = useState<Record<string, string>>({})
  const [checking, setChecking] = useState(false)

  const reload = useCallback(async () => {
    try {
      const res = await api.list()
      if (res.ok) setPlugins(res.items)
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setLoadingList(false) }
  }, [])

  const doCheckUpdates = useCallback(async () => {
    setChecking(true)
    try {
      const r = await api.checkUpdates()
      if (r.ok) setUpdates(r.updates)
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setChecking(false) }
  }, [])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    void (async () => {
      try { const s = await api.getSettings(); if (s.ok) setAutoUpdate(s.settings.autoUpdate) } catch { /* ignore */ }
    })()
  }, [])

  const toggleAuto = async (on: boolean) => {
    setAutoUpdate(on)
    try { const r = await api.setSettings({ autoUpdate: on }); if (r.ok) setAutoUpdate(r.settings.autoUpdate) }
    catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
  }

  const doUpdateAll = async () => {
    const names = Object.keys(updates)
    if (names.length === 0) { setNotice({ kind: 'ok', text: '暂无更新' }); return }
    setBusy('updateAll'); setNotice(null)
    let okCount = 0
    try {
      for (const name of names) {
        const r = await api.update(name)
        if (r.ok) { okCount++; if (r.restartRequired) setRestartBanner(true) }
      }
      setNotice({ kind: 'ok', text: '已更新 ' + okCount + ' 个插件' })
      await reload(); await doCheckUpdates()
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setBusy('') }
  }

  const doInspect = async () => {
    setInspecting(true); setInspect(null); setNotice(null); setNeedConfirm(false)
    try { setInspect(await api.inspect(url)) }
    catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setInspecting(false) }
  }

  const doInstall = async (confirm: boolean) => {
    setBusy('install'); setNotice(null)
    try {
      const r = await api.install(url, inspect?.source?.ref, inspect?.source?.subdir, confirm)
      if (r.ok) {
        setNotice({ kind: 'ok', text: r.detail ?? '已安装' })
        if (r.restartRequired) setRestartBanner(true)
        setInspect(null); setUrl(''); setNeedConfirm(false)
        await reload()
      } else if (r.error === 'NEEDS_CONFIRM') {
        setNeedConfirm(true)
        setNotice({ kind: 'err', text: '疑似纯 cordis 插件，请确认后再次安装' })
      } else {
        setNotice({ kind: 'err', text: r.error ?? '安装失败' })
      }
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setBusy('') }
  }

  const doRemove = async (name: string) => {
    setBusy('remove:' + name); setNotice(null)
    try {
      const r = await api.remove(name)
      if (r.ok) { setNotice({ kind: 'ok', text: r.detail ?? '已删除' }); if (r.restartRequired) setRestartBanner(true); await reload() }
      else setNotice({ kind: 'err', text: r.error ?? '删除失败' })
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setBusy('') }
  }

  const doUpdate = async (name: string) => {
    setBusy('update:' + name); setNotice(null)
    try {
      const r = await api.update(name)
      if (r.ok) { setNotice({ kind: 'ok', text: r.detail ?? '已更新' }); if (r.restartRequired) setRestartBanner(true); await reload(); await doCheckUpdates() }
      else setNotice({ kind: 'err', text: r.error ?? '更新失败' })
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setBusy('') }
  }

  const doToggle = async (row: InstalledPlugin) => {
    if (row.entryId === undefined) { setNotice({ kind: 'err', text: '该插件无入口 id，无法启停' }); return }
    setBusy('toggle:' + row.name); setNotice(null)
    try {
      const r = await api.toggle(row.entryId, !row.enabled)
      if (r.ok) { setNotice({ kind: 'ok', text: r.detail ?? '已切换' }); await reload() }
      else setNotice({ kind: 'err', text: r.error ?? '切换失败' })
    } catch (e) { setNotice({ kind: 'err', text: String((e as Error)?.message ?? e) }) }
    finally { setBusy('') }
  }

  return (
    <div className={css.sectionPage}>
      <h2 className={css.pageHeading}>{t('title')}</h2>
      <p className={css.pageIntro}>{t('description')}</p>

      {restartBanner ? (
        <div className={css.banner} role="status">
          <strong>需要重启 dsh web 生效。</strong> 部分改动（bundle 增删/更新）在下次启动时合成层栈。
        </div>
      ) : null}

      <div className={css.settingsBox}>
        <label className={css.toggle}>
          <input type="checkbox" checked={autoUpdate} onChange={(e) => void toggleAuto(e.currentTarget.checked)} />
          <span>自动更新（后台定时检查并更新 git 源插件，完成后左下角提示重启）</span>
        </label>
        <div className={css.row}>
          <button className={css.btn} type="button" disabled={checking || busy !== ''} onClick={() => void doCheckUpdates()}>
            {checking ? '检查中…' : '检查更新'}
          </button>
          <button className={css.btn} type="button" disabled={busy !== '' || Object.keys(updates).length === 0} onClick={() => void doUpdateAll()}>
            更新全部（{Object.keys(updates).length}）
          </button>
        </div>
      </div>

      <div className={css.installBox}>
        <label className={css.fieldLabel}>GitHub 仓库链接</label>
        <div className={css.row}>
          <input
            className={css.input}
            type="text"
            value={url}
            placeholder="https://github.com/owner/repo"
            onChange={(e) => setUrl(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void doInspect() }}
          />
          <button className={css.btn} type="button" disabled={inspecting || url.trim() === ''} onClick={() => void doInspect()}>
            {inspecting ? '校验中…' : '校验'}
          </button>
        </div>

        {inspect !== null ? (
          <div className={css.inspect} data-ok={inspect.ok ? 'true' : 'false'}>
            {inspect.ok ? (
              <div className={css.inspectBody}>
                <div className={css.inspectLine}><strong>{inspect.packageName ?? '?'}</strong> · {TYPE_LABEL[inspect.type ?? 'npm'] ?? inspect.type}</div>
                {inspect.capabilities && inspect.capabilities.length > 0 ? (
                  <div className={css.inspectLine}>能力：{inspect.capabilities.join('、')}</div>
                ) : null}
                {inspect.defaultBranch ? <div className={css.inspectLine}>分支：{inspect.defaultBranch}</div> : null}
                {inspect.commit ? <div className={css.inspectLine}>commit：{inspect.commit.slice(0, 12)}</div> : null}
                {inspect.warnings && inspect.warnings.length > 0 ? (
                  <div className={css.warn}>⚠ {inspect.warnings.join('；')}</div>
                ) : null}
                <div className={css.danger}>安装第三方代码即运行任意代码，请确认来源可信。</div>
                <div className={css.row}>
                  <button className={css.primary} type="button" disabled={busy !== ''} onClick={() => void doInstall(needConfirm)}>
                    {busy === 'install' ? '安装中…' : needConfirm ? '确认安装（纯 cordis）' : '安装'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={css.warn}>✗ {inspect.reason ?? '校验失败'}</div>
            )}
          </div>
        ) : null}
      </div>

      {notice !== null ? (
        <div className={css.notice} data-kind={notice.kind} role={notice.kind === 'err' ? 'alert' : 'status'}>{notice.text}</div>
      ) : null}

      <div className={css.listHead}><h3>已安装插件</h3><span>{plugins.length}</span></div>
      {loadingList ? <p className={css.status}>加载中…</p> : null}
      {!loadingList && plugins.length === 0 ? <p className={css.status}>暂无已安装插件</p> : null}
      {plugins.length > 0 ? (
        <ul className={css.cards}>
          {plugins.map((row) => (
            <li className={css.card} key={row.name}>
              <div className={css.cardMain}>
                <div className={css.cardTop}>
                  <strong className={css.cardTitle}>{row.name}</strong>
                  <span className={css.tag} data-type={row.type}>{TYPE_LABEL[row.type] ?? row.type}</span>
                  {row.enabled ? null : <span className={css.tag} data-off="true">已禁用</span>}
                  {row.runtimePhase !== null && row.runtimePhase !== undefined ? (
                    <span className={css.tag} data-phase={row.runtimePhase}>{PHASE_LABEL[row.runtimePhase] ?? row.runtimePhase}</span>
                  ) : null}
                  {row.managedByBrat ? <span className={css.tag} data-managed="true">mgmt</span> : null}
                  {updates[row.name] ? <span className={css.tag} data-update="true">可更新 → {updates[row.name]}</span> : null}
                </div>
                <div className={css.cardMeta}>
                  <span>版本 {row.version}</span>
                  {row.sourceUrl !== undefined && row.sourceUrl !== '' ? (
                    <>
                      <span> · </span>
                      <a className={css.link} href={row.sourceUrl} target="_blank" rel="noopener noreferrer" title={row.sourceUrl}>GitHub ↗</a>
                    </>
                  ) : null}
                </div>
              </div>
              <div className={css.cardActions}>
                <button className={css.btn} type="button" disabled={busy !== ''} onClick={() => void doUpdate(row.name)}>更新</button>
                <button className={css.btn} type="button" disabled={busy !== '' || row.entryId === undefined} onClick={() => void doToggle(row)}>
                  {row.enabled ? '禁用' : '启用'}
                </button>
                <button className={css.dangerBtn} type="button" disabled={busy !== ''} onClick={() => void doRemove(row.name)}>删除</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
