import { join } from 'path'
import { smallCrushPassFail } from '../crushingAnalysis.js'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

export function runScrush(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const crushingDir = join(dir, 'crushing')

  let toolPath
  try {
    toolPath = getToolPath('TESTU01_SCRUSH')
  } catch (err) {
    console.error('[testQueue] Small Crush path error:', err.message)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }
  const valid = validateToolPath('TESTU01_SCRUSH', toolPath)
  if (!valid.success) {
    console.error('[testQueue] Small Crush invalid path:', toolPath)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }

  const args = [job.filePath]
  console.log('[testQueue] Small Crush command:', toolPath, args.join(' '))
  const result = runCrossPlatform(toolPath, args, { cwd: crushingDir })
  if (!result.success) {
    console.error('[testQueue] Small Crush spawn error:', result.message || result.code)
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
    return
  }
  const child = result.child
  deps.registerChild(job.id, child)

  let stdoutText = ''

  child.stdout?.on('data', (data) => {
    const chunk = data.toString()
    deps.appendOutput(job.id, chunk)
    console.log('[testQueue stdout]', chunk)
    stdoutText += chunk
  })

  child.stderr?.on('data', (data) => {
    const txt = data.toString()
    deps.appendOutput(job.id, txt)
    console.log('[testQueue stderr]', txt)
  })

  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    deps.updateStatus(job.id, 'Failed')
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
    onDone()
  })

  child.on('close', (code, signal) => {
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    const passed = smallCrushPassFail(stdoutText)
    const status = passed ? 'Passed' : 'Failed'
    deps.updateStatus(job.id, status)
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })

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
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
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
