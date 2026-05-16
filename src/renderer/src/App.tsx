import { useState, useEffect, useCallback, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorContext } from './hooks/EditorContext'
import { useEditor } from './hooks/useEditor'
import { useTabManager } from './hooks/useTabManager'
import { useAutoBackup } from './hooks/useAutoBackup'
import { I18nProvider, useI18n } from './i18n'
import { parseMarkdown } from './editor/markdown'
import { createPlugins } from './editor/plugins'
import Layout from './components/Layout'
import AboutDialog from './components/AboutDialog'
import ShortcutHelp from './components/ShortcutHelp'
import FileChangedDialog from './components/FileChangedDialog'

function AppInner(): JSX.Element {
  const { containerRef, editorView, editorState, syncState, initEditor, destroyEditor } = useEditor()
  const { t } = useI18n()
  const {
    tabs,
    activeTabId,
    activeTab,
    editorViewRef,
    switchTab,
    openNewTab,
    openFileTab,
    closeTab,
    saveActiveTab,
    saveActiveTabAs,
    markDirty,
    saveCurrentState,
    reloadTab
  } = useTabManager(t, syncState)

  const { clearBackup } = useAutoBackup({ editorView, editorState, activeTab })

  const [aboutOpen, setAboutOpen] = useState(false)
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [changedFileInfo, setChangedFileInfo] = useState<{ tabId: string; filePath: string } | null>(null)
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  // 同步 editorView 到 tabManager
  useEffect(() => {
    editorViewRef.current = editorView.current
  }, [editorView.current, editorViewRef])

  // 初始化编辑器
  useEffect(() => {
    initEditor((tr) => {
      if (tr.docChanged) markDirty()
    })
    // 编辑器就绪后，加载当前 activeTab 的内容（处理右键打开文件的时序问题）
    const tab = tabsRef.current.find((t) => t.filePath)
    if (tab && editorView.current) {
      editorView.current.updateState(tab.editorState)
      syncState()
    }
    return () => {
      destroyEditor()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 打开文件
  const openFile = useCallback(async () => {
    const result = await window.api.openFile()
    if (!result) return
    openFileTab(result.filePath, result.content)
  }, [openFileTab])

  // 保存
  const handleSave = useCallback(async () => {
    const success = await saveActiveTab()
    if (success) {
      clearBackup()
    }
  }, [saveActiveTab, clearBackup])

  // 键盘快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'o') {
          e.preventDefault()
          openFile()
        } else if (e.key === 's' && !e.shiftKey) {
          e.preventDefault()
          handleSave()
        } else if (e.key === 'S' || (e.key === 's' && e.shiftKey)) {
          e.preventDefault()
          saveActiveTabAs()
        } else if (e.key === 'n') {
          e.preventDefault()
          openNewTab()
        } else if (e.key === '/') {
          e.preventDefault()
          setShortcutOpen((v) => !v)
        }
      }
    },
    [openFile, handleSave, saveActiveTabAs, openNewTab]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 监听主进程菜单事件
  useEffect(() => {
    const cleanups = [
      window.api.onMenuAction('open-file', () => openFile()),
      window.api.onMenuAction('save-file', () => handleSave()),
      window.api.onMenuAction('save-file-as', () => saveActiveTabAs()),
      window.api.onMenuAction('new-file', () => openNewTab()),
      window.api.onMenuAction('about', () => setAboutOpen(true)),
      window.api.onMenuAction('check-unsaved', () => {
        const dirtyTabs = tabsRef.current.filter((tab) => tab.isDirty)
        if (dirtyTabs.length > 0) {
          const names = dirtyTabs.map((tab) => tab.title).join(', ')
          if (!confirm(t('app.unsavedWarning', { names }))) return
        }
        window.api.closeApp()
      })
    ]
    return () => cleanups.forEach((fn) => fn())
  }, [openFile, handleSave, saveActiveTabAs, openNewTab])

  // 监听右键"打开方式"传入的文件路径
  useEffect(() => {
    window.api.onOpenFilePath((filePath, content) => {
      openFileTab(filePath, content)
    })
  }, [openFileTab])

  // 同步文件监听器与打开的标签页
  useEffect(() => {
    const watchedPaths = tabs
      .filter((tab) => tab.filePath)
      .map((tab) => tab.filePath!)

    for (const path of watchedPaths) {
      window.api.watchFile(path)
    }

    return () => {
      for (const path of watchedPaths) {
        window.api.unwatchFile(path)
      }
    }
  }, [tabs])

  // 监听外部文件修改
  useEffect(() => {
    const cleanup = window.api.onFileChanged((filePath: string) => {
      const tab = tabsRef.current.find((t) => t.filePath === filePath)
      if (tab) {
        setChangedFileInfo({ tabId: tab.id, filePath })
      }
    })
    return cleanup
  }, [])

  // 重新加载外部修改的文件
  const handleReloadFile = useCallback(async () => {
    if (!changedFileInfo) return
    const result = await window.api.readFileContent(changedFileInfo.filePath)
    if (result.success && result.content) {
      reloadTab(changedFileInfo.tabId, result.content)
    }
    setChangedFileInfo(null)
  }, [changedFileInfo, reloadTab])

  const handleDismissFileChange = useCallback(() => {
    setChangedFileInfo(null)
  }, [])

  // 窗口标题
  useEffect(() => {
    if (activeTab) {
      const dirty = activeTab.isDirty ? ' *' : ''
      const name = activeTab.filePath
        ? activeTab.filePath.split(/[/\\]/).pop()
        : t('status.untitled')
      document.title = `${name}${dirty} - ${t('app.title')}`
    } else {
      document.title = t('app.title')
    }
  }, [activeTab, t])

  // 启动时静默恢复备份
  useEffect(() => {
    if (!editorView.current) return
    silentlyRestoreBackups(editorView, { openFileTab, openNewTab, saveCurrentState })
  }, [editorView.current])

  const currentFilePath = activeTab?.filePath ?? null

  // 拖拽文件打开
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const onDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const files = e.dataTransfer?.files
      if (!files) return
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.name.match(/\.(md|markdown|txt)$/i)) continue
        const content = await file.text()
        openFileTab(file.path || file.name, content)
      }
    }
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [openFileTab])

  return (
    <>
      <EditorContext.Provider value={{ editorView, editorState }}>
        <Layout
          currentFilePath={currentFilePath}
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitchTab={switchTab}
          onCloseTab={closeTab}
          onNewTab={openNewTab}
        >
          <div
            ref={containerRef}
            id="editor-container"
            style={{ display: tabs.length > 0 ? undefined : 'none' }}
          />
          {tabs.length === 0 && (
            <div className="empty-state">{t('tab.emptyState')}</div>
          )}
        </Layout>
      </EditorContext.Provider>
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <ShortcutHelp open={shortcutOpen} onClose={() => setShortcutOpen(false)} />
      <FileChangedDialog
        open={changedFileInfo !== null}
        fileName={changedFileInfo ? (changedFileInfo.filePath.split(/[/\\]/).pop() || '') : ''}
        isDirty={changedFileInfo ? (tabs.find((t) => t.id === changedFileInfo.tabId)?.isDirty ?? false) : false}
        onReload={handleReloadFile}
        onDismiss={handleDismissFileChange}
      />
    </>
  )
}

async function silentlyRestoreBackups(
  editorView: React.MutableRefObject<import('prosemirror-view').EditorView | null>,
  tabManager: { openFileTab: (path: string, content: string) => string; openNewTab: () => string; saveCurrentState: () => void }
) {
  try {
    const backups = await window.api.backupList()
    if (backups.length === 0) return

    for (const entry of backups) {
      const result = await window.api.backupRestore(entry.key)
      if (result?.content) {
        if (entry.originalPath) {
          tabManager.openFileTab(entry.originalPath, result.content)
        } else {
          tabManager.openNewTab()
          const doc = parseMarkdown(result.content)
          const state = EditorState.create({ doc, plugins: createPlugins() })
          if (editorView.current) {
            editorView.current.updateState(state)
          }
        }
      }
    }
  } catch {
    // 忽略恢复失败
  }
}

function App(): JSX.Element {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  )
}

export default App
