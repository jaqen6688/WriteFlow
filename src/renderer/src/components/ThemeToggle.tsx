import { useState, useEffect, useCallback } from 'react'
import { useI18n } from '../i18n'

function getInitialTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('writeflow-theme')
  if (stored === 'dark' || stored === 'light') return stored
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const { t } = useI18n()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('writeflow-theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={theme === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
