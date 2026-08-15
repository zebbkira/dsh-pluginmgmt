/** Manifest slices the engine reads (no @deepseek-ai dependency). */
export interface DshBundleManifest { patch?: string }
export interface DshProfileManifest { bundles?: string[] }
export interface DshManifestSection {
  bundle?: DshBundleManifest
  profile?: DshProfileManifest
  client?: { platform?: string; inject?: string[] }
  skills?: string[]
  mcpServers?: Record<string, unknown>
}
export interface ProfileManifest {
  name?: string
  dependencies?: Record<string, string>
  dsh?: DshManifestSection
}
