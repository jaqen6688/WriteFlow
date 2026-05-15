export interface FileResult {
  content: string
  filePath: string
}

export interface SaveResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface OutlineItem {
  level: number
  text: string
  pos: number
}
