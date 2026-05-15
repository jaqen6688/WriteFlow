import { useCallback } from 'react'
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'
import { writeflowSchema } from '../editor/schema'
import { insertLink } from '../editor/keymap'
import { useEditorContext } from '../hooks/EditorContext'
import { useI18n } from '../i18n'

interface ToolbarButton {
  label: string
  title: string
  action: () => void
  isActive: () => boolean
}

function ToolbarGroup({ buttons }: { buttons: ToolbarButton[] }) {
  return (
    <div className="toolbar-group">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          className={`toolbar-btn${btn.isActive() ? ' active' : ''}`}
          title={btn.title}
          onMouseDown={(e) => {
            e.preventDefault()
            btn.action()
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}

export default function Toolbar() {
  const { editorView, editorState } = useEditorContext()
  const { t } = useI18n()

  const runCommand = useCallback(
    (command: (state: import('prosemirror-state').EditorState, dispatch: (tr: import('prosemirror-state').Transaction) => void) => boolean) => {
      if (!editorView.current) return
      command(editorView.current.state, (tr) => editorView.current!.dispatch(tr))
    },
    [editorView]
  )

  const hasMark = useCallback(
    (markType: typeof writeflowSchema.marks.strong) => {
      if (!editorState) return false
      const { from, $from, to, empty } = editorState.selection
      if (empty) {
        return !!markType.isInSet(editorState.storedMarks || $from.marks())
      }
      return editorState.doc.rangeHasMark(from, to, markType)
    },
    [editorState]
  )

  const isBlockType = useCallback(
    (nodeName: string) => {
      if (!editorState) return false
      const { $from } = editorState.selection
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type.name === nodeName) return true
      }
      return false
    },
    [editorState]
  )

  const headingButtons: ToolbarButton[] = [1, 2, 3].map((level) => ({
    label: `H${level}`,
    title: `${t('toolbar.heading', { level })} (Ctrl+Shift+${level})`,
    action: () => {
      const nodeType = writeflowSchema.nodes.heading
      runCommand(setBlockType(nodeType, { level }))
    },
    isActive: () => {
      if (!editorState) return false
      const { $from } = editorState.selection
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d)
        if (node.type.name === 'heading' && node.attrs.level === level) return true
      }
      return false
    }
  }))

  const textButtons: ToolbarButton[] = [
    {
      label: 'B',
      title: `${t('toolbar.bold')} (Ctrl+B)`,
      action: () => runCommand(toggleMark(writeflowSchema.marks.strong)),
      isActive: () => hasMark(writeflowSchema.marks.strong)
    },
    {
      label: 'I',
      title: `${t('toolbar.italic')} (Ctrl+I)`,
      action: () => runCommand(toggleMark(writeflowSchema.marks.em)),
      isActive: () => hasMark(writeflowSchema.marks.em)
    },
    {
      label: 'S',
      title: `${t('toolbar.strikethrough')} (Ctrl+D)`,
      action: () => runCommand(toggleMark(writeflowSchema.marks.strikethrough)),
      isActive: () => hasMark(writeflowSchema.marks.strikethrough)
    }
  ]

  const insertButtons: ToolbarButton[] = [
    {
      label: '❝',
      title: `${t('toolbar.blockquote')} (Ctrl+Shift+Q)`,
      action: () => runCommand(wrapIn(writeflowSchema.nodes.blockquote)),
      isActive: () => isBlockType('blockquote')
    },
    {
      label: '</>',
      title: `${t('toolbar.codeBlock')} (Ctrl+Shift+C)`,
      action: () => runCommand(setBlockType(writeflowSchema.nodes.code_block)),
      isActive: () => isBlockType('code_block')
    },
    {
      label: '🔗',
      title: `${t('toolbar.link')} (Ctrl+K)`,
      action: () => runCommand(insertLink),
      isActive: () => hasMark(writeflowSchema.marks.link)
    },
    {
      label: '🖼',
      title: `${t('toolbar.image')} (Ctrl+Shift+I)`,
      action: () => {
        if (!editorView.current) return
        window.api.openImage().then((result: { filePath: string } | null) => {
          if (!result || !editorView.current) return
          const src = 'local:///' + result.filePath.replace(/\\/g, '/')
          const node = writeflowSchema.nodes.image.create({ src })
          const tr = editorView.current.state.tr.replaceSelectionWith(node)
          editorView.current.dispatch(tr)
        })
      },
      isActive: () => false
    }
  ]

  const listButtons: ToolbarButton[] = [
    {
      label: '•',
      title: `${t('toolbar.bulletList')} (Ctrl+Shift+8)`,
      action: () => runCommand(wrapInList(writeflowSchema.nodes.bullet_list)),
      isActive: () => isBlockType('bullet_list')
    },
    {
      label: '1.',
      title: `${t('toolbar.orderedList')} (Ctrl+Shift+9)`,
      action: () => runCommand(wrapInList(writeflowSchema.nodes.ordered_list)),
      isActive: () => isBlockType('ordered_list')
    }
  ]

  return (
    <div className="toolbar">
      <ToolbarGroup buttons={headingButtons} />
      <div className="toolbar-divider" />
      <ToolbarGroup buttons={textButtons} />
      <div className="toolbar-divider" />
      <ToolbarGroup buttons={insertButtons} />
      <div className="toolbar-divider" />
      <ToolbarGroup buttons={listButtons} />
    </div>
  )
}
