import { history } from 'prosemirror-history'
import { baseKeymap } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import { writeflowKeymap, clipboardPlugin, imagePlugin, codeCopyPlugin } from './keymap'
import { writeflowInputRules } from './inputRules'
import { wysiwygPlugin } from './wysiwygPlugin'

export function createPlugins() {
  return [
    wysiwygPlugin,
    codeCopyPlugin,
    writeflowKeymap,
    imagePlugin,
    clipboardPlugin,
    writeflowInputRules,
    keymap(baseKeymap),
    history()
  ]
}
