import { app, ipcMain } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir, rm, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { createHash } from 'crypto'

interface BackupMeta {
  key: string
  originalPath: string | null
  timestamp: number
}

function getBackupDir(): string {
  return join(app.getPath('userData'), 'backups')
}

function getMetaPath(): string {
  return join(getBackupDir(), 'meta.json')
}

async function ensureBackupDir(): Promise<void> {
  const dir = getBackupDir()
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

async function readMeta(): Promise<BackupMeta[]> {
  try {
    const data = await readFile(getMetaPath(), 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeMeta(entries: BackupMeta[]): Promise<void> {
  await ensureBackupDir()
  await writeFile(getMetaPath(), JSON.stringify(entries, null, 2), 'utf-8')
}

export function keyForPath(filePath: string | null): string {
  if (!filePath) return 'untitled'
  const hash = createHash('md5').update(filePath).digest('hex').slice(0, 12)
  const name = filePath.split(/[/\\]/).pop()?.replace(/\.md$/, '') || 'file'
  return `${name}_${hash}`
}

export function registerBackupHandlers(): void {
  ipcMain.handle('backup:save', async (_event, { key, content }: { key: string; content: string }) => {
    try {
      await ensureBackupDir()
      const backupPath = join(getBackupDir(), `${key}.md`)
      await writeFile(backupPath, content, 'utf-8')

      const meta = await readMeta()
      const idx = meta.findIndex((e) => e.key === key)
      const entry: BackupMeta = { key, originalPath: null, timestamp: Date.now() }
      if (idx >= 0) {
        entry.originalPath = meta[idx].originalPath
        meta[idx] = entry
      } else {
        meta.push(entry)
      }
      await writeMeta(meta)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('backup:restore', async (_event, { key }: { key: string }) => {
    try {
      const backupPath = join(getBackupDir(), `${key}.md`)
      if (!existsSync(backupPath)) return null
      const content = await readFile(backupPath, 'utf-8')
      return { content }
    } catch {
      return null
    }
  })

  ipcMain.handle('backup:list', async () => {
    return await readMeta()
  })

  ipcMain.handle('backup:remove', async (_event, { key }: { key: string }) => {
    try {
      const backupPath = join(getBackupDir(), `${key}.md`)
      if (existsSync(backupPath)) {
        await rm(backupPath)
      }
      const meta = await readMeta()
      await writeMeta(meta.filter((e) => e.key !== key))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('backup:update-path', async (_event, { key, originalPath }: { key: string; originalPath: string }) => {
    const meta = await readMeta()
    const entry = meta.find((e) => e.key === key)
    if (entry) {
      entry.originalPath = originalPath
      await writeMeta(meta)
    }
    return { success: true }
  })
}
