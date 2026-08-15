/** Shared wire contract between the host and browser halves of dsh-pluginmgmt. */
export type PluginType = 'bundle' | 'cordis' | 'npm'

export interface ParsedSource {
  host: 'github'
  owner: string
  repo: string
  ref?: string
  subdir?: string
}

export interface InspectResult {
  ok: boolean
  reason?: string
  source?: ParsedSource
  defaultBranch?: string
  commit?: string
  type?: PluginType
  packageName?: string
  capabilities?: string[]
  warnings?: string[]
}

export type RuntimePhase = 'pending' | 'loading' | 'active' | 'failed' | 'unloading' | null

export interface InstalledPlugin {
  name: string
  type: PluginType
  version: string
  sourceUrl?: string
  entryId?: string
  enabled: boolean
  runtimePhase: RuntimePhase
  managedByBrat: boolean
  updateAvailable?: string
}

export interface RegistryEntry {
  name: string
  type: PluginType
  sourceUrl: string
  spec: string
  owner: string
  repo: string
  ref: string
  branch?: string
  subdir?: string
  entryId?: string
  installedAt: number
  updatedAt: number
}

export interface AutoUpdateSettings {
  autoUpdate: boolean
  autoUpdateIntervalMin: number
}

export interface AutoUpdateState {
  running: boolean
  lastCheckAt: number
  updated: string[]
  failed: Array<{ name: string; error: string }>
  restartPending: boolean
}

export interface RegistryDoc {
  version: 1
  plugins: Record<string, RegistryEntry>
  settings?: AutoUpdateSettings
}

export interface MutationResult {
  ok: boolean
  error?: string
  restartRequired?: boolean
  detail?: string
}

export const API = {
  plugins: '/api/dsh-pluginmgmt/plugins',
  inspect: '/api/dsh-pluginmgmt/inspect',
  install: '/api/dsh-pluginmgmt/install',
  remove: '/api/dsh-pluginmgmt/remove',
  update: '/api/dsh-pluginmgmt/update',
  checkUpdates: '/api/dsh-pluginmgmt/check-updates',
  toggle: '/api/dsh-pluginmgmt/toggle',
  status: '/api/dsh-pluginmgmt/status',
  settings: '/api/dsh-pluginmgmt/settings',
  autoUpdate: '/api/dsh-pluginmgmt/auto-update',
} as const
