import { describe, expect, it } from 'vitest'
import { parseGithubSource } from './resolve.ts'

describe('parseGithubSource', () => {
  it('parses a plain https repo URL', () => {
    expect(parseGithubSource('https://github.com/owner/repo')).toEqual({ host: 'github', owner: 'owner', repo: 'repo' })
  })
  it('parses a tree URL with branch and subdir', () => {
    expect(parseGithubSource('https://github.com/o/r/tree/main/packages/foo')).toEqual({ host: 'github', owner: 'o', repo: 'r', ref: 'main', subdir: 'packages/foo' })
  })
  it('parses ssh form and strips .git', () => {
    expect(parseGithubSource('git@github.com:o/r.git')).toEqual({ host: 'github', owner: 'o', repo: 'r' })
  })
  it('parses a pnpm github: spec with pin and path', () => {
    expect(parseGithubSource('github:o/r#abc123&path:/packages/foo')).toEqual({ host: 'github', owner: 'o', repo: 'r', ref: 'abc123', subdir: 'packages/foo' })
  })
  it('parses git+https form', () => {
    expect(parseGithubSource('git+https://github.com/o/r.git')).toEqual({ host: 'github', owner: 'o', repo: 'r' })
  })
  it('rejects non-github hosts and garbage', () => {
    expect(parseGithubSource('https://gitlab.com/o/r')).toBeNull()
    expect(parseGithubSource('https://example.com')).toBeNull()
    expect(parseGithubSource('not a url')).toBeNull()
    expect(parseGithubSource('')).toBeNull()
  })
})
