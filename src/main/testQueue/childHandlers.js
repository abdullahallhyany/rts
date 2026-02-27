import { formatCompletedAt } from './util.js'

/**
 * Attach stdout/stderr logging and on error/close send test-finished and call onDone.
 * @param {import('child_process').ChildProcess} child
 * @param {{ id: string }} job
 * @param {() => void} onDone
 * @param {(channel: string, payload: unknown) => void} send
 */
/**
 * Attach stdout/stderr logging and status updates.  This helper is used by
 * simple runners (crush, bcrush, rabbit, alpha) where no additional parsing is
 * required.  The deps object must expose registerChild, appendOutput, and
 * updateStatus.
 *
 * @param {import('child_process').ChildProcess} child
 * @param {{ id: string }} job
 * @param {() => void} onDone
 * @param {(channel: string, payload: unknown) => void} send
 * @param {object} deps
 */
export function attachChildHandlers(child, job, onDone, send, deps) {
  deps.registerChild(job.id, child)

  child.stdout?.on('data', (data) => {
    const text = data.toString()
    deps.appendOutput(job.id, text)
    console.log('[testQueue stdout]', text)
  })
  child.stderr?.on('data', (data) => {
    const text = data.toString()
    deps.appendOutput(job.id, text)
    console.log('[testQueue stderr]', text)
  })
  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    deps.updateStatus(job.id, 'Failed')
    send('test-finished', { id: job.id, status: 'Failed', completedAt: formatCompletedAt() })
    onDone()
  })
  child.on('close', (code, signal) => {
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    const status = code === 0 ? 'Passed' : 'Failed'
    deps.updateStatus(job.id, status)
    send('test-finished', { id: job.id, status, completedAt: formatCompletedAt() })
    onDone()
  })
}
