import { useI18n } from '../i18n'

interface FileChangedDialogProps {
  open: boolean
  fileName: string
  isDirty: boolean
  onReload: () => void
  onDismiss: () => void
}

export default function FileChangedDialog({ open, fileName, isDirty, onReload, onDismiss }: FileChangedDialogProps) {
  const { t } = useI18n()

  if (!open) return null

  return (
    <div className="dialog-overlay" onClick={onDismiss}>
      <div className="dialog file-changed-dialog" onClick={(e) => e.stopPropagation()}>
        <p className="file-changed-message">
          {isDirty
            ? t('fileChanged.dirtyMessage', { name: fileName })
            : t('fileChanged.message', { name: fileName })}
        </p>
        <div className="file-changed-actions">
          <button className="file-changed-btn file-changed-reload" onClick={onReload}>
            {t('fileChanged.reload')}
          </button>
          <button className="file-changed-btn file-changed-keep" onClick={onDismiss}>
            {t('fileChanged.keep')}
          </button>
        </div>
      </div>
    </div>
  )
}
