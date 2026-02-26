import { spawn } from 'child_process'
import { platform } from 'os'

const WEAK_FAIL_THRESHOLD = 3

/**
 * Dieharder: system binary, run as: dieharder -a -g 201 -f <file>
 * Stops and fails the test if "weak" appears 3+ times or "fail" appears at least once (case insensitive).
 */
export function runDieharder(job, onDone, deps) {
  const quote = (p) => '"' + p.replace(/"/g, '\\"') + '"'
  const shellCmd = `dieharder -a -g 201 -f ${quote(job.filePath)}`
  if (!shellCmd.trim()) {
    console.error('[testQueue] Die Harder: shell command is empty')
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  console.log('[testQueue] Die Harder shell:', shellCmd)
  // detached: true so the shell (and its child dieharder) run in their own process group on Unix
  const child = spawn(shellCmd, [], { shell: true, detached: true })

  let weakCount = 0
  let stoppedEarly = false

  function stopAndFail(reason) {
    if (stoppedEarly) return
    stoppedEarly = true
    try {
      // Kill process group so dieharder (child of shell) stops; negative PID = process group on Unix
      if (platform() !== 'win32' && child.pid) {
        process.kill(-child.pid, 'SIGTERM')
      } else {
        child.kill('SIGTERM')
      }
    } catch (_) {}
    console.log('[testQueue] Die Harder stopped:', reason)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
  }

  child.stdout?.on('data', (data) => {
    const chunk = data.toString()
    console.log('[testQueue stdout]', chunk)
    const lower = chunk.toLowerCase()
    if (lower.includes('fail')) {
      stopAndFail('"fail" occurred')
      return
    }
    weakCount += (lower.match(/weak/g) || []).length
    if (weakCount >= WEAK_FAIL_THRESHOLD) {
      stopAndFail(`"weak" occurred ${weakCount} times (threshold ${WEAK_FAIL_THRESHOLD})`)
      return
    }
  })

  child.stderr?.on('data', (data) => {
    console.log('[testQueue stderr]', data.toString())
  })

  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    if (!stoppedEarly) {
      stoppedEarly = true
      deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
      onDone()
    }
  })

  child.on('close', (code, signal) => {
    if (stoppedEarly) return
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    const status = code === 0 ? 'Passed' : 'Failed'
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
