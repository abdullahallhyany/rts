import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import { smallCrushPassFail } from '../crushingAnalysis.js'

export function runScrush(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const crushingDir = join(dir, 'crushing')
  const exe = 'scrush'
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
    console.error('[testQueue] Small Crush: shell command is empty')
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  console.log('[testQueue] Small Crush shell:', shellCmd)
  const child = spawn(shellCmd, [], { cwd: crushingDir, shell: true })

  let stdoutText = ''

  child.stdout?.on('data', (data) => {
    const chunk = data.toString()
    console.log('[testQueue stdout]', chunk)
    stdoutText += chunk
  })

  child.stderr?.on('data', (data) => {
    console.log('[testQueue stderr]', data.toString())
  })

  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
  })

  child.on('close', (code, signal) => {
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    const passed = smallCrushPassFail(stdoutText)
    const status = passed ? 'Passed' : 'Failed'
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
