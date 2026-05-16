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
  watchFile: (filePath: string) => Promise<void>
  unwatchFile: (filePath: string) => Promise<void>
  readFileContent: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  onFileChanged: (callback: (filePath: string) => void) => () => void
}

declare global {
  interface Window {
    api: EditorAPI
  }
}
