import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addInsert, readPatch, removeInsert, toggleDisabled } from './patch.ts'

let dir: string
const p = () => join(dir, 'cordis.patch.yml')
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'dsh-brat-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

describe('toggleDisabled', () => {
  it('flips an existing disabled flag and preserves the inline comment', () => {
    writeFileSync(p(), '- id: ui-x\n  disabled: false   # note\n')
    toggleDisabled(p(), 'ui-x', true)
    expect(readFileSync(p(), 'utf8')).toContain('disabled: true   # note')
  })
  it('appends a new entry when the id is absent', () => {
    writeFileSync(p(), '- id: ui-other\n  disabled: false\n')
    toggleDisabled(p(), 'ui-new', true)
    const text = readFileSync(p(), 'utf8')
    expect(text).toContain('- id: ui-new')
    expect(text).toContain('disabled: true')
  })
})

describe('addInsert / removeInsert / readPatch', () => {
  it('round-trips an insert block', () => {
    writeFileSync(p(), '')
    addInsert(p(), 'ui-brat', 'dsh-brat')
    let state = readPatch(p())
    expect(state.inserts).toEqual([{ id: 'ui-brat', name: 'dsh-brat' }])
    removeInsert(p(), 'ui-brat')
    state = readPatch(p())
    expect(state.inserts).toEqual([])
  })
})
