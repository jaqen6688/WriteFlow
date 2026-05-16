import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { startWatching, stopWatching, notifySave } from './fileWatcher'

export function registerIpcHandlers(): void {
  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return { content, filePath }
  })

  ipcMain.handle('file:save', async (_event, { content, filePath }: { content: string; filePath: string }) => {
    try {
      await writeFile(filePath, content, 'utf-8')
      notifySave(filePath)
      return { success: true, filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('file:save-as', async (_event, { content }: { content: string }) => {
    const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, {
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: 'untitled.md'
    })
    if (result.canceled || !result.filePath) return { success: false }
    try {
      await writeFile(result.filePath, content, 'utf-8')
      notifySave(result.filePath)
      return { success: true, filePath: result.filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.on('app:close', () => {
    BrowserWindow.getFocusedWindow()?.destroy()
  })

  ipcMain.handle('image:open', async () => {
    const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return { filePath: result.filePaths[0] }
  })

  ipcMain.handle('file:watch', (_event, { filePath }: { filePath: string }) => {
    startWatching(filePath)
  })

  ipcMain.handle('file:unwatch', (_event, { filePath }: { filePath: string }) => {
    stopWatching(filePath)
  })

  ipcMain.handle('file:read', async (_event, { filePath }: { filePath: string }) => {
    try {
      const content = await readFile(filePath, 'utf-8')
      return { success: true, content }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
