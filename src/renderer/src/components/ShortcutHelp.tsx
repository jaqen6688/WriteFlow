import { useI18n } from '../i18n'

interface ShortcutHelpProps {
  open: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  items: { label: string; keys: string[] }[]
}

export default function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  const { t } = useI18n()

  if (!open) return null

  const groups: ShortcutGroup[] = [
    {
      title: t('shortcuts.format'),
      items: [
        { label: t('toolbar.bold'), keys: ['Ctrl', 'B'] },
        { label: t('toolbar.italic'), keys: ['Ctrl', 'I'] },
        { label: t('toolbar.strikethrough'), keys: ['Ctrl', 'D'] },
        { label: t('shortcuts.inlineCode'), keys: ['Ctrl', 'E'] },
        { label: t('toolbar.link'), keys: ['Ctrl', 'K'] },
      ]
    },
    {
      title: t('shortcuts.insert'),
      items: [
        { label: t('toolbar.blockquote'), keys: ['Ctrl', 'Shift', 'Q'] },
        { label: t('toolbar.codeBlock'), keys: ['Ctrl', 'Shift', 'C'] },
        { label: t('shortcuts.horizontalRule'), keys: ['Ctrl', 'Shift', 'R'] },
        { label: t('toolbar.bulletList'), keys: ['Ctrl', 'Shift', '8'] },
        { label: t('toolbar.orderedList'), keys: ['Ctrl', 'Shift', '9'] },
      ]
    },
    {
      title: t('shortcuts.heading'),
      items: [
        { label: t('toolbar.heading', { level: 1 }), keys: ['Ctrl', 'Shift', '1'] },
        { label: t('toolbar.heading', { level: 2 }), keys: ['Ctrl', 'Shift', '2'] },
        { label: t('toolbar.heading', { level: 3 }), keys: ['Ctrl', 'Shift', '3'] },
        { label: t('shortcuts.paragraph'), keys: ['Ctrl', 'Shift', '0'] },
      ]
    },
    {
      title: t('shortcuts.clipboard'),
      items: [
        { label: t('shortcuts.copyMd'), keys: ['Ctrl', 'Alt', 'C'] },
        { label: t('shortcuts.pastePlain'), keys: ['Ctrl', 'Alt', 'V'] },
        { label: t('shortcuts.liftList'), keys: ['Ctrl', '['] },
      ]
    },
    {
      title: t('shortcuts.file'),
      items: [
        { label: t('shortcuts.newFile'), keys: ['Ctrl', 'N'] },
        { label: t('shortcuts.openFile'), keys: ['Ctrl', 'O'] },
        { label: t('shortcuts.saveFile'), keys: ['Ctrl', 'S'] },
        { label: t('shortcuts.saveAs'), keys: ['Ctrl', 'Shift', 'S'] },
      ]
    }
  ]

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog shortcut-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="shortcut-title">{t('shortcuts.title')}</h2>
        <div className="shortcut-groups">
          {groups.map((group) => (
            <div key={group.title} className="shortcut-group">
              <div className="shortcut-group-title">{group.title}</div>
              {group.items.map((item) => (
                <div key={item.label} className="shortcut-item">
                  <span className="shortcut-label">{item.label}</span>
                  <span className="shortcut-keys">
                    {item.keys.map((key, i) => (
                      <span key={i}>
                        <kbd>{key}</kbd>
                        {i < item.keys.length - 1 && <span className="shortcut-plus">+</span>}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="shortcut-footer">
          <kbd>/</kbd> {t('shortcuts.toggleHint')}
        </div>
      </div>
    </div>
  )
}
