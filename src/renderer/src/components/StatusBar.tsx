import { useMemo } from 'react'
import { useEditorContext } from '../hooks/EditorContext'
import { countWords } from '../utils/wordCount'
import { useI18n } from '../i18n'

interface StatusBarProps {
  currentFilePath: string | null
}

export default function StatusBar({ currentFilePath }: StatusBarProps) {
  const { editorState } = useEditorContext()
  const { t } = useI18n()

  const { words, chars } = useMemo(() => {
    if (!editorState) return { words: 0, chars: 0 }
    return countWords(editorState.doc)
  }, [editorState])

  const { line, col } = useMemo(() => {
    if (!editorState) return { line: 1, col: 1 }
    const { $head } = editorState.selection
    const line = $head.index(0) + 1
    const col = $head.parent.content.size > 0 ? $head.parentOffset + 1 : 1
    return { line, col }
  }, [editorState])

  const fileName = currentFilePath
    ? currentFilePath.split(/[/\\]/).pop()
    : t('status.untitled')

  return (
    <div className="statusbar">
      <span className="statusbar-item">{fileName}</span>
      <span className="statusbar-separator">|</span>
      <span className="statusbar-item">{t('status.markdown')}</span>
      <span className="statusbar-separator">|</span>
      <span className="statusbar-item">{t('status.utf8')}</span>
      <span className="statusbar-spacer" />
      <span className="statusbar-item">
        {t('status.words', { count: words })}, {t('status.chars', { count: chars })}
      </span>
      <span className="statusbar-separator">|</span>
      <span className="statusbar-item">
        {t('status.lineCol', { line, col })}
      </span>
    </div>
  )
}
