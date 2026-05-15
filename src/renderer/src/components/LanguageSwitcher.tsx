import { useState, useRef, useEffect } from 'react'
import { useI18n, type Locale } from '../i18n'

const localeLabels: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
  'zh-TW': '繁體中文'
}

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="language-switcher" ref={ref}>
      <button
        className="language-switcher-btn"
        onClick={() => setOpen(!open)}
        title={t('language.' + locale)}
      >
        🌐
      </button>
      {open && (
        <div className="language-dropdown">
          {(['zh-CN', 'en', 'zh-TW'] as Locale[]).map((loc) => (
            <button
              key={loc}
              className={`language-option${loc === locale ? ' active' : ''}`}
              onClick={() => {
                setLocale(loc)
                setOpen(false)
              }}
            >
              {localeLabels[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
