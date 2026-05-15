import { createContext, useContext } from 'react'
import type { EditorView } from 'prosemirror-view'
import type { EditorState } from 'prosemirror-state'

export const EditorContext = createContext<{
  editorView: React.MutableRefObject<EditorView | null>
  editorState: EditorState | null
}>({
  editorView: { current: null },
  editorState: null
})

export function useEditorContext() {
  return useContext(EditorContext)
}
