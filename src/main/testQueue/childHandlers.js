import { formatCompletedAt } from './util.js'

/**
 * Attach stdout/stderr logging and on error/close send test-finished and call onDone.
 * @param {import('child_process').ChildProcess} child
 * @param {{ id: string }} job
 * @param {() => void} onDone
 * @param {(channel: string, payload: unknown) => void} send
 */
export function attachChildHandlers(child, job, onDone, send) {
  child.stdout?.on('data', (data) => {
    console.log('[testQueue stdout]', data.toString())
  })
  child.stderr?.on('data', (data) => {
    console.log('[testQueue stderr]', data.toString())
  })
  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    send('test-finished', { id: job.id, status: 'Failed', completedAt: formatCompletedAt() })
    onDone()
  })
  child.on('close', (code, signal) => {
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    const status = code === 0 ? 'Passed' : 'Failed'
    send('test-finished', { id: job.id, status, completedAt: formatCompletedAt() })
    onDone()
  })
}
