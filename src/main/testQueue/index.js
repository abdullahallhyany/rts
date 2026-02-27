import { rngTestsDir } from './paths.js'
import { formatCompletedAt } from './util.js'
import { attachChildHandlers } from './childHandlers.js'
import { RUNNERS } from './runners/index.js'
import { platform } from 'os'

/** @type {import('electron').WebContents | null} */
let sender = null

/** @type {{ id: string, type: string, filePath: string }[]} */
const queue = []
let running = false
let currentJobId = null

// store extra metadata per job for result/download/delete
const jobStore = new Map()

function send(channel, payload) {
  if (sender && !sender.isDestroyed()) {
    sender.send(channel, payload)
  }
}

// helpers used by IPC and internal logic
export function getJobRecord(id) {
  return jobStore.get(id) || null
}

function killChild(child) {
  try {
    if (platform() !== 'win32' && child.pid) {
      process.kill(-child.pid, 'SIGTERM')
    } else {
      child.kill('SIGTERM')
    }
  } catch {
    // ignore errors when killing
  }
}

export function deleteJobRecord(id) {
  const rec = jobStore.get(id)
  if (!rec) return false
  // kill running process if any
  if (rec.child) {
    killChild(rec.child)
  }
  // remove from queue
  const idx = queue.findIndex((j) => j.id === id)
  if (idx !== -1) queue.splice(idx, 1)
  const wasRunning = currentJobId === id
  jobStore.delete(id)
  if (wasRunning) {
    running = false
    currentJobId = null
    startNext()
  }
  return true
}

function updateJobStatus(id, status) {
  const rec = jobStore.get(id)
  if (rec) rec.status = status
}

function appendJobOutput(id, text) {
  const rec = jobStore.get(id)
  if (rec) rec.rawOutput += text
}

function setParsedResult(id, parsed) {
  const rec = jobStore.get(id)
  if (rec) rec.parsedResult = parsed
}

function registerChild(id, child) {
  const rec = jobStore.get(id)
  if (rec) rec.child = child
}

const deps = {
  rngTestsDir,
  send,
  formatCompletedAt,
  attachChildHandlers,
  // store helpers for runners
  registerChild,
  appendOutput: appendJobOutput,
  setParsedResult,
  updateStatus: updateJobStatus
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
  // Update status to "In Progress" and record the start time
  updateJobStatus(job.id, 'In Progress')
  const rec = jobStore.get(job.id)
  if (rec && !rec.startedAt) {
    rec.startedAt = formatCompletedAt()
  }
  currentJobId = job.id
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
    currentJobId = null
    startNext()
  })
}

/**
 * Add a job to the queue (FIFO). If no test is running, starts this one immediately.
 * @param {{ id: string, type: string, filePath: string }} job
 * @param {import('electron').WebContents} webContents
 */
export function enqueue(job, webContents) {
  console.log('[testQueue] enqueue called', {
    id: job?.id,
    type: job?.type,
    filePath: job?.filePath
  })
  if (!job?.id || !job?.type || !job?.filePath) {
    console.warn('[testQueue] enqueue ignored: missing id, type, or filePath')
    return
  }
  if (sender === null) sender = webContents
  // create record in store
  jobStore.set(job.id, {
    id: job.id,
    type: job.type,
    filePath: job.filePath,
    status: 'Queued',
    startedAt: null,
    rawOutput: '',
    parsedResult: null,
    child: null
  })
  queue.push({ id: job.id, type: job.type, filePath: job.filePath })
  console.log('[testQueue] queue length:', queue.length)
  startNext()
}
