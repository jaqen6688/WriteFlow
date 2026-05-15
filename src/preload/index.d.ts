export interface FileResult {
  content: string
  filePath: string
}

export interface SaveResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface BackupEntry {
  key: string
  originalPath: string | null
  timestamp: number
}

export interface EditorAPI {
  platform: string
  openFile: () => Promise<FileResult | null>
  saveFile: (content: string, filePath: string) => Promise<SaveResult>
  saveFileAs: (content: string) => Promise<SaveResult>
  setLocale: (locale: string) => void
  onMenuAction: (action: string, callback: () => void) => () => void
  backupSave: (key: string, content: string) => Promise<{ success: boolean }>
  backupRestore: (key: string) => Promise<{ content: string } | null>
  backupList: () => Promise<BackupEntry[]>
  backupRemove: (key: string) => Promise<{ success: boolean }>
  backupUpdatePath: (key: string, originalPath: string) => Promise<{ success: boolean }>
  onOpenFilePath: (callback: (filePath: string, content: string) => void) => void
}

declare global {
  interface Window {
    api: EditorAPI
  }
}
