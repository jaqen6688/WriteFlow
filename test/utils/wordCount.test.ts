import { describe, it, expect } from 'vitest'
import { countWords } from '../../src/renderer/src/utils/wordCount'
import { writeflowSchema } from '../../src/renderer/src/editor/schema'

function makeDoc(texts: string[]) {
  const { doc, paragraph } = writeflowSchema.nodes
  const blocks = texts.map((t) => paragraph.create(null, writeflowSchema.text(t)))
  return doc.create(null, blocks)
}

describe('countWords', () => {
  it('counts English words', () => {
    const doc = makeDoc(['hello world'])
    const result = countWords(doc)
    expect(result.words).toBe(2)
  })

  it('counts Chinese characters individually', () => {
    const doc = makeDoc(['你好世界'])
    const result = countWords(doc)
    expect(result.words).toBe(4)
  })

  it('counts mixed Chinese and English', () => {
    const doc = makeDoc(['Hello 你好 World 世界'])
    const result = countWords(doc)
    expect(result.words).toBe(6)
  })

  it('counts characters excluding whitespace', () => {
    const doc = makeDoc(['hello world'])
    const result = countWords(doc)
    expect(result.chars).toBe(10)
  })

  it('returns zero for empty document', () => {
    const { doc, paragraph } = writeflowSchema.nodes
    const emptyDoc = doc.create(null, paragraph.create())
    const result = countWords(emptyDoc)
    expect(result.words).toBe(0)
    expect(result.chars).toBe(0)
  })
})
