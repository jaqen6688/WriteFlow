import type { Tab } from '../hooks/useTabManager'
import { useI18n } from '../i18n'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onSwitch: (id: string) => void
  onClose: (id: string) => void
  onNewTab: () => void
}

export default function TabBar({ tabs, activeTabId, onSwitch, onClose, onNewTab }: TabBarProps) {
  const { t } = useI18n()

  return (
    <div className="tabbar">
      <div className="tabbar-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tabbar-tab${tab.id === activeTabId ? ' active' : ''}`}
            onClick={() => onSwitch(tab.id)}
          >
            <span className="tabbar-title">
              {tab.isDirty && <span className="tabbar-dot" />}
              {tab.title}
            </span>
            <button
              className="tabbar-close"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
              title={t('tab.close')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button className="tabbar-new" onClick={onNewTab} title={t('tab.newTab')}>
        +
      </button>
    </div>
  )
}
