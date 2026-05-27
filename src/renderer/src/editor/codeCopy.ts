export const copyIcon = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M3 11V3a1.5 1.5 0 011.5-1.5H11"/></svg>`

export const checkIcon = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5l3 3 6-6"/></svg>`

const codeCopyLabels: Record<string, { copy: string; copied: string }> = {
  'zh-CN': { copy: '复制', copied: '已复制' },
  'en': { copy: 'Copy', copied: 'Copied' },
  'zh-TW': { copy: '複製', copied: '已複製' }
}

export function getCodeCopyLabels() {
  const locale = localStorage.getItem('writeflow-locale') || 'en'
  return codeCopyLabels[locale] || codeCopyLabels['en']
}
