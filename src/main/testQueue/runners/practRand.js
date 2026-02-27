import { join } from 'path'
import { createReadStream } from 'fs'
import { platform } from 'os'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

const UNUSUAL_SUSPICIOUS_THRESHOLD = 3

/**
 * Pract Rand: RNG_test stdin64 -multithreaded < "path" (shell redirect)
 * Stops and fails if "fail" appears (instant), or "unusual" + "suspicious" combined count reaches 3 (case insensitive).
 */
export function runPractRand(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const practrandDir = join(dir, 'practrand')

  let toolPath
  try {
    toolPath = getToolPath('PRACTRAND')
  } catch (err) {
    console.error('[testQueue] PractRand path resolution error:', err.message)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }
  const valid = validateToolPath('PRACTRAND', toolPath)
  if (!valid.success) {
    console.error('[testQueue] PractRand invalid path:', toolPath)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }

  const args = ['stdin64', '-a', '-multithreaded']
  console.log('[testQueue] Pract Rand command:', toolPath, args.join(' '))
  const runResult = runCrossPlatform(toolPath, args, { cwd: practrandDir, detached: true })
  if (!runResult.success) {
    console.error('[testQueue] PractRand spawn error:', runResult.message || runResult.code)
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
  // pipe file into stdin instead of shell redirect
  const inputStream = createReadStream(job.filePath)
  inputStream.on('error', (err) => {
    console.error('[testQueue] PractRand input error:', err.message)
  })
  inputStream.pipe(child.stdin)

  child.stdout?.on('data', (data) => {
    const text = data.toString()
    deps.appendOutput(job.id, text)
    console.log('[testQueue stdout]', text)
    const lower = text.toLowerCase()
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
    const text = data.toString()
    deps.appendOutput(job.id, text)
    console.log('[testQueue stderr]', text)
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
    } catch {
      // ignore
    }
    console.log('[testQueue] Pract Rand stopped:', reason)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
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
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
