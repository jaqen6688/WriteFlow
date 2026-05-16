import { watch, type FSWatcher } from 'fs'
import { BrowserWindow } from 'electron'

const watchers = new Map<string, FSWatcher>()
const saveCooldowns = new Map<string, number>()
const COOLDOWN_MS = 500

export function startWatching(filePath: string): void {
  if (watchers.has(filePath)) return

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  try {
    const watcher = watch(filePath, { persistent: false }, (eventType) => {
      if (eventType !== 'change') return

      const lastSave = saveCooldowns.get(filePath) || 0
      if (Date.now() - lastSave < COOLDOWN_MS) return

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        const win = BrowserWindow.getFocusedWindow()
        if (win && !win.isDestroyed()) {
          win.webContents.send('file:changed', { filePath })
        }
      }, 100)
    })

    watchers.set(filePath, watcher)
  } catch {
    // File may not exist yet
  }
}

export function stopWatching(filePath: string): void {
  const watcher = watchers.get(filePath)
  if (watcher) {
    watcher.close()
    watchers.delete(filePath)
  }
  saveCooldowns.delete(filePath)
}

export function notifySave(filePath: string): void {
  saveCooldowns.set(filePath, Date.now())
}

export function stopAllWatching(): void {
  for (const watcher of watchers.values()) {
    watcher.close()
  }
  watchers.clear()
  saveCooldowns.clear()
}
