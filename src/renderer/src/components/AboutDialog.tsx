import { useState, useEffect } from 'react'
import { useI18n } from '../i18n'

interface AboutDialogProps {
  open: boolean
  onClose: () => void
}

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useI18n()
  const [easterEgg, setEasterEgg] = useState(false)
  const [typedIndex, setTypedIndex] = useState(0)

  const madeByText = t('about.madeBy')

  useEffect(() => {
    if (!open) {
      setTypedIndex(0)
      setEasterEgg(false)
      return
    }
    const timer = setInterval(() => {
      setTypedIndex((i) => {
        if (i >= madeByText.length) {
          clearInterval(timer)
          return i
        }
        return i + 1
      })
    }, 60)
    return () => clearInterval(timer)
  }, [open, madeByText.length])

  if (!open) return null

  const handleLogoDoubleClick = () => {
    setEasterEgg(true)
    setTimeout(() => setEasterEgg(false), 5000)
  }

  const typed = madeByText.slice(0, typedIndex)
  const heartVisible = typedIndex >= madeByText.indexOf('♥') + 1
  const typing = typedIndex < madeByText.length

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog about-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="about-logo" onDoubleClick={handleLogoDoubleClick}>W</div>
        <h1 className="about-name">WriteFlow</h1>
        <p className="about-version">{t('about.version')} {__APP_VERSION__}</p>
        <p className="about-desc">{t('about.description')}</p>
        <p className="about-features">{t('about.features')}</p>
        <div className="about-divider" />
        {easterEgg ? (
          <div className="about-easter-egg">
            <p className="about-egg-name">贾昆 Jaqen</p>
            <a
              className="about-egg-link"
              href="https://blog-a8c.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              blog-a8c.pages.dev
            </a>
            <p className="about-egg-channel">公众号/百家号：全栈生涯</p>
            <p className="about-egg-channel">小红书/视频号/抖音/B站：贾昆说AI</p>
          </div>
        ) : (
          <a
            className={`about-author ${typedIndex >= madeByText.length ? 'about-author-done' : ''}`}
            href="https://blog-a8c.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            title={t('about.visit')}
          >
            {typed.split('♥').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`about-heart ${heartVisible ? 'about-heart-beat' : ''}`}>♥</span>
                )}
              </span>
            ))}
            {typing && <span className="about-cursor">|</span>}
          </a>
        )}
      </div>
    </div>
  )
}
