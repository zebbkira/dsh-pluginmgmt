/** GitHub URL -> normalized source. Pure string parsing (no regex escapes). */
import type { ParsedSource } from '../protocol.ts'

function stripGitSuffix(repo: string): string {
  return repo.toLowerCase().endsWith('.git') ? repo.slice(0, -4) : repo
}

export function parseGithubSource(input: string): ParsedSource | null {
  let raw = input.trim()
  if (raw === '') return null
  if (raw.startsWith('git+')) raw = raw.slice(4)

  // ssh form: git@github.com:owner/repo.git
  if (raw.startsWith('git@github.com:')) {
    let rest = raw.slice('git@github.com:'.length)
    rest = stripGitSuffix(rest)
    const seg = rest.split('/')
    if (seg.length >= 2 && seg[0] !== '' && seg[1] !== '') return { host: 'github', owner: seg[0], repo: seg[1] }
    return null
  }

  // pnpm-style: github:owner/repo#ref&path:/sub
  if (raw.startsWith('github:')) {
    let rest = raw.slice('github:'.length)
    let ref: string | undefined
    let subdir: string | undefined
    const hash = rest.indexOf('#')
    if (hash >= 0) {
      const afterHash = rest.slice(hash + 1)
      const amp = afterHash.indexOf('&')
      const refPart = amp >= 0 ? afterHash.slice(0, amp) : afterHash
      const query = amp >= 0 ? afterHash.slice(amp + 1) : ''
      ref = refPart || undefined
      rest = rest.slice(0, hash)
      const pm = query.split('&').find((kv) => kv.startsWith('path:'))
      if (pm !== undefined) {
        const p = pm.slice('path:'.length)
        subdir = p.split('/').filter(Boolean).join('/') || undefined
      }
    }
    const seg = rest.split('/')
    if (seg.length >= 2 && seg[0] !== '' && seg[1] !== '') {
      return { host: 'github', owner: seg[0], repo: stripGitSuffix(seg[1]), ref, subdir }
    }
    return null
  }

  // http(s) form (also handles a bare 'owner/repo' via https:// prefix)
  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : 'https://' + raw)
  } catch {
    return null
  }
  if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) return null
  const owner = parts[0]
  const repo = stripGitSuffix(parts[1])
  let ref: string | undefined
  let subdir: string | undefined
  if ((parts[2] === 'tree' || parts[2] === 'blob') && parts[3] !== undefined) {
    ref = parts[3]
    subdir = parts.slice(4).join('/') || undefined
  }
  return { host: 'github', owner, repo, ref, subdir }
}
