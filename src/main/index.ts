import { app, shell, BrowserWindow, ipcMain, Menu, MenuItem, protocol } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { registerIpcHandlers } from './ipc'
import { setMenuLocale, rebuildMenu, getMenuLabels } from './menu'
import { registerBackupHandlers } from './backup'
import { stopAllWatching } from './fileWatcher'

function registerProtocols(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'local',
      privileges: {
        bypassCSP: true,
        stream: true,
        supportFetchAPI: false
      }
    }
  ])
}

registerProtocols()

let mainWindow: BrowserWindow | null = null

function findMdFileFromArgs(argv: string[]): string | null {
  for (const arg of argv) {
    if (arg.match(/\.(md|markdown|txt)$/i)) return arg
  }
  return null
}

async function openFileInRenderer(filePath: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  try {
    const content = await readFile(filePath, 'utf-8')
    mainWindow.webContents.send('open-file-path', filePath, content)
  } catch { /* ignore */ }
}

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = findMdFileFromArgs(argv)
    if (filePath && mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      openFileInRenderer(filePath)
    }
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    title: 'WriteFlow',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('close', (e) => {
    e.preventDefault()
    mainWindow!.webContents.send('menu:check-unsaved')
  })

  mainWindow.on('closed', () => {
    stopAllWatching()
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('context-menu', (_event, params) => {
    const labels = getMenuLabels()
    const items: Array<MenuItem | Electron.MenuItemConstructorOptions> = []
    if (params.editFlags.canCut) items.push({ label: labels.cut, role: 'cut' })
    if (params.editFlags.canCopy) items.push({ label: labels.copy, role: 'copy' })
    if (params.editFlags.canPaste) items.push({ label: labels.paste, role: 'paste' })
    if (items.length > 0) items.push({ type: 'separator' })
    items.push({ label: labels.selectAll, role: 'selectAll' })
    Menu.buildFromTemplate(items).popup()
  })

  const rendererUrl = process.env['ELECTRON_RENDERER_URL']
  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    const rendererPath = app.isPackaged
      ? join(process.resourcesPath, 'renderer', 'index.html')
      : join(__dirname, '../renderer/index.html')
    mainWindow.loadFile(rendererPath)
  }
}

app.whenReady().then(() => {
  protocol.handle('local', async (request) => {
    const url = new URL(request.url)
    let filePath = decodeURIComponent(url.pathname)
    if (filePath.startsWith('/') && filePath.length > 2 && filePath.charAt(2) === ':') {
      filePath = filePath.substring(1)
    }
    if (url.host) {
      filePath = url.host + ':/' + filePath
    }
    try {
      const data = await readFile(filePath)
      const ext = filePath.split('.').pop()?.toLowerCase()
      const mimeMap: Record<string, string> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
        bmp: 'image/bmp', ico: 'image/x-icon'
      }
      const mime = mimeMap[ext || ''] || 'application/octet-stream'
      return new Response(data, { headers: { 'content-type': mime } })
    } catch {
      return new Response(null, { status: 404 })
    }
  })

  registerIpcHandlers()
  registerBackupHandlers()
  rebuildMenu()

  ipcMain.on('locale:change', (_event, locale: string) => {
    setMenuLocale(locale as 'zh-CN' | 'en' | 'zh-TW')
  })

  createWindow()

  // 首次启动时，检查命令行是否有文件参数
  const filePath = findMdFileFromArgs(process.argv)
  if (filePath && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      openFileInRenderer(filePath)
    })
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
