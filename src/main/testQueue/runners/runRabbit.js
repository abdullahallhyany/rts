import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'

export function runRabbit(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const crushingDir = join(dir, 'crushing')
  const exe = 'rabbit'
  const command = join(crushingDir, exe)
  if (!existsSync(command)) {
    console.error('[testQueue] Executable not found:', command)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const quote = (p) => '"' + p.replace(/"/g, '\\"') + '"'
  const shellCmd = `${quote(command)} ${quote(job.filePath)}`
  if (!shellCmd.trim()) {
    console.error('[testQueue] Rabbit: shell command is empty')
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  console.log('[testQueue] Rabbit shell:', shellCmd)
  const child = spawn(shellCmd, [], { cwd: crushingDir, shell: true })
  deps.attachChildHandlers(child, job, onDone, deps.send)
}
