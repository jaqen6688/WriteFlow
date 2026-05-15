import type { Node } from 'prosemirror-model'

export function countWords(doc: Node): { words: number; chars: number } {
  let text = ''
  doc.descendants((node) => {
    if (node.isText) {
      text += node.text + ' '
    }
  })

  const chars = text.replace(/\s/g, '').length

  // Count CJK characters individually, English words by whitespace split
  const cjkMatch = text.match(/[一-鿿㐀-䶿豈-﫿]/g)
  const cjkCount = cjkMatch ? cjkMatch.length : 0

  const withoutCjk = text.replace(/[一-鿿㐀-䶿豈-﫿]/g, ' ')
  const englishWords = withoutCjk
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  return { words: cjkCount + englishWords, chars }
}
