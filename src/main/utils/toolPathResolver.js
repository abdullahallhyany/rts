import { existsSync } from 'fs'
import { platform } from 'os'
import { join } from 'path'
import { rngTestsDir } from '../testQueue/paths.js'
import { execSync } from 'child_process'

export function getExecutionMode() {
  const mode = String(process.env.RNG_EXECUTION_MODE || '').toLowerCase()
  if (mode === 'wsl' || mode === 'linux' || mode === 'docker') return mode
  return platform() === 'win32' ? 'wsl' : 'linux'
}

export function getDockerImage() {
  return process.env.RNG_DOCKER_IMAGE || 'rts-rng-env'
}

// Helper to determine if a command string is a simple executable name (no path separators)
function isSimpleCommand(cmd) {
  return typeof cmd === 'string' && !cmd.includes('/') && !cmd.includes('\\')
}

// On Windows/WSL try to verify that a given Linux-style path actually exists inside WSL.
function wslPathExists(wslPath) {
  if (!wslPath) return false
  try {
    // use wsl test -e, redirect stderr so execSync doesn't throw on output
    execSync(`wsl test -e "${wslPath.replace(/"/g, '\\"')}"`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

// Convert a Windows path to a WSL-style path using wslpath. Returns null on failure.
function convertWindowsPathToWsl(winPath) {
  if (!winPath) return null
  try {
    // wslpath may not be available if WSL isn't installed; guard against errors
    const quoted = winPath.replace(/"/g, '\\"')
    const result = execSync(`wsl wslpath -a -u "${quoted}"`, {
      stdio: ['ignore', 'pipe', 'ignore']
    })
    return result.toString().trim()
  } catch {
    return null
  }
}

// Build the default path for a given tool when no env var is provided.
function defaultPathFor(toolName) {
  const dir = rngTestsDir()
  switch (toolName) {
    case 'NIST':
      return join(dir, 'sts', 'nist')
    case 'PRACTRAND':
      return join(dir, 'practrand', 'RNG_test')
    case 'TESTU01_CRUSH':
      return join(dir, 'crushing', 'crush')
    case 'TESTU01_BCRUSH':
      return join(dir, 'crushing', 'Bcrush')
    case 'TESTU01_RABBIT':
      return join(dir, 'crushing', 'rabbit')
    case 'TESTU01_SCRUSH':
      return join(dir, 'crushing', 'scrush')
    case 'TESTU01_ALPHA':
      return join(dir, 'crushing', 'alpha')
    // system-installed utilities should just be executable names; they are not
    // part of the rngTests bundle.
    case 'ENT':
      return 'ent'
    case 'DIEHARDER':
      return 'dieharder'
    default:
      throw new Error(`Unknown tool name: ${toolName}`)
  }
}

/**
 * Resolve the path for a given tool taking platform and environment variables into account.
 * May throw if the tool name is unrecognized or no path can be derived.
 * @param {string} toolName
 * @returns {string} absolute or executable path appropriate for current platform
 */
export function getToolPath(toolName) {
  const plt = platform()
  let envVar
  let toolPath

  if (plt === 'linux' || plt === 'darwin') {
    envVar = process.env[`${toolName}_LINUX_PATH`]
    toolPath = envVar || defaultPathFor(toolName)
  } else if (plt === 'win32') {
    // Windows uses WSL. prefer explicit WSL path, otherwise convert default linux path
    envVar = process.env[`${toolName}_WSL_PATH`]
    if (envVar) {
      toolPath = envVar
    } else {
      const linuxDefault = defaultPathFor(toolName)
      // attempt to convert the Windows path into WSL format
      const converted = convertWindowsPathToWsl(linuxDefault)
      toolPath = converted || linuxDefault
    }
  } else {
    // other platforms treated as linux
    envVar = process.env[`${toolName}_LINUX_PATH`]
    toolPath = envVar || defaultPathFor(toolName)
  }

  if (!toolPath) {
    throw new Error(`Could not resolve path for tool ${toolName}`)
  }

  return toolPath
}

/**
 * Ensure the resolved tool path exists on the host filesystem (if applicable).
 * For Windows we can't verify inside WSL so the check is skipped.
 * @param {string} toolName
 * @param {string} toolPath
 * @returns {{success:true,path:string}|{success:false,code:string,tool:string}}
 */
export function validateToolPath(toolName, toolPath) {
  const plt = platform()
  if (!isSimpleCommand(toolPath)) {
    if (plt === 'win32') {
      if (!wslPathExists(toolPath)) {
        return { success: false, code: 'TOOL_PATH_INVALID', tool: toolName }
      }
    } else {
      if (!existsSync(toolPath)) {
        return { success: false, code: 'TOOL_PATH_INVALID', tool: toolName }
      }
    }
  }
  return { success: true, path: toolPath }
}

/**
 * Spawn a process for the given tool path and arguments.  On Windows this wraps
 * the call in a `wsl` invocation so that the path (which should be a WSL-style
 * path) is executed inside the Linux subsystem.  Returns an object containing
 * either the spawned ChildProcess or an error descriptor.
 *
 * @param {string} toolPath
 * @param {string[]} args
 * @param {object} opts  additional options passed to spawn (cwd, detached, etc.)
 * @returns {{success:true,child:import('child_process').ChildProcess}|{success:false,code:string,message:string}}
 */
export function runCrossPlatform(toolPath, args = [], opts = {}) {
  const plt = platform()
  const executionMode = getExecutionMode()
  let execPath = toolPath
  let execArgs = args

  if (executionMode === 'docker' && toolPath === 'docker') {
    execPath = 'docker'
    execArgs = args
  } else if (executionMode === 'wsl' || (executionMode === 'docker' && plt === 'win32')) {
    // 🔥 أهم سطر: نحول كل مسارات Windows داخل args
    execArgs = args.map((arg) => {
      if (typeof arg === 'string' && /^[A-Za-z]:\\/.test(arg)) {
        const converted = convertWindowsPathToWsl(arg)
        return converted || arg
      }
      return arg
    })

    execPath = 'wsl'
    execArgs = [toolPath, ...execArgs]
  } else if (executionMode === 'linux' && plt === 'win32') {
    execPath = toolPath
    execArgs = args
  }

  try {
    const child = spawn(execPath, execArgs, { shell: false, windowsHide: true, ...opts })
    return { success: true, child }
  } catch (err) {
    return { success: false, code: 'SPAWN_FAILED', message: err.message }
  }
}

// need spawn for runCrossPlatform; import at bottom to avoid circular references
import { spawn } from 'child_process'
