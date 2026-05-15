import { useRef, useState, useCallback } from 'react'
import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { writeflowSchema } from '../editor/schema'
import { createPlugins } from '../editor/plugins'

export function useEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const onTransactionRef = useRef<((tr: Transaction) => void) | undefined>(undefined)

  // 供外部在 updateState 后同步 React state（tab 切换/打开文件时不走 dispatchTransaction）
  const syncState = useCallback(() => {
    if (viewRef.current) {
      setEditorState(viewRef.current.state)
    }
  }, [])

  const initEditor = useCallback((onTransaction?: (tr: Transaction) => void) => {
    if (!containerRef.current) return
    if (viewRef.current) return

    onTransactionRef.current = onTransaction

    const state = EditorState.create({
      schema: writeflowSchema,
      plugins: createPlugins()
    })

    const view = new EditorView(containerRef.current, {
      state,
      dispatchTransaction(transaction: Transaction) {
        const newState = view.state.apply(transaction)
        view.updateState(newState)
        setEditorState(newState)
        onTransactionRef.current?.(transaction)
      }
    })

    viewRef.current = view
    setEditorState(state)
  }, [])

  const destroyEditor = useCallback(() => {
    if (viewRef.current) {
      viewRef.current.destroy()
      viewRef.current = null
    }
    setEditorState(null)
  }, [])

  return {
    containerRef,
    editorState,
    editorView: viewRef,
    syncState,
    initEditor,
    destroyEditor
  }
}
