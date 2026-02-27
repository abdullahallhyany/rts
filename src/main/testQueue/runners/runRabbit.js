import { join } from 'path'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

export function runRabbit(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const crushingDir = join(dir, 'crushing')

  let toolPath
  try {
    toolPath = getToolPath('TESTU01_RABBIT')
  } catch (err) {
    console.error('[testQueue] Rabbit path error:', err.message)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const valid = validateToolPath('TESTU01_RABBIT', toolPath)
  if (!valid.success) {
    console.error('[testQueue] Rabbit invalid path:', toolPath)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }

  const args = [job.filePath]
  console.log('[testQueue] Rabbit command:', toolPath, args.join(' '))
  const result = runCrossPlatform(toolPath, args, { cwd: crushingDir })
  if (!result.success) {
    console.error('[testQueue] Rabbit spawn error:', result.message || result.code)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const child = result.child
  deps.attachChildHandlers(child, job, onDone, deps.send)
}
