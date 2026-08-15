/** Filesystem anchors for the plugin-management engine. */
import { homedir } from 'node:os'
import { join } from 'node:path'

export const PROFILE_NAME = 'web'

export function dshHome(): string {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

export function profileDir(): string {
  return join(dshHome(), 'profiles', PROFILE_NAME)
}

export function profileManifestPath(): string {
  return join(profileDir(), 'package.json')
}

export function profilePatchPath(): string {
  return join(profileDir(), 'cordis.patch.yml')
}

export function registryPath(): string {
  return join(dshHome(), 'dsh-pluginmgmt.json')
}
