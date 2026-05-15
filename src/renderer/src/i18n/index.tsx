import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import zhCN from './locales/zh-CN.json'
import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'

export type Locale = 'zh-CN' | 'en' | 'zh-TW'

const STORAGE_KEY = 'writeflow-locale'

const messages: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN,
  'en': en,
  'zh-TW': zhTW
}

const availableLocales: Locale[] = ['zh-CN', 'en', 'zh-TW']

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && availableLocales.includes(stored as Locale)) {
    return stored as Locale
  }
  const nav = navigator.language
  if (nav.startsWith('zh-TW') || nav.startsWith('zh-HK') || nav.startsWith('zh-Hant')) return 'zh-TW'
  if (nav.startsWith('zh')) return 'zh-CN'
  return 'en'
}

type Interpolation = Record<string, string | number>

function translate(locale: Locale, key: string, params?: Interpolation): string {
  let text = messages[locale][key] || messages['en'][key] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{{${k}}}`, String(v))
    }
  }
  return text
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Interpolation) => string
  locales: Locale[]
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh-CN',
  setLocale: () => {},
  t: (key) => key,
  locales: availableLocales
})

export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}

export function I18nProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  const t = useCallback((key: string, params?: Interpolation) => {
    return translate(locale, key, params)
  }, [locale])

  const value = { locale, setLocale, t, locales: availableLocales }

  useEffect(() => {
    document.documentElement.setAttribute('lang', locale)
    window.api?.setLocale(locale)
  }, [locale])

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}
