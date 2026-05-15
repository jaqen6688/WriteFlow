import { keymap } from 'prosemirror-keymap'
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list'
import { writeflowSchema } from './schema'
import { undo, redo } from 'prosemirror-history'
import { EditorState, Transaction, Plugin, PluginKey } from 'prosemirror-state'
import { serializeDoc } from './markdown'

const schema = writeflowSchema

const linkPrompts: Record<string, string> = {
  'zh-CN': '请输入链接地址：',
  'en': 'Enter URL:',
  'zh-TW': '請輸入連結地址：'
}

function getLinkPrompt(): string {
  const locale = localStorage.getItem('writeflow-locale') || 'en'
  return linkPrompts[locale] || linkPrompts['en']
}

export function insertLink(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  const { from, to, empty } = state.selection
  const url = prompt(getLinkPrompt())
  if (!url) return false
  if (dispatch) {
    const tr = state.tr
    if (empty) {
      const mark = schema.marks.link.create({ href: url })
      tr.insertText(url, from, to)
      tr.addMark(from, from + url.length, mark)
    } else {
      tr.addMark(from, to, schema.marks.link.create({ href: url }))
    }
    dispatch(tr)
  }
  return true
}

function insertCodeBlock(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const node = schema.nodes.code_block.create()
    const { $from } = state.selection
    const pos = $from.after($from.depth)
    const tr = state.tr.insert(pos, node)
    tr.setSelection((tr.selection as typeof state.selection).constructor.near(tr.doc.resolve(pos + 1)))
    dispatch(tr)
  }
  return true
}

function insertHorizontalRule(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const { $from } = state.selection
    const pos = $from.after($from.depth)
    const tr = state.tr.insert(pos, schema.nodes.paragraph.create())
    tr.insert(pos, schema.nodes.horizontal_rule.create())
    tr.setSelection((tr.selection as typeof state.selection).constructor.near(tr.doc.resolve(pos + 2)))
    dispatch(tr)
  }
  return true
}

/*
 * 快捷键设计原则：
 * - Ctrl + 字母 = 行内格式（B 加粗、I 斜体、K 链接）
 * - Ctrl + Shift + 字母 = 块级元素（Q 引用、C 代码块、R 分割线）
 * - Ctrl + Shift + 数字 = 标题级别（0=正文）
 * - Ctrl + 数字 = 有序/无序列表（8=无序、9=有序，与 Typora 一致）
 *
 * 字母助记：B=Bold, I=Italic, K=linK, Q=Quote, C=Code, R=Rule/Row
 */
// 在文档末尾的封闭块（代码块、引用等）中按 Enter，跳出并在后面插入空段落
function exitTrailingBlock(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  const { $from, to } = state.selection
  if (!$from.parent.type.spec.isolating && $from.parent.type.name !== 'code_block') return false
  // 只在光标处于块末尾且该块是文档最后一个子节点时生效
  if (to !== $from.end()) return false
  const docEnd = state.doc.content.size
  const blockEnd = $from.after($from.depth)
  if (blockEnd < docEnd) return false
  if (dispatch) {
    const para = schema.nodes.paragraph.create()
    const tr = state.tr.insert(blockEnd, para)
    tr.setSelection((tr.selection as typeof state.selection).constructor.near(tr.doc.resolve(blockEnd + 1)))
    dispatch(tr)
  }
  return true
}

export const writeflowKeymap = keymap({
  // 行内格式
  'Mod-b': toggleMark(schema.marks.strong),
  'Mod-i': toggleMark(schema.marks.em),
  'Mod-d': toggleMark(schema.marks.strikethrough),
  'Mod-e': toggleMark(schema.marks.code),
  'Mod-k': insertLink,

  // 块级元素
  'Mod-Shift-q': wrapIn(schema.nodes.blockquote),
  'Mod-Shift-c': insertCodeBlock,
  'Mod-Shift-r': insertHorizontalRule,
  'Mod-Shift-8': wrapInList(schema.nodes.bullet_list),
  'Mod-Shift-9': wrapInList(schema.nodes.ordered_list),

  // 标题
  'Mod-Shift-1': setBlockType(schema.nodes.heading, { level: 1 }),
  'Mod-Shift-2': setBlockType(schema.nodes.heading, { level: 2 }),
  'Mod-Shift-3': setBlockType(schema.nodes.heading, { level: 3 }),
  'Mod-Shift-4': setBlockType(schema.nodes.heading, { level: 4 }),
  'Mod-Shift-5': setBlockType(schema.nodes.heading, { level: 5 }),
  'Mod-Shift-6': setBlockType(schema.nodes.heading, { level: 6 }),
  'Mod-Shift-0': setBlockType(schema.nodes.paragraph),

  // 列表
  // Enter：优先跳出末尾封闭块 → 拆分列表项
  'Enter': (state: EditorState, dispatch: (tr: Transaction) => void) => {
    if (exitTrailingBlock(state, dispatch)) return true
    return splitListItem(schema.nodes.list_item)(state, dispatch)
  },
  'Mod-[': liftListItem(schema.nodes.list_item),
  'Tab': sinkListItem(schema.nodes.list_item),
  'Shift-Tab': liftListItem(schema.nodes.list_item),

  // 历史
  'Mod-z': undo,
  'Mod-Shift-z': redo,
  'Mod-y': redo
})

// 图片插入插件（需要异步打开文件对话框）
export const imagePlugin = new Plugin({
  key: new PluginKey('image'),
  props: {
    handleKeyDown(view, event) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'I') {
        event.preventDefault()
        window.api.openImage().then((result: { filePath: string } | null) => {
          if (!result || !view.hasFocus()) return
          const node = schema.nodes.image.create({ src: result.filePath })
          const tr = view.state.tr.replaceSelectionWith(node)
          view.dispatch(tr)
        })
        return true
      }
      return false
    }
  }
})

export const clipboardPlugin = new Plugin({
  key: new PluginKey('clipboard'),
  view() {
    return {
      handleKeyDown(view, event) {
        if (event.ctrlKey || event.metaKey) {
          if (event.altKey && event.key === 'c') {
            event.preventDefault()
            const { from, to, empty } = view.state.selection
            if (empty) return true
            const slice = view.state.doc.slice(from, to)
            const tempDoc = schema.nodes.doc.create(null, slice.content)
            const md = serializeDoc(tempDoc)
            navigator.clipboard.writeText(md)
            return true
          }
          if (event.altKey && event.key === 'v') {
            event.preventDefault()
            navigator.clipboard.readText().then((text) => {
              if (!text || !view.hasFocus()) return
              view.dispatch(view.state.tr.insertText(text))
            })
            return true
          }
        }
        return false
      }
    }
  }
})
