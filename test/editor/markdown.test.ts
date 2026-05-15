import { describe, it, expect } from 'vitest'
import { parseMarkdown, serializeDoc } from '../../src/renderer/src/editor/markdown'

describe('parseMarkdown', () => {
  it('parses plain text paragraph', () => {
    const doc = parseMarkdown('hello world')
    expect(doc.textContent).toBe('hello world')
  })

  it('parses heading with correct level', () => {
    const doc = parseMarkdown('## Title')
    const heading = doc.firstChild!
    expect(heading.type.name).toBe('heading')
    expect(heading.attrs.level).toBe(2)
    expect(heading.textContent).toBe('Title')
  })

  it('parses inline math', () => {
    const doc = parseMarkdown('$E=mc^2$')
    const para = doc.firstChild!
    const mathNode = para.firstChild!
    expect(mathNode.type.name).toBe('math_inline')
    expect(mathNode.attrs.text).toBe('E=mc^2')
  })

  it('parses block math', () => {
    const doc = parseMarkdown('$$\nx^2 + y^2 = z^2\n$$')
    const block = doc.firstChild!
    expect(block.type.name).toBe('math_block')
    expect(block.attrs.text).toBe('x^2 + y^2 = z^2')
  })

  it('parses code block with language', () => {
    const doc = parseMarkdown('```js\nconsole.log("hi")\n```')
    const block = doc.firstChild!
    expect(block.type.name).toBe('code_block')
    expect(block.attrs.language).toBe('js')
    expect(block.textContent).toBe('console.log("hi")')
  })

  it('parses bullet list', () => {
    const doc = parseMarkdown('- one\n- two\n- three')
    const list = doc.firstChild!
    expect(list.type.name).toBe('bullet_list')
    expect(list.childCount).toBe(3)
  })

  it('converts file:/// image paths to local://', () => {
    const doc = parseMarkdown('![alt](file:///C:/Users/test/img.png)')
    const para = doc.firstChild!
    const img = para.firstChild!
    expect(img.type.name).toBe('image')
    expect(img.attrs.src).toBe('local:///C:/Users/test/img.png')
  })
})

describe('serializeDoc', () => {
  it('roundtrips plain text', () => {
    const md = 'hello world'
    const doc = parseMarkdown(md)
    const result = serializeDoc(doc)
    expect(result.trim()).toBe(md)
  })

  it('roundtrips heading', () => {
    const md = '## Title'
    const doc = parseMarkdown(md)
    const result = serializeDoc(doc)
    expect(result.trim()).toBe(md)
  })

  it('roundtrips code block', () => {
    const md = '```js\nconsole.log("hi")\n```'
    const doc = parseMarkdown(md)
    const result = serializeDoc(doc)
    expect(result.trim()).toBe(md)
  })

  it('roundtrips inline math', () => {
    const md = '$E=mc^2$'
    const doc = parseMarkdown(md)
    const result = serializeDoc(doc)
    expect(result.trim()).toBe(md)
  })

  it('converts local:/// paths back to relative when filePath provided', () => {
    const doc = parseMarkdown('![img](image.png)', 'C:/Users/test/doc.md')
    const result = serializeDoc(doc, 'C:/Users/test/doc.md')
    expect(result).toContain('![img](image.png)')
    expect(result).not.toContain('local://')
  })
})
