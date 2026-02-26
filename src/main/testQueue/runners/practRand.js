import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'
import { platform } from 'os'

const UNUSUAL_SUSPICIOUS_THRESHOLD = 3

/**
 * Pract Rand: RNG_test stdin64 -multithreaded < "path" (shell redirect)
 * Stops and fails if "fail" appears (instant), or "unusual" + "suspicious" combined count reaches 3 (case insensitive).
 */
export function runPractRand(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const practrandDir = join(dir, 'practrand')
  const exe = 'RNG_test'
  const command = join(practrandDir, exe)
  if (!existsSync(command)) {
    console.error('[testQueue] Executable not found:', command)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const quote = (p) => '"' + p.replace(/"/g, '\\"') + '"'
  const shellCmd = `${quote(command)} stdin64 -a -multithreaded < ${quote(job.filePath)}`
  if (!shellCmd.trim()) {
    console.error('[testQueue] Pract Rand: shell command is empty')
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  console.log('[testQueue] Pract Rand shell:', shellCmd)
  const child = spawn(shellCmd, [], { cwd: practrandDir, shell: true, detached: true })

  let unusualSuspiciousCount = 0
  let stoppedEarly = false

  function stopAndFail(reason) {
    if (stoppedEarly) return
    stoppedEarly = true
    try {
      if (platform() !== 'win32' && child.pid) {
        process.kill(-child.pid, 'SIGTERM')
      } else {
        child.kill('SIGTERM')
      }
    } catch (_) {}
    console.log('[testQueue] Pract Rand stopped:', reason)
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
    const unusualCount = (lower.match(/unusual/g) || []).length
    const suspiciousCount = (lower.match(/suspicious/g) || []).length
    unusualSuspiciousCount += unusualCount + suspiciousCount
    if (unusualSuspiciousCount >= UNUSUAL_SUSPICIOUS_THRESHOLD) {
      stopAndFail(
        `"unusual" + "suspicious" count reached ${unusualSuspiciousCount} (threshold ${UNUSUAL_SUSPICIOUS_THRESHOLD})`
      )
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
