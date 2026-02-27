import { join } from 'path'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

export function runCrush(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const crushingDir = join(dir, 'crushing')

  let toolPath
  try {
    toolPath = getToolPath('TESTU01_CRUSH')
  } catch (err) {
    console.error('[testQueue] Crush path error:', err.message)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const valid = validateToolPath('TESTU01_CRUSH', toolPath)
  if (!valid.success) {
    console.error('[testQueue] Crush invalid path:', toolPath)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }

  const args = [job.filePath]
  console.log('[testQueue] Crush command:', toolPath, args.join(' '))
  const result = runCrossPlatform(toolPath, args, { cwd: crushingDir })
  if (!result.success) {
    console.error('[testQueue] Crush spawn error:', result.message || result.code)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const child = result.child
  deps.attachChildHandlers(child, job, onDone, deps.send)
}
