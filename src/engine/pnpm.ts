/** pnpm runner: spawn pnpm in the profile dir, proxy env stripped, streamed. */
import { spawn } from 'node:child_process'
import { profileDir } from './paths.ts'

const PROXY_VARS = ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'all_proxy']

export interface PnpmResult { exitCode: number; stdout: string; stderr: string }

export function runPnpm(args: string[], onOutput?: (chunk: string) => void): Promise<PnpmResult> {
  return new Promise((resolve, reject) => {
    const env: NodeJS.ProcessEnv = { ...process.env }
    for (const key of PROXY_VARS) delete env[key]

    const child = spawn('pnpm', args, {
      cwd: profileDir(),
      env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => { const t = chunk.toString(); stdout += t; onOutput?.(t) })
    child.stderr.on('data', (chunk: Buffer) => { const t = chunk.toString(); stderr += t; onOutput?.(t) })
    child.on('error', reject)
    child.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }))
  })
}
