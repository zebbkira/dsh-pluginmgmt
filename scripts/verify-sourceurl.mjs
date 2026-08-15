/** Print each installed plugin's resolved GitHub URL (diagnostic). */
import { homedir } from 'node:os'
import { join } from 'node:path'
process.env.DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const { listPlugins } = await import('../src/engine/list.ts')
const rows = listPlugins(join(process.env.DSH_HOME, 'profiles', 'web'), [])
for (const r of rows) console.log(r.name + '  =>  ' + (r.sourceUrl ?? '(无链接)'))
