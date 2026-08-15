/** Line-based editor for the profile cordis.patch.yml (preserves comments). */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export interface PatchState {
  inserts: Array<{ id: string; name: string }>
  disabled: Map<string, boolean>
}

export function readPatch(path: string): PatchState {
  const state: PatchState = { inserts: [], disabled: new Map() }
  if (!existsSync(path)) return state
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const idm = /^-\s+id:\s*(.+?)\s*(?:#.*)?$/.exec(line)
    if (idm !== null) {
      const id = idm[1].trim()
      for (let j = i + 1; j < lines.length; j++) {
        if (/^-\s+id:/.test(lines[j]) || /^-\s+insert:/.test(lines[j])) break
        const d = /^\s*disabled:\s*(true|false)/.exec(lines[j])
        if (d !== null) { state.disabled.set(id, d[1] === 'true'); break }
      }
    } else if (/^-\s+insert:\s*$/.test(line)) {
      let id = ''
      let name = ''
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j]
        if ((/^-\s+/.test(l)) && !(/^\s+-\s+id:/.test(l)) && !(/^\s+name:/.test(l))) break
        const im = /^\s+-\s+id:\s*(.+?)\s*$/.exec(l)
        if (im !== null) id = im[1].trim()
        const nm = /^\s+name:\s*(.+?)\s*$/.exec(l)
        if (nm !== null) name = nm[1].trim().replace(/^['"]|['"]$/g, '')
      }
      if (id !== '') state.inserts.push({ id, name })
    }
  }
  return state
}

/** Set (or update) the disabled flag on one entry id; append if absent. */
export function toggleDisabled(path: string, id: string, enabled: boolean): void {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const m = /^-\s+id:\s*(.+?)\s*(?:#.*)?$/.exec(lines[i])
    if (m === null || m[1].trim() !== id) continue
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j]
      if (/^-\s+id:/.test(l) || /^-\s+insert:/.test(l)) break
      if (/^\s*disabled:\s*(true|false)/.test(l)) {
        lines[j] = l.replace(/^(\s*disabled:\s*)(true|false)/, '$1' + String(enabled))
        writeFileSync(path, lines.join('\n'))
        return
      }
    }
    lines.splice(i + 1, 0, '  disabled: ' + String(enabled))
    writeFileSync(path, lines.join('\n'))
    return
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  lines.push('- id: ' + id)
  lines.push('  disabled: ' + String(enabled))
  lines.push('')
  writeFileSync(path, lines.join('\n'))
}

/** Append an insert block for a pure cordis plugin. */
export function addInsert(path: string, id: string, name: string): void {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  lines.push('- insert:')
  lines.push('    - id: ' + id)
  lines.push('      name: ' + JSON.stringify(name))
  lines.push('')
  writeFileSync(path, lines.join('\n'))
}

/** Remove the insert block whose sub-entry id matches. */
export function removeInsert(path: string, id: string): void {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    if (/^-\s+insert:\s*$/.test(lines[i])) {
      let j = i + 1
      let hasId = false
      while (j < lines.length && !/^-\s+(?:id|insert):/.test(lines[j])) {
        const im = /^\s+-\s+id:\s*(.+?)\s*$/.exec(lines[j])
        if (im !== null && im[1].trim() === id) hasId = true
        j++
      }
      if (hasId) {
        while (j < lines.length && lines[j].trim() === '') j++
        i = j
        continue
      }
    }
    out.push(lines[i])
    i++
  }
  writeFileSync(path, out.join('\n'))
}
