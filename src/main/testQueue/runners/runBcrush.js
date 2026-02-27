import { join } from 'path'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

export function runBcrush(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const crushingDir = join(dir, 'crushing')

  let toolPath
  try {
    toolPath = getToolPath('TESTU01_BCRUSH')
  } catch (err) {
    console.error('[testQueue] Big Crush path error:', err.message)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const valid = validateToolPath('TESTU01_BCRUSH', toolPath)
  if (!valid.success) {
    console.error('[testQueue] Big Crush invalid path:', toolPath)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }

  const args = [job.filePath]
  console.log('[testQueue] Big Crush command:', toolPath, args.join(' '))
  const result = runCrossPlatform(toolPath, args, { cwd: crushingDir })
  if (!result.success) {
    console.error('[testQueue] Big Crush spawn error:', result.message || result.code)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const child = result.child
  deps.attachChildHandlers(child, job, onDone, deps.send)
}
