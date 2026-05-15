import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import type { Tab } from '../hooks/useTabManager'
import Toolbar from './Toolbar'
import Sidebar from './Sidebar'
import StatusBar from './StatusBar'
import TabBar from './TabBar'
import ThemeToggle from './ThemeToggle'
import LanguageSwitcher from './LanguageSwitcher'

const SIDEBAR_MIN = 150
const SIDEBAR_MAX = 500

interface LayoutProps {
  children: ReactNode
  currentFilePath: string | null
  tabs: Tab[]
  activeTabId: string | null
  onSwitchTab: (id: string) => void
  onCloseTab: (id: string) => void
  onNewTab: () => void
}

export default function Layout({ children, currentFilePath, tabs, activeTabId, onSwitchTab, onCloseTab, onNewTab }: LayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(200)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sidebarWidth])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth.current + delta)))
    }
    const onMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div className="layout">
      <div className="layout-toolbar">
        <Toolbar />
        <div className="toolbar-actions">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
      <TabBar tabs={tabs} activeTabId={activeTabId} onSwitch={onSwitchTab} onClose={onCloseTab} onNewTab={onNewTab} />
      <div className="layout-body">
        {tabs.length > 0 && (
          <div className="sidebar-wrapper" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
            <Sidebar />
            <div className="sidebar-resizer" onMouseDown={onMouseDown} />
          </div>
        )}
        <div className="layout-editor">{children}</div>
      </div>
      <StatusBar currentFilePath={currentFilePath} />
    </div>
  )
}
