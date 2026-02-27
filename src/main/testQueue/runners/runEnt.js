import { join } from 'path'
import { getToolPath, validateToolPath, runCrossPlatform } from '../../utils/toolPathResolver.js'

/**
 * Parse ent stdout and extract: entropy, file bytes, Monte Carlo Pi, |serial correlation|, chi probability %.
 * @param {string} output - Full stdout from ent
 * @returns {{ entropy: number | null, fileBytes: number | null, monteCarloPi: number | null, serialCorrelationAbs: number | null, chiProbabilityPercent: number | null }}
 */
function parseEntOutput(output) {
  const entropyMatch = output.match(/Entropy = ([\d.]+) bits per byte/)
  const fileBytesMatch = output.match(/of this (\d+) byte file/)
  const monteCarloMatch = output.match(/Monte Carlo value for Pi is ([\d.]+)/)
  const serialMatch = output.match(/Serial correlation coefficient is ([-\d.]+)/)
  const chiMatch = output.match(/would exceed this value ([\d.]+) percent/)

  const entropy = entropyMatch ? Number(entropyMatch[1]) : null
  const fileBytes = fileBytesMatch ? Number(fileBytesMatch[1]) : null
  const monteCarloPi = monteCarloMatch ? Number(monteCarloMatch[1]) : null
  const serialCorrelationAbs = serialMatch ? Math.abs(Number(serialMatch[1])) : null
  const chiProbabilityPercent = chiMatch ? Number(chiMatch[1]) : null
  return { entropy, fileBytes, monteCarloPi, serialCorrelationAbs, chiProbabilityPercent }
}

const PI_REF = 3.1415926535

/**
 * Pass/fail from parsed ent output.
 * tolerance = 1.23 / sqrt(bytes / 2)
 * FAIL if: entropy < 7.9 OR chi_square_prob < 1% OR > 99% OR |serial_correlation| > 0.1 OR |pi_estimate - π| > tolerance
 * @param {{ entropy: number | null, fileBytes: number | null, monteCarloPi: number | null, serialCorrelationAbs: number | null, chiProbabilityPercent: number | null }} parsed
 * @returns {boolean} true = pass, false = fail
 */
function entPassFail(parsed) {
  const { entropy, fileBytes, monteCarloPi, serialCorrelationAbs, chiProbabilityPercent } = parsed
  if (
    entropy == null ||
    fileBytes == null ||
    monteCarloPi == null ||
    serialCorrelationAbs == null ||
    chiProbabilityPercent == null
  ) {
    return false
  }
  const tolerance = 1.23 / Math.sqrt(fileBytes / 2)
  if (entropy < 7.9) return false
  if (chiProbabilityPercent < 1 || chiProbabilityPercent > 99) return false
  if (serialCorrelationAbs > 0.1) return false
  if (Math.abs(monteCarloPi - PI_REF) > tolerance) return false
  return true
}

/**
 * Ent: rngTests/ent/ent <filepath>
 * Parses stdout and extracts entropy, fileBytes, monteCarloPi, serialCorrelationAbs, chiProbabilityPercent for your calcs.
 */
export function runEnt(job, onDone, deps) {
  const dir = deps.rngTestsDir()
  const entDir = join(dir, 'ent')

  let toolPath
  try {
    toolPath = getToolPath('ENT')
  } catch (err) {
    console.error('[testQueue] Ent path error:', err.message)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const valid = validateToolPath('ENT', toolPath)
  if (!valid.success) {
    console.error('[testQueue] Ent invalid path:', toolPath)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }

  const args = [job.filePath]
  console.log('[testQueue] Ent command:', toolPath, args.join(' '))
  const result = runCrossPlatform(toolPath, args, { cwd: entDir })
  if (!result.success) {
    console.error('[testQueue] Ent spawn error:', result.message || result.code)
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
    return
  }
  const child = result.child

  let stdoutText = ''

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
    deps.send('test-finished', { id: job.id, status: 'Failed', completedAt: deps.formatCompletedAt() })
    onDone()
  })

  child.on('close', (code, signal) => {
    console.log('[testQueue] Process closed | code:', code, '| signal:', signal)

    const { entropy, fileBytes, monteCarloPi, serialCorrelationAbs, chiProbabilityPercent } =
      parseEntOutput(stdoutText)

    // Extracted consts for your calcs
    const ENTROPY = entropy
    const FILE_BYTES = fileBytes
    const MONTE_CARLO_PI = monteCarloPi
    const SERIAL_CORRELATION_ABS = serialCorrelationAbs
    const CHI_PROBABILITY_PERCENT = chiProbabilityPercent

    if (
      ENTROPY != null ||
      FILE_BYTES != null ||
      MONTE_CARLO_PI != null ||
      SERIAL_CORRELATION_ABS != null ||
      CHI_PROBABILITY_PERCENT != null
    ) {
      console.log('[testQueue] Ent parsed:', {
        ENTROPY,
        FILE_BYTES,
        MONTE_CARLO_PI,
        SERIAL_CORRELATION_ABS,
        CHI_PROBABILITY_PERCENT
      })
    }

    const passed = entPassFail({
      entropy,
      fileBytes,
      monteCarloPi,
      serialCorrelationAbs,
      chiProbabilityPercent
    })
    const status = passed ? 'Passed' : 'Failed'
    deps.send('test-finished', { id: job.id, status, completedAt: deps.formatCompletedAt() })
    onDone()
  })
}
