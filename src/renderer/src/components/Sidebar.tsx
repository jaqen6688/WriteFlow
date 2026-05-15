import { useMemo } from 'react'
import { TextSelection } from 'prosemirror-state'
import { useEditorContext } from '../hooks/EditorContext'
import { extractOutline, type OutlineItem } from '../utils/outline'
import { useI18n } from '../i18n'

export default function Sidebar() {
  const { editorView, editorState } = useEditorContext()
  const { t } = useI18n()

  const outline = useMemo<OutlineItem[]>(() => {
    if (!editorState) return []
    return extractOutline(editorState.doc)
  }, [editorState])

  const navigateToHeading = (pos: number) => {
    if (!editorView.current) return
    const view = editorView.current
    const resolvedPos = view.state.doc.resolve(pos)
    const selection = TextSelection.near(resolvedPos)
    const tr = view.state.tr.setSelection(selection)
    tr.scrollIntoView()
    view.dispatch(tr)
    view.focus()
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">{t('outline.title')}</div>
      <div className="sidebar-content">
        {outline.length === 0 && (
          <div className="sidebar-empty">{t('outline.empty')}</div>
        )}
        {outline.map((item, index) => (
          <div
            key={index}
            className={`sidebar-item sidebar-item-h${item.level}`}
            title={item.text}
            onClick={() => navigateToHeading(item.pos)}
          >
            {item.text || t('outline.untitled')}
          </div>
        ))}
      </div>
    </div>
  )
}
