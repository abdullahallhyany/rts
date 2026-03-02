import { basename, dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'
import { analyzeStsReport } from '../stsAnalysis.js'
import {
  getToolPath,
  validateToolPath,
  runCrossPlatform,
  getExecutionMode,
  getDockerImage
} from '../../utils/toolPathResolver.js'

const REPORT_PATH = ['sts', 'experiments', 'AlgorithmTesting', 'finalAnalysisReport.txt']

export function runNist(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const stsDir = join(dir, 'sts')
  const executionMode = getExecutionMode()

  let result

  if (executionMode === 'docker') {
    const inputFolder = dirname(job.filePath)
    const inputFile = basename(job.filePath)
    const image = getDockerImage()
    const args = ['run', '--rm', '-v', `${inputFolder}:/data`, image, 'niststs']
    console.log('[testQueue] NIST STS command: docker', args.join(' '), '| input:', inputFile)
    result = runCrossPlatform('docker', args)
  } else {
    let toolPath
    try {
      toolPath = getToolPath('NIST')
    } catch (err) {
      console.error('[testQueue] NIST path resolution error:', err.message)
      deps.send('test-finished', {
        id: job.id,
        status: 'Failed',
        completedAt: deps.formatCompletedAt()
      })
      onDone()
      return
    }

    const valid = validateToolPath('NIST', toolPath)
    if (!valid.success) {
      console.error('[testQueue] NIST invalid path:', toolPath)
      deps.send('test-finished', {
        id: job.id,
        status: 'Failed',
        completedAt: deps.formatCompletedAt()
      })
      onDone()
      return
    }

    const args = ['-fast', '-fileoutput', '1000000', job.filePath]
    console.log('[testQueue] NIST STS command:', toolPath, args.join(' '))
    result = runCrossPlatform(toolPath, args, { cwd: stsDir })
  }

  if (!result.success) {
    console.error('[testQueue] NIST spawn error:', result.message || result.code)
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
    deps.send('test-finished', {
      id: job.id,
      status: 'Failed',
      completedAt: deps.formatCompletedAt()
    })
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
        deps.setParsedResult(job.id, analysis)
        if (analysis.failed) {
          status = 'Failed'
          console.log('[testQueue] NIST STS analysis:', analysis.reason)
        }
      } catch (err) {
        console.warn('[testQueue] NIST STS report read failed:', err.message)
      }
    }
    deps.updateStatus(job.id, status)
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
