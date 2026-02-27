import { execFile } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { getRngTestsDir } from './testQueue/paths.js'

const execFileAsync = promisify(execFile)

/** Packages that provide libtestu01, by distro (ID from /etc/os-release) */
const LIBTESTU01_PACKAGES = {
  debian: 'libtestu01-0',
  ubuntu: 'libtestu01-0',
  linuxmint: 'libtestu01-0',
  pop: 'libtestu01-0',
  fedora: 'libtestu01',
  rhel: 'libtestu01',
  opensuse: 'libtestu01',
  'opensuse-tumbleweed': 'libtestu01',
  arch: 'libtestu01' // AUR or community; may not exist
}

/** Packages that provide dieharder, by distro */
const DIEHARDER_PACKAGES = {
  debian: 'dieharder',
  ubuntu: 'dieharder',
  linuxmint: 'dieharder',
  pop: 'dieharder',
  fedora: 'dieharder',
  rhel: 'dieharder',
  opensuse: 'dieharder',
  'opensuse-tumbleweed': 'dieharder',
  arch: 'dieharder'
}

/**
 * Run ldd on a binary and return true if libtestu01 is missing (not found).
 * @param {string} binaryPath
 * @returns {Promise<boolean>} true if libtestu01 is missing
 */
async function isLibtestu01Missing(binaryPath) {
  try {
    const { stdout } = await execFileAsync('ldd', [binaryPath], { encoding: 'utf8' })
    const lines = stdout.split('\n')
    for (const line of lines) {
      if (line.includes('libtestu01') && line.includes('not found')) return true
    }
    return false
  } catch (err) {
    console.warn('[ensureDeps] ldd failed:', err.message)
    return false
  }
}

/**
 * Detect Linux distro from /etc/os-release (ID=).
 * @returns {string | null}
 */
function getDistroId() {
  try {
    const raw = readFileSync('/etc/os-release', 'utf8')
    const m = raw.match(/^ID=([^\s]+)/m)
    return m ? m[1].replace(/^["']|["']$/g, '') : null
  } catch {
    return null
  }
}

/**
 * Install package using pkexec + apt/dnf/zypper. Resolves when install finishes (or fails).
 * @param {string} pkg
 * @param {string} distroId
 * @returns {Promise<boolean>} true if install succeeded
 */
async function installPackage(pkg, distroId) {
  let cmd
  let args
  if (['debian', 'ubuntu', 'linuxmint', 'pop'].includes(distroId)) {
    cmd = 'apt-get'
    args = ['install', '-y', pkg]
  } else if (['fedora', 'rhel'].includes(distroId)) {
    cmd = 'dnf'
    args = ['install', '-y', pkg]
  } else if (['opensuse', 'opensuse-tumbleweed'].includes(distroId)) {
    cmd = 'zypper'
    args = ['install', '-y', pkg]
  } else {
    console.warn('[ensureDeps] Unknown distro:', distroId, '- cannot auto-install')
    return false
  }
  try {
    await execFileAsync('pkexec', [cmd, ...args], { encoding: 'utf8', timeout: 120000 })
    return true
  } catch (err) {
    console.warn('[ensureDeps] Install failed:', err.message)
    return false
  }
}

/**
 * Check if dieharder is in PATH.
 * @returns {Promise<boolean>} true if dieharder is missing
 */
async function isDieharderMissing() {
  try {
    await execFileAsync('which', ['dieharder'], { encoding: 'utf8' })
    return false
  } catch {
    return true
  }
}

/**
 * Ensure libtestu01 and dieharder are available. On Linux, if missing,
 * attempts to install via the system package manager (pkexec + apt/dnf/zypper).
 * Non-Linux or if binary missing: no-op. Resolves when check/install is done.
 * @returns {Promise<void>}
 */
export async function ensureRngDeps() {
  if (process.platform !== 'linux') return

  const distroId = getDistroId()

  // Ensure libtestu01 (for crushing tests)
  const rngDir = getRngTestsDir()
  const crushPath = join(rngDir, 'crushing', 'crush')
  if (existsSync(crushPath)) {
    const missingLib = await isLibtestu01Missing(crushPath)
    if (missingLib && distroId) {
      const pkg = LIBTESTU01_PACKAGES[distroId]
      if (pkg) {
        console.log('[ensureDeps] libtestu01 missing; attempting to install', pkg)
        await installPackage(pkg, distroId)
      } else {
        console.warn(
          '[ensureDeps] libtestu01 missing; unknown distro. Install manually (e.g. sudo apt install libtestu01-0-dev).'
        )
      }
    }
  }

  // Ensure dieharder (for Die Harder test)
  const missingDieharder = await isDieharderMissing()
  if (missingDieharder && distroId) {
    const pkg = DIEHARDER_PACKAGES[distroId]
    if (pkg) {
      console.log('[ensureDeps] dieharder missing; attempting to install', pkg)
      await installPackage(pkg, distroId)
    } else {
      console.warn(
        '[ensureDeps] dieharder missing; unknown distro. Install manually (e.g. sudo apt install dieharder).'
      )
    }
  }
}
