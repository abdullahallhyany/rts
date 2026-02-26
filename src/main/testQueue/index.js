import { rngTestsDir } from './paths.js'
import { formatCompletedAt } from './util.js'
import { attachChildHandlers } from './childHandlers.js'
import { RUNNERS } from './runners/index.js'

/** @type {import('electron').WebContents | null} */
let sender = null

/** @type {{ id: string, type: string, filePath: string }[]} */
const queue = []
let running = false

function send(channel, payload) {
  if (sender && !sender.isDestroyed()) {
    sender.send(channel, payload)
  }
}

const deps = {
  rngTestsDir,
  send,
  formatCompletedAt,
  attachChildHandlers
}

function failNoRunner(job, onDone) {
  console.log('[testQueue] No runner for type:', job.type)
  send('test-finished', { id: job.id, status: 'Failed', completedAt: formatCompletedAt() })
  onDone()
}

function runTest(job, onDone) {
  console.log('[testQueue] Run job', job.id, '| type:', job.type, '| filePath:', job.filePath)
  const run = RUNNERS[String(job.type).trim()]
  if (!run) {
    failNoRunner(job, onDone)
    return
  }
  run(job, onDone, deps)
}

function startNext() {
  if (running || queue.length === 0) return
  const job = queue.shift()
  if (!job) return
  running = true
  console.log('[testQueue] Starting job', job.id)
  send('test-started', { id: job.id })
  runTest(job, () => {
    running = false
    startNext()
  })
}

/**
 * Add a job to the queue (FIFO). If no test is running, starts this one immediately.
 * @param {{ id: string, type: string, filePath: string }} job
 * @param {import('electron').WebContents} webContents
 */
export function enqueue(job, webContents) {
  console.log('[testQueue] enqueue called', { id: job?.id, type: job?.type, filePath: job?.filePath })
  if (!job?.id || !job?.type || !job?.filePath) {
    console.warn('[testQueue] enqueue ignored: missing id, type, or filePath')
    return
  }
  if (sender === null) sender = webContents
  queue.push({ id: job.id, type: job.type, filePath: job.filePath })
  console.log('[testQueue] queue length:', queue.length)
  startNext()
}
