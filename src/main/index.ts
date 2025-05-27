/* eslint-disable prettier/prettier */
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcess, fork } from 'child_process'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import http from 'http'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

let serverProcess: ChildProcess | null = null

let mainWindow: BrowserWindow | null = null

let settingsWindow: BrowserWindow | null = null

function waitForServerReady(url: string, timeout = 50000, interval = 500): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()

    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            console.log('✅ Serveur est prêt')
            resolve()
          } else {
            retry()
          }
        })
        .on('error', retry)
    }

    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error('⛔ Timeout : serveur non prêt'))
      } else {
        setTimeout(check, interval)
      }
    }

    check()
  })
}

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = is.dev
      ? join(__dirname, '../src/server/index.js')
      : join(__dirname, '../src/server/index.js') // en prod aussi dans /src/server compilé

    serverProcess = fork(serverPath, {
      env: { NODE_ENV: is.dev ? 'development' : 'production' },
      stdio: 'inherit'
    })

    serverProcess.on('error', (err) => {
      console.error('Erreur serveur:', err)
      reject(err)
    })

    serverProcess.on('exit', (code) => {
      console.log('Serveur arrêté avec code:', code)
    })

    // attendre un peu pour que le serveur écoute réellement
    waitForServerReady('http://localhost:3001').then(resolve).catch(reject)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: 'novaa',
    width: 700,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    transparent: true,
    resizable: true,
    frame: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })

  function createSettingsWindow(): void {
    settingsWindow = new BrowserWindow({
      title: 'Settings - novaa',
      width: 700,
      height: 500,
      show: false,
      autoHideMenuBar: true,
      transparent: true,
      resizable: true,
      frame: false,

      modal: true, // Make it modal
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        webviewTag: true
      }
    })

    settingsWindow.on('ready-to-show', () => {
      settingsWindow!.show()
    })

    // This is the key change - we need to explicitly route to /settings
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      // For HashRouter, the path should be part of the hash
      settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/settings`)
    } else {
      settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'settings' // This correctly tells HashRouter to look for the #settings route
      })
    }

    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  }

  // Add this near your other IPC handlers
  ipcMain.on('open-settings-window', () => {
    if (settingsWindow === null) {
      createSettingsWindow()
    } else {
      settingsWindow.focus()
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Clear mainWindow when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('minimize-window', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.minimize()
    }
  })

  ipcMain.on('maximize-window', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  ipcMain.on('close-window', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.close()
    }
  })

  try {
    await startServer() // attendre le serveur
    createWindow() // ensuite afficher la fenêtre
  } catch (err) {
    console.error('Impossible de démarrer le serveur :', err)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
