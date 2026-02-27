import { platform } from 'os'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

const WEAK_FAIL_THRESHOLD = 3

/**
 * Dieharder: system binary, run as: dieharder -a -g 201 -f <file>
 * Stops and fails the test if "weak" appears 3+ times or "fail" appears at least once (case insensitive).
 */
export function runDieharder(job, onDone, deps) {
  let toolPath
  try {
    toolPath = getToolPath('DIEHARDER')
  } catch (err) {
    console.error('[testQueue] Dieharder path resolution error:', err.message)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }
  const valid = validateToolPath('DIEHARDER', toolPath)
  if (!valid.success) {
    console.error('[testQueue] Dieharder invalid path:', toolPath)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }

  const args = ['-a', '-g', '201', '-f', job.filePath]
  console.log('[testQueue] Die Harder command:', toolPath, args.join(' '))
  const runResult = runCrossPlatform(toolPath, args, { detached: true })
  if (!runResult.success) {
    console.error('[testQueue] Die Harder spawn error:', runResult.message || runResult.code)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }
  const child = runResult.child
  deps.registerChild(job.id, child)

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
    } catch {
      // ignore
    }
    console.log('[testQueue] Die Harder stopped:', reason)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
  }

  child.stdout?.on('data', (data) => {
    const chunk = data.toString()
    deps.appendOutput(job.id, chunk)
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
    const txt = data.toString()
    deps.appendOutput(job.id, txt)
    console.log('[testQueue stderr]', txt)
  })

  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    if (!stoppedEarly) {
      stoppedEarly = true
      deps.updateStatus(job.id, 'Failed')
      deps.send('test-finished', {
        id: job.id,
        status: 'Failed',
        completedAt: deps.formatCompletedAt()
      })
      onDone()
    }
  })

  child.on('close', (code, signal) => {
    if (stoppedEarly) return
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    const status = code === 0 ? 'Passed' : 'Failed'
    deps.updateStatus(job.id, status)
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
