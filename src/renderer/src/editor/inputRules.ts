import { inputRules, textblockTypeInputRule, wrappingInputRule, InputRule } from 'prosemirror-inputrules'
import { writeflowSchema } from './schema'

const schema = writeflowSchema

function markInputRuleForMark(
  regexp: RegExp,
  markType: any,
  getAttrs?: (match: RegExpMatchArray) => Record<string, any> | null
): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const attrs = getAttrs ? getAttrs(match) : null
    const { tr } = state
    const captured = match[1]
    const markStart = start + match[0].indexOf(captured)
    const markEnd = markStart + captured.length

    if (markStart === markEnd) return null

    const from = markStart
    const to = markEnd
    const marks = [...state.doc.resolve(from).marks]

    if (marks.some((m) => m.type === markType)) return null

    tr.addMark(from, to, markType.create(attrs))
    tr.removeStoredMark(markType)
    return tr
  })
}

export const writeflowInputRules = inputRules({
  rules: [
    // Headings: # through ######
    textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({
      level: match[1].length
    })),

    // Blockquote
    wrappingInputRule(/^>\s$/, schema.nodes.blockquote),

    // Bullet list
    wrappingInputRule(/^[-*+]\s$/, schema.nodes.bullet_list),

    // Ordered list
    wrappingInputRule(
      /^(\d+)\.\s$/,
      schema.nodes.ordered_list,
      (match) => ({ order: +match[1] }),
      (match, node) => node.childCount + node.attrs.order === +match[1]
    ),

    // Code block
    textblockTypeInputRule(/^```$/, schema.nodes.code_block),

    // Horizontal rule
    new InputRule(/^(---|___|\*\*\*)$/, (state, _match, start, end) => {
      return state.tr.replaceWith(start, end, schema.nodes.horizontal_rule.create())
    }),

    // Bold: **text**
    markInputRuleForMark(/(?:\*\*|__)([^*_]+)(?:\*\*|__)$/, schema.marks.strong),

    // Italic: *text*
    markInputRuleForMark(/(?:\*|_)([^*_]+)(?:\*|_)$/, schema.marks.em),

    // Inline code: `text`
    markInputRuleForMark(/`([^`]+)`$/, schema.marks.code),

    // Strikethrough: ~~text~~
    markInputRuleForMark(/~~([^~]+)~~$/, schema.marks.strikethrough)
  ]
})
