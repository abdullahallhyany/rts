import 'dotenv/config'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'
import { enqueue } from './testQueue/index.js'
import { ensureRngDeps } from './ensureDeps.js'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // On Linux AppImage: ensure libtestu01 (and similar) are available; try to install if missing
  await ensureRngDeps()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Run `ls` on the host OS and send the result back to the renderer
  ipcMain.on('run-ls', (event, args) => {
    const command = `ls ${args || ''}`

    exec(command, (error, stdout, stderr) => {
      if (error) {
        event.reply('ls-result', `Error: ${stderr || error.message}`)
        return
      }
      event.reply('ls-result', stdout || '(no output)')
    })
  })

  // Open file dialog; returns selected file path (no file read in JS)
  ipcMain.handle('dialog-open-file', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      title: 'Select RNG data file'
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  // Test queue: FIFO, one test at a time; when one finishes, the next starts
  ipcMain.handle('test-queue-enqueue', (event, job) => {
    enqueue(job, event.sender)
  })

  // Persist test store to disk (userData/rts-tests.json)
  const testsPath = join(app.getPath('userData'), 'rts-tests.json')
  ipcMain.handle('get-persisted-tests', () => {
    try {
      if (existsSync(testsPath)) {
        const raw = readFileSync(testsPath, 'utf8')
        const data = JSON.parse(raw)
        return Array.isArray(data) ? data : []
      }
    } catch (err) {
      console.warn('[main] Failed to read persisted tests:', err.message)
    }
    return []
  })
  ipcMain.handle('save-tests', (_event, tests) => {
    try {
      writeFileSync(testsPath, JSON.stringify(Array.isArray(tests) ? tests : [], null, 2), 'utf8')
    } catch (err) {
      console.warn('[main] Failed to save tests:', err.message)
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
