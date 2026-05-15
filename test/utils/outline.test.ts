import { describe, it, expect } from 'vitest'
import { extractOutline } from '../../src/renderer/src/utils/outline'
import { writeflowSchema } from '../../src/renderer/src/editor/schema'

function makeDoc(content: string) {
  const { doc, paragraph, heading } = writeflowSchema.nodes
  const blocks: any[] = []

  for (const line of content.split('\n')) {
    const match = line.match(/^(#{1,6})\s+(.*)/)
    if (match) {
      const level = match[1].length
      blocks.push(heading.create({ level }, writeflowSchema.text(match[2])))
    } else if (line.trim()) {
      blocks.push(paragraph.create(null, writeflowSchema.text(line)))
    }
  }

  return doc.create(null, blocks)
}

describe('extractOutline', () => {
  it('returns empty array for document with no headings', () => {
    const doc = makeDoc('hello\nworld')
    expect(extractOutline(doc)).toEqual([])
  })

  it('extracts single heading', () => {
    const doc = makeDoc('# Title')
    const result = extractOutline(doc)
    expect(result).toHaveLength(1)
    expect(result[0].level).toBe(1)
    expect(result[0].text).toBe('Title')
  })

  it('extracts multiple headings with correct levels', () => {
    const doc = makeDoc('# H1\n## H2\n### H3\nhello\n## Another')
    const result = extractOutline(doc)
    expect(result).toHaveLength(4)
    expect(result[0].level).toBe(1)
    expect(result[0].text).toBe('H1')
    expect(result[1].level).toBe(2)
    expect(result[2].level).toBe(3)
    expect(result[3].text).toBe('Another')
  })

  it('records correct positions', () => {
    const doc = makeDoc('# First\n## Second')
    const result = extractOutline(doc)
    expect(result[0].pos).toBe(0)
    expect(result[1].pos).toBeGreaterThan(result[0].pos)
  })
})
