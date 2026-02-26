import { spawn } from 'child_process'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { analyzeStsReport } from '../stsAnalysis.js'

const REPORT_PATH = ['sts', 'experiments', 'AlgorithmTesting', 'finalAnalysisReport.txt']

export function runNist(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const stsDir = join(dir, 'sts')
  const exe = 'nist'
  const command = join(stsDir, exe)
  if (!existsSync(command)) {
    console.error('[testQueue] Executable not found:', command)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const quote = (p) => '"' + p.replace(/"/g, '\\"') + '"'
  const shellCmd = `${quote(command)} -fast -fileoutput 1000000 ${quote(job.filePath)}`
  if (!shellCmd.trim()) {
    console.error('[testQueue] NIST STS: shell command is empty')
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  console.log('[testQueue] NIST STS shell:', shellCmd)
  const child = spawn(shellCmd, [], { cwd: stsDir, shell: true })

  child.stdout?.on('data', (data) => {
    console.log('[testQueue stdout]', data.toString())
  })
  child.stderr?.on('data', (data) => {
    console.log('[testQueue stderr]', data.toString())
  })
  child.on('error', (err) => {
    console.error('[testQueue] child error:', err.message)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
  })
  child.on('close', (code, signal) => {
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)
    let status = code === 0 ? 'Passed' : 'Failed'
    const reportPath = join(dir, ...REPORT_PATH)
    if (existsSync(reportPath)) {
      try {
        const content = readFileSync(reportPath, 'utf8')
        const analysis = analyzeStsReport(content)
        if (analysis.failed) {
          status = 'Failed'
          console.log('[testQueue] NIST STS analysis:', analysis.reason)
        }
      } catch (err) {
        console.warn('[testQueue] NIST STS report read failed:', err.message)
      }
    }
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
