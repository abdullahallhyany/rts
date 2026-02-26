import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

let _rngTestsDir = null

export function getRngTestsDir() {
  const projectRoot = join(__dirname, '..', '..', '..')
  const appPath = app.getAppPath()
  const candidates = [
    join(process.cwd(), 'rngTests'),
    join(appPath, 'rngTests'),
    join(appPath, 'app.asar.unpacked', 'rngTests'),
    join(projectRoot, 'rngTests')
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) {
      console.log('[testQueue] Using RNG_TESTS_DIR:', dir)
      return dir
    }
  }
  const fallback = join(process.cwd(), 'rngTests')
  console.warn('[testQueue] rngTests not found; tried:', candidates, '| using:', fallback)
  return fallback
}

export function rngTestsDir() {
  if (_rngTestsDir === null) _rngTestsDir = getRngTestsDir()
  return _rngTestsDir
}
