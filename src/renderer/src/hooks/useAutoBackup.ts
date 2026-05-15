import { useEffect, useRef, useCallback } from 'react'
import type { EditorView } from 'prosemirror-view'
import type { EditorState } from 'prosemirror-state'
import { serializeDoc } from '../editor/markdown'
import type { Tab } from './useTabManager'

interface UseAutoBackupOptions {
  editorView: React.MutableRefObject<EditorView | null>
  editorState: EditorState | null
  activeTab: Tab | undefined
}

export function useAutoBackup({ editorView, editorState, activeTab }: UseAutoBackupOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastContentRef = useRef<string>('')

  const currentFilePath = activeTab?.filePath ?? null
  const isDirty = activeTab?.isDirty ?? false

  const getBackupKey = useCallback(() => {
    if (currentFilePath) {
      const hash = currentFilePath.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
      const name = currentFilePath.split(/[/\\]/).pop()?.replace(/\.md$/, '') || 'file'
      return `${name}_${Math.abs(hash).toString(36)}`
    }
    return 'untitled'
  }, [currentFilePath])

  const doBackup = useCallback(async () => {
    if (!editorView.current || !isDirty) return
    try {
      const content = serializeDoc(editorView.current.state.doc)
      if (content === lastContentRef.current) return
      lastContentRef.current = content
      await window.api.backupSave(getBackupKey(), content)
      if (currentFilePath) {
        await window.api.backupUpdatePath(getBackupKey(), currentFilePath)
      }
    } catch {
      // 备份失败不阻塞用户
    }
  }, [editorView, isDirty, getBackupKey, currentFilePath])

  // 防抖：内容变更后 3 秒自动备份
  useEffect(() => {
    if (!isDirty || !editorState) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      doBackup()
    }, 3000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [editorState, isDirty, doBackup])

  // 清理备份（保存成功后调用）
  const clearBackup = useCallback(async () => {
    try {
      await window.api.backupRemove(getBackupKey())
    } catch {
      // 忽略清理失败
    }
  }, [getBackupKey])

  return { clearBackup }
}
