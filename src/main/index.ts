/* eslint-disable prettier/prettier */
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ChildProcess, fork } from 'child_process'
import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron'
import http from 'http'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

let serverProcess: ChildProcess | null = null

let mainWindow: BrowserWindow | null = null

let settingsWindow: BrowserWindow | null = null

function waitForServerReady(url: string, timeout = 60000, interval = 500): Promise<void> {
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
let currentOpenAppHotkey = 'CommandOrControl+N' // Default hotkey
const currentToggleSidebarHotkey = 'CommandOrControl+B' // New hotkey for sidebar
const currentOpenSettingsHotkey = 'CommandOrControl+K' // New hotkey for settings

function registerOpenAppHotkey() {
  // Unregister the previous hotkey if it exists
  globalShortcut.unregister(currentOpenAppHotkey)

  // Attempt to register the new hotkey
  const success = globalShortcut.register(currentOpenAppHotkey, () => {
    console.log(`Hotkey ${currentOpenAppHotkey} pressed!`)
    // Action to perform when hotkey is pressed
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide() // Or minimize, or any other toggle behavior
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    } else {
      createWindow() // If no window, create it
    }
  })

  if (!success) {
    console.error(`Failed to register hotkey: ${currentOpenAppHotkey}`)
    // Optionally, notify the user or revert to a default/previous hotkey
  } else {
    console.log(`Hotkey registered: ${currentOpenAppHotkey}`)
  }
}

function registerToggleSidebarHotkey() {
  globalShortcut.unregister(currentToggleSidebarHotkey) // Unregister previous, if any
  const success = globalShortcut.register(currentToggleSidebarHotkey, () => {
    console.log(`Hotkey ${currentToggleSidebarHotkey} pressed!`)
    if (mainWindow && mainWindow.webContents) {
      // Send an IPC message to the renderer to toggle the sidebar
      mainWindow.webContents.send('toggle-sidebar')
    }
  })
  if (!success) {
    console.error(`Failed to register hotkey: ${currentToggleSidebarHotkey}`)
  }
}

function registerOpenSettingsHotkey() {
  globalShortcut.unregister(currentOpenSettingsHotkey) // Unregister previous, if any
  const success = globalShortcut.register(currentOpenSettingsHotkey, () => {
    console.log(`Hotkey ${currentOpenSettingsHotkey} pressed!`)
    // We already have an IPC handler 'open-settings-window' that creates/focuses the settings window
    // So, we can either call the createSettingsWindow function directly if it's accessible
    // or emit the event that triggers it.
    // For simplicity, let's assume createSettingsWindow is available or we trigger the existing IPC.
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.focus()
    } else {
      // mainWindow is used as parent for modal, ensure it exists or handle appropriately
      if (mainWindow && !mainWindow.isDestroyed()) {
        // The createSettingsWindow function is defined within createWindow scope
        // We need to call the IPC event that triggers it from the renderer, or refactor createSettingsWindow
        // For now, let's use the existing IPC mechanism if possible, or call a refactored function.
        // Let's refine this part. The 'open-settings-window' IPC is usually sent from renderer.
        // We can directly call the logic if createSettingsWindow is refactored to be accessible here.
        // Or, more simply, have the settings window creation logic here.

        // Re-using the logic from createSettingsWindow or an IPC event.
        // For now, let's assume we have a function to open/focus settings.
        // This was previously handled by an ipcMain.on('open-settings-window', ...) in createWindow
        // We can call that handler's logic directly if refactored, or simply re-implement.

        // Simplified: if createSettingsWindow is accessible globally or refactored:
        // createSettingsWindow();
        // If not, we might need to send a message to the main window to then trigger the settings IPC,
        // or refactor createSettingsWindow to be callable from here.

        // Let's assume we have a function `showOrCreateSettingsWindow`
        showOrCreateSettingsWindow()
      }
    }
  })
  if (!success) {
    console.error(`Failed to register hotkey: ${currentOpenSettingsHotkey}`)
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register the initial hotkey
  registerOpenAppHotkey()
  registerToggleSidebarHotkey() // Register sidebar hotkey
  registerOpenSettingsHotkey() // Register settings hotkey

  ipcMain.on('update-hotkey', (_event, hotkeyType, newHotkey) => {
    if (hotkeyType === 'open-app') {
      console.log(`Received update for open-app hotkey: ${newHotkey}`)
      // It's good practice to validate the hotkey string format if possible
      currentOpenAppHotkey = newHotkey // This line will now work
      registerOpenAppHotkey() // Re-register with the new hotkey
      // Here you would also persist this newHotkey to your backend/settings store
      // For example, by sending another IPC message to your server process if it handles database operations
      // mainWindow?.webContents.send('hotkey-updated-ack', true);
    }
    // Add similar blocks for 'toggle-sidebar' and 'open-settings' if they become configurable
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

app.on('will-quit', () => {
  // Unregister all shortcuts when the application is about to quit.
  globalShortcut.unregisterAll()
  if (serverProcess) {
    serverProcess.kill()
  }
})

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill()
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Helper function to show or create the settings window
// This function needs to be defined at a scope accessible by registerOpenSettingsHotkey
function showOrCreateSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
  } else {
    // The createSettingsWindow function was originally nested.
    // It needs to be callable from here. For simplicity, I'm duplicating its core logic.
    // Ideally, refactor createSettingsWindow to be a top-level function or accessible.
    settingsWindow = new BrowserWindow({
      title: 'Settings - novaa',
      width: 700,
      height: 500,
      show: false,
      autoHideMenuBar: true,
      transparent: true,
      resizable: true,
      frame: false,
      // parent: mainWindow, // Optional: make it a child of the main window
      modal: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: true,
        contextIsolation: true,
        webviewTag: true // if you use webview in settings
      }
    })

    settingsWindow.on('ready-to-show', () => {
      settingsWindow!.show()
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/#/settings`)
    } else {
      settingsWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'settings' })
    }

    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  }
}
