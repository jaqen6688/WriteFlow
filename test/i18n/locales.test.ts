import { describe, it, expect } from 'vitest'
import en from '../../src/renderer/src/i18n/locales/en.json'
import zhCN from '../../src/renderer/src/i18n/locales/zh-CN.json'
import zhTW from '../../src/renderer/src/i18n/locales/zh-TW.json'

const locales = { en, 'zh-CN': zhCN, 'zh-TW': zhTW }

describe('i18n locale completeness', () => {
  const enKeys = Object.keys(en).sort()

  it('zh-CN has all keys from en', () => {
    const zhCNKeys = Object.keys(zhCN).sort()
    expect(zhCNKeys).toEqual(enKeys)
  })

  it('zh-TW has all keys from en', () => {
    const zhTWKeys = Object.keys(zhTW).sort()
    expect(zhTWKeys).toEqual(enKeys)
  })

  it('no empty translation values', () => {
    for (const [locale, data] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(data)) {
        expect(value, `${locale}.${key} is empty`).toBeTruthy()
      }
    }
  })
})
