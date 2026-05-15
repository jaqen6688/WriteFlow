import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import type { EditorState, Transaction } from 'prosemirror-state'

export const wysiwygKey = new PluginKey('wysiwyg')

interface WysiwygState {
  activePos: number | null
}

export const wysiwygPlugin = new Plugin({
  key: wysiwygKey,

  state: {
    init(): WysiwygState {
      return { activePos: null }
    },
    apply(tr: Transaction, prev: WysiwygState, _oldState: EditorState, newState: EditorState): WysiwygState {
      if (!tr.selectionSet && !tr.docChanged) return prev

      const { $head } = newState.selection
      // Find the top-level block node position
      const depth = $head.depth === 0 ? 1 : $head.depth
      let blockPos = $head.before(depth)

      // Walk up until we're at depth 1 (top-level block)
      for (let d = depth; d > 1; d--) {
        blockPos = $head.before(d - 1)
        if (d - 1 === 1) break
      }

      // For nested structures (list items inside lists), find the top-level parent
      const resolvedPos = newState.doc.resolve(blockPos)
      if (resolvedPos.depth > 0) {
        blockPos = resolvedPos.before(1)
      }

      if (blockPos === prev.activePos) return prev
      return { activePos: blockPos }
    }
  },

  props: {
    decorations(state: EditorState): DecorationSet {
      const { activePos } = wysiwygKey.getState(state) as WysiwygState
      if (activePos === null) return DecorationSet.empty

      const decos: Decoration[] = []

      state.doc.forEach((node, offset) => {
        if (offset === activePos) {
          decos.push(
            Decoration.node(offset, offset + node.nodeSize, { class: 'wf-source-mode' })
          )
        } else {
          decos.push(
            Decoration.node(offset, offset + node.nodeSize, { class: 'wf-render-mode' })
          )
        }
      })

      return DecorationSet.create(state.doc, decos)
    }
  }
})
