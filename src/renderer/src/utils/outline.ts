import type { Node } from 'prosemirror-model'

export interface OutlineItem {
  level: number
  text: string
  pos: number
}

export function extractOutline(doc: Node): OutlineItem[] {
  const items: OutlineItem[] = []

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      items.push({
        level: node.attrs.level as number,
        text: node.textContent,
        pos
      })
    }
  })

  return items
}
