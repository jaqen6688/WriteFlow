import { contextBridge, ipcRenderer } from 'electron'

const api = {
  platform: process.platform,
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content: string, filePath: string) => ipcRenderer.invoke('file:save', { content, filePath }),
  saveFileAs: (content: string) => ipcRenderer.invoke('file:save-as', { content }),
  setLocale: (locale: string) => ipcRenderer.send('locale:change', locale),
  onMenuAction: (action: string, callback: () => void) => {
    ipcRenderer.on(`menu:${action}`, callback)
    return () => ipcRenderer.removeListener(`menu:${action}`, callback)
  },
  backupSave: (key: string, content: string) => ipcRenderer.invoke('backup:save', { key, content }),
  backupRestore: (key: string) => ipcRenderer.invoke('backup:restore', { key }),
  backupList: () => ipcRenderer.invoke('backup:list'),
  backupRemove: (key: string) => ipcRenderer.invoke('backup:remove', { key }),
  backupUpdatePath: (key: string, originalPath: string) => ipcRenderer.invoke('backup:update-path', { key, originalPath }),
  closeApp: () => ipcRenderer.send('app:close'),
  openImage: () => ipcRenderer.invoke('image:open'),
  onOpenFilePath: (callback: (filePath: string, content: string) => void) => {
    ipcRenderer.on('open-file-path', (_event, filePath, content) => callback(filePath, content))
  }
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (_error) {
  // contextBridge may not be available in some environments
}
