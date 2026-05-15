import { MarkdownParser, MarkdownSerializer } from 'prosemirror-markdown'
import markdownIt from 'markdown-it'
import { writeflowSchema } from './schema'
import schema from 'prosemirror-markdown'
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown'
import taskLists from 'markdown-it-task-lists'
import footnote from 'markdown-it-footnote'

const md = markdownIt({ html: false, linkify: true })
  .use(taskLists)
  .use(footnote)

// 自定义数学公式插件：生成 math_inline 和 math_block token
md.inline.ruler.after('escape', 'math_inline', (state, silent) => {
  const start = state.pos
  if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false
  if (state.src.charCodeAt(start + 1) === 0x24 /* $$ */) return false
  let pos = start + 1
  while (pos < state.posMax) {
    if (state.src.charCodeAt(pos) === 0x24) {
      const token = state.push('math_inline', 'math', 0)
      token.content = state.src.slice(start + 1, pos)
      token.markup = '$'
      state.pos = pos + 1
      return true
    }
    pos++
  }
  return false
})

md.block.ruler.after('blockquote', 'math_block', (state, startLine, endLine, silent) => {
  const start = state.bMarks[startLine] + state.tShift[startLine]
  if (state.src.charCodeAt(start) !== 0x24 || state.src.charCodeAt(start + 1) !== 0x24) return false
  const end = state.src.indexOf('$$', start + 2)
  if (end === -1) return false
  if (!silent) {
    const token = state.push('math_block', 'math_block', 0)
    token.content = state.src.slice(start + 2, end).trim()
    token.map = [startLine, state.lineCount]
  }
  state.line = state.lineCount
  return true
})

export const parser = new MarkdownParser(writeflowSchema, md, {
  ...defaultMarkdownParser.tokens,
  math_inline: {
    node: 'math_inline',
    getAttrs(token) {
      return { text: token.content }
    }
  },
  math_block: {
    node: 'math_block',
    getAttrs(token) {
      return { text: token.content }
    }
  },
  footnote_ref: {
    node: 'footnote',
    getAttrs(token) {
      return { label: token.meta.id + 1 + '' }
    }
  },
  footnote_block: {
    block: 'footnote_block'
  },
  fence: {
    block: 'code_block',
    getAttrs(token) {
      return { language: token.info || '' }
    }
  },
  code_block: {
    block: 'code_block',
    getAttrs(token) {
      return { language: token.info || '' }
    }
  },
  s: {
    mark: 'strikethrough'
  },
  table: { block: 'table' },
  thead: { ignore: true },
  tbody: { ignore: true },
  tr: { block: 'table_row' },
  th: {
    block: 'table_header',
    getAttrs(token) {
      return {
        colspan: Number(token.attrGet('colspan') || 1),
        rowspan: Number(token.attrGet('rowspan') || 1)
      }
    }
  },
  td: {
    block: 'table_cell',
    getAttrs(token) {
      return {
        colspan: Number(token.attrGet('colspan') || 1),
        rowspan: Number(token.attrGet('rowspan') || 1)
      }
    }
  }
})

export function parseMarkdown(text: string, basePath?: string) {
  // 将已有 file:/// 路径统一转为 local:// 协议
  text = text.replace(/(!\[[^\]]*\]\()file:\/\/\/([^)]+)(\))/g, '$1local:///$2$3')

  if (basePath) {
    const dir = basePath.replace(/\\/g, '/').replace(/[^/]+$/, '')
    text = text.replace(/(!\[[^\]]*\]\()([^)]+)(\))/g, (match, open, src, close) => {
      const fixedSrc = src.replace(/\\/g, '/')
      if (fixedSrc.startsWith('http://') || fixedSrc.startsWith('https://') || fixedSrc.startsWith('local://') || fixedSrc.startsWith('data:')) return match
      const resolved = dir + fixedSrc
      const absPath = resolved.replace(/\/\.\//g, '/').replace(/\/[^/]+\/\.\.\//g, '/')
      return `${open}local:///${absPath.replace(/^\/+/, '')}${close}`
    })
  }
  return parser.parse(text)
}

export const serializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    math_inline(state, node) {
      state.write('$' + node.attrs.text + '$')
    },
    math_block(state, node) {
      state.write('$$\n')
      state.text(node.attrs.text, false)
      state.ensureNewLine()
      state.write('$$')
      state.closeBlock(node)
    },
    footnote(state, node) {
      state.write('[^' + node.attrs.label + ']')
    },
    code_block(state, node) {
      state.write('```' + (node.attrs.language || '') + '\n')
      state.text(node.textContent, false)
      state.ensureNewLine()
      state.write('```')
      state.closeBlock(node)
    },
    table(state, node) {
      node.forEach((row, _, i) => {
        if (i > 0) state.ensureNewLine()
        state.write('| ')
        row.forEach((cell, _, j) => {
          if (j > 0) state.write(' | ')
          state.renderInline(cell)
        })
        state.write(' |')
        if (i === 0) {
          state.ensureNewLine()
          state.write('| ')
          row.forEach((_, j) => {
            if (j > 0) state.write(' | ')
            state.write('---')
          })
          state.write(' |')
        }
      })
    },
    table_row(state, node) {
      state.renderContent(node)
    },
    table_cell(state, node) {
      state.renderInline(node)
    },
    table_header(state, node) {
      state.renderInline(node)
    },
    list_item(state, node) {
      if (node.attrs.checked !== null) {
        state.write(node.attrs.checked ? '- [x] ' : '- [ ] ')
        node.forEach((child: any, _: any, i: number) => {
          if (i > 0) state.ensureNewLine()
          state.render(child, node)
        })
      } else {
        state.renderContent(node)
      }
    }
  },
  {
    ...defaultMarkdownSerializer.marks,
    strikethrough: { open: '~~', close: '~~', mixable: true }
  }
)

export function serializeDoc(doc: import('prosemirror-model').Node, filePath?: string): string {
  let content = serializer.serialize(doc)
  // 将 local:/// 绝对路径转回相对路径（如果有文件路径）
  if (filePath) {
    const dir = filePath.replace(/\\/g, '/').replace(/[^/]+$/, '')
    content = content.replace(/(!\[[^\]]*\]\()local:\/\/\/([^)]+)(\))/g, (match, open, absSrc, close) => {
      const abs = absSrc.replace(/\\/g, '/')
      if (abs.startsWith(dir)) {
        const rel = abs.substring(dir.length)
        return `${open}${rel}${close}`
      }
      // 不在同级目录下，保留为绝对路径（去掉 local:/// 协议前缀，变成普通路径）
      return `${open}${abs}${close}`
    })
  } else {
    // 没有文件路径（未保存的新文件），去掉 local:/// 前缀
    content = content.replace(/(!\[[^\]]*\]\()local:\/\/\/([^)]+)(\))/g, '$1$2$3')
  }
  return content
}
