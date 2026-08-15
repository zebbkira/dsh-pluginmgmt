import { homedir } from 'node:os'
import { join } from 'node:path'
process.env.DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const { checkUpdates } = await import('../src/engine/manager.ts')
const updates = await checkUpdates()
const names = Object.keys(updates)
console.log('可更新插件数: ' + names.length)
for (const [name, latest] of Object.entries(updates)) console.log('  ' + name + ' -> ' + latest)
