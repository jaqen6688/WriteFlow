import { Schema } from 'prosemirror-model'
import hljs from 'highlight.js'
import katex from 'katex'
import { copyIcon, getCodeCopyLabels } from './codeCopy'

export const writeflowSchema = new Schema({
  nodes: {
    doc: {
      content: 'block+'
    },
    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM() {
        return ['p', 0]
      }
    },
    heading: {
      attrs: { level: { default: 1, validate: 'number' } },
      content: 'inline*',
      group: 'block',
      defining: true,
      parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({
        tag: `h${level}`,
        attrs: { level }
      })),
      toDOM(node) {
        return [`h${node.attrs.level}`, 0]
      }
    },
    blockquote: {
      content: 'block+',
      group: 'block',
      defining: true,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM() {
        return ['blockquote', 0]
      }
    },
    code_block: {
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      attrs: { language: { default: '', validate: 'string' } },
      parseDOM: [{
        tag: 'pre',
        preserveWhitespace: 'full' as const,
        getAttrs(dom: HTMLElement) {
          const code = dom.querySelector('code')
          const cls = code?.className || ''
          const match = cls.match(/language-(\S+)/)
          return { language: match ? match[1] : '' }
        }
      }],
      toDOM(node) {
        const wrapper = document.createElement('pre')
        const code = document.createElement('code')
        if (node.attrs.language) {
          code.className = `language-${node.attrs.language}`
          try {
            code.innerHTML = hljs.highlight(node.textContent, { language: node.attrs.language }).value
          } catch {
            code.textContent = node.textContent
          }
        } else {
          code.textContent = node.textContent
        }

        if (node.attrs.language) {
          const lang = document.createElement('span')
          lang.className = 'code-lang-label'
          lang.textContent = node.attrs.language
          wrapper.appendChild(lang)
        }

        const btn = document.createElement('button')
        btn.className = 'code-copy-btn'
        btn.type = 'button'
        btn.tabIndex = -1
        const labels = getCodeCopyLabels()
        btn.setAttribute('aria-label', labels.copy)
        btn.setAttribute('title', labels.copy)
        btn.innerHTML = copyIcon

        wrapper.appendChild(code)
        wrapper.appendChild(btn)
        return wrapper
      }
    },
    ordered_list: {
      content: 'list_item+',
      group: 'block',
      attrs: { order: { default: 1, validate: 'number' } },
      parseDOM: [
        {
          tag: 'ol',
          getAttrs(dom: HTMLElement) {
            return { order: dom.hasAttribute('start') ? Number(dom.getAttribute('start')) : 1 }
          }
        }
      ],
      toDOM(node) {
        return node.attrs.order === 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0]
      }
    },
    bullet_list: {
      content: 'list_item+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM() {
        return ['ul', 0]
      }
    },
    list_item: {
      content: 'paragraph block*',
      attrs: { checked: { default: null, validate: 'boolean|null' } },
      parseDOM: [{
        tag: 'li',
        getAttrs(dom: HTMLElement) {
          const checkbox = dom.querySelector('input[type="checkbox"]')
          if (!checkbox) return { checked: null }
          return { checked: checkbox.hasAttribute('checked') }
        }
      }],
      toDOM(node) {
        if (node.attrs.checked === null) return ['li', 0]
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = node.attrs.checked
        checkbox.addEventListener('click', (e) => {
          const target = e.target as HTMLInputElement
          const li = target.parentElement!
          const pos = (li as any).__pos
          if (pos !== undefined) {
            // Toggle will be handled by ProseMirror transaction
          }
        })
        checkbox.addEventListener('mousedown', (e) => e.preventDefault())
        return ['li', { 'data-type': 'task_item' }, checkbox, 0]
      },
      defining: true
    },
    math_inline: {
      inline: true,
      group: 'inline',
      attrs: { text: { default: '', validate: 'string' } },
      toDOM(node) {
        const span = document.createElement('span')
        span.className = 'math-inline'
        try {
          katex.render(node.attrs.text, span, { throwOnError: false })
        } catch {
          span.textContent = '$' + node.attrs.text + '$'
        }
        return span
      },
      parseDOM: [{
        tag: 'span.math-inline',
        getAttrs(dom: HTMLElement) {
          return { text: dom.getAttribute('data-math') || '' }
        }
      }]
    },
    math_block: {
      group: 'block',
      attrs: { text: { default: '', validate: 'string' } },
      toDOM(node) {
        const div = document.createElement('div')
        div.className = 'math-block'
        try {
          katex.render(node.attrs.text, div, { throwOnError: false, displayMode: true })
        } catch {
          div.textContent = '$$' + node.attrs.text + '$$'
        }
        return div
      },
      parseDOM: [{
        tag: 'div.math-block',
        getAttrs(dom: HTMLElement) {
          return { text: dom.getAttribute('data-math') || '' }
        }
      }]
    },
    footnote: {
      inline: true,
      group: 'inline',
      attrs: { label: { default: '', validate: 'string' } },
      toDOM(node) {
        const sup = document.createElement('sup')
        sup.className = 'footnote-ref'
        sup.textContent = node.attrs.label
        return sup
      },
      parseDOM: [{ tag: 'sup.footnote-ref' }]
    },
    footnote_block: {
      group: 'block',
      content: 'paragraph+',
      toDOM() { return ['div', { class: 'footnote-block' }, 0] },
      parseDOM: [{ tag: 'div.footnote-block' }]
    },
    image: {
      inline: true,
      attrs: {
        src: { default: '', validate: 'string' },
        alt: { default: null, validate: 'string|null' },
        title: { default: null, validate: 'string|null' }
      },
      group: 'inline',
      draggable: true,
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs(dom: HTMLElement) {
            return {
              src: dom.getAttribute('src'),
              alt: dom.getAttribute('alt'),
              title: dom.getAttribute('title')
            }
          }
        }
      ],
      toDOM(node) {
        return ['img', { src: node.attrs.src, alt: node.attrs.alt, title: node.attrs.title }]
      }
    },
    hard_break: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM() {
        return ['br']
      }
    },
    horizontal_rule: {
      group: 'block',
      parseDOM: [{ tag: 'hr' }],
      toDOM() {
        return ['hr']
      }
    },
    table: {
      content: 'table_row+',
      group: 'block',
      tableRole: 'table',
      isolating: true,
      parseDOM: [{ tag: 'table' }],
      toDOM() {
        return ['table', ['tbody', 0]]
      }
    },
    table_row: {
      content: '(table_header | table_cell)+',
      tableRole: 'row',
      parseDOM: [{ tag: 'tr' }],
      toDOM() {
        return ['tr', 0]
      }
    },
    table_header: {
      content: 'inline*',
      attrs: { colspan: { default: 1 }, rowspan: { default: 1 } },
      tableRole: 'cell',
      isolating: true,
      parseDOM: [
        {
          tag: 'th',
          getAttrs(dom: HTMLElement) {
            return {
              colspan: Number(dom.getAttribute('colspan') || 1),
              rowspan: Number(dom.getAttribute('rowspan') || 1)
            }
          }
        }
      ],
      toDOM(node) {
        return node.attrs.colspan !== 1 ? ['th', { colspan: node.attrs.colspan }, 0] : ['th', 0]
      }
    },
    table_cell: {
      content: 'inline*',
      attrs: { colspan: { default: 1 }, rowspan: { default: 1 } },
      tableRole: 'cell',
      isolating: true,
      parseDOM: [
        {
          tag: 'td',
          getAttrs(dom: HTMLElement) {
            return {
              colspan: Number(dom.getAttribute('colspan') || 1),
              rowspan: Number(dom.getAttribute('rowspan') || 1)
            }
          }
        }
      ],
      toDOM(node) {
        return ['td', node.attrs.colspan !== 1 ? { colspan: node.attrs.colspan } : {}, 0]
      }
    },
    text: {
      group: 'inline'
    }
  },
  marks: {
    em: {
      parseDOM: [
        { tag: 'i' },
        { tag: 'em' },
        { style: 'font-style=italic' },
        { style: 'font-style=normal', clearMark: true }
      ],
      toDOM() {
        return ['em', 0]
      }
    },
    strong: {
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b' },
        { style: 'font-weight=bold' },
        { style: 'font-weight', getAttrs(value: string) { return /^(bold(er)?|[5-9]\d{2})$/.test(value) && null } }
      ],
      toDOM() {
        return ['strong', 0]
      }
    },
    code: {
      parseDOM: [{ tag: 'code' }],
      toDOM() {
        return ['code', 0]
      }
    },
    link: {
      attrs: {
        href: { default: '', validate: 'string' },
        title: { default: null, validate: 'string|null' }
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs(dom: HTMLElement) {
            return { href: dom.getAttribute('href'), title: dom.getAttribute('title') }
          }
        }
      ],
      toDOM(node) {
        return ['a', { href: node.attrs.href, title: node.attrs.title, target: '_blank' }, 0]
      }
    },
    strikethrough: {
      parseDOM: [
        { tag: 's' },
        { tag: 'del' },
        { tag: 'strike' },
        { style: 'text-decoration=line-through' }
      ],
      toDOM() {
        return ['s', 0]
      }
    }
  }
})
