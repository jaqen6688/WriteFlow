import { useState, useCallback, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { writeflowSchema } from '../editor/schema'
import { createPlugins } from '../editor/plugins'
import { parseMarkdown, serializeDoc } from '../editor/markdown'
import type { EditorView } from 'prosemirror-view'

export interface Tab {
  id: string
  filePath: string | null
  title: string
  editorState: EditorState
  isDirty: boolean
  scrollPosition: number
}

let nextTabId = 1

function createTabId(): string {
  return `tab-${nextTabId++}`
}

function fileNameFromPath(path: string | null, t: (key: string) => string): string {
  if (!path) return t('status.untitled')
  return path.split(/[/\\]/).pop() || t('status.untitled')
}

function createEmptyState(): EditorState {
  return EditorState.create({ schema: writeflowSchema, plugins: createPlugins() })
}

export function useTabManager(t: (key: string, params?: Record<string, string | number>) => string, onStateChange?: () => void) {
  const [tabs, setTabsState] = useState<Tab[]>([])
  const [activeTabId, _setActiveTabId] = useState<string | null>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const activeTabIdRef = useRef<string | null>(null)
  const tabsRef = useRef<Tab[]>([])
  const onStateChangeRef = useRef<(() => void) | undefined>(onStateChange)

  const setTabs = useCallback((action: Tab[] | ((prev: Tab[]) => Tab[])) => {
    setTabsState(action)
    // 同步 ref 以避免 stale closure
    const next = typeof action === 'function' ? action(tabsRef.current) : action
    tabsRef.current = next
  }, [])
  onStateChangeRef.current = onStateChange

  const setActiveTabId = useCallback((id: string | null) => {
    activeTabIdRef.current = id
    _setActiveTabId(id)
  }, [])

  const getActiveTab = useCallback((): Tab | undefined => {
    return tabs.find((t) => t.id === activeTabId)
  }, [tabs, activeTabId])

  const updateTab = useCallback((id: string, updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, ...updates } : tab)))
  }, [])

  // 保存当前编辑器状态到活跃 tab
  const saveCurrentState = useCallback(() => {
    if (!editorViewRef.current || !activeTabId) return
    const view = editorViewRef.current
    const container = view.dom.parentElement
    const scrollTop = container ? container.scrollTop : 0
    updateTab(activeTabId, {
      editorState: view.state,
      scrollPosition: scrollTop
    })
  }, [activeTabId, updateTab])

  // 切换到指定 tab
  const switchTab = useCallback(
    (id: string) => {
      if (id === activeTabId) return

      // 保存当前 tab 的状态
      saveCurrentState()

      const targetTab = tabs.find((t) => t.id === id)
      if (!targetTab || !editorViewRef.current) return

      // 加载目标 tab 的状态到编辑器
      editorViewRef.current.updateState(targetTab.editorState)
      const container = editorViewRef.current.dom.parentElement
      if (container) {
        container.scrollTop = targetTab.scrollPosition
      }

      setActiveTabId(id)
      onStateChangeRef.current?.()
    },
    [activeTabId, tabs, saveCurrentState]
  )

  // 新建空 tab
  const openNewTab = useCallback(() => {
    saveCurrentState()
    const state = createEmptyState()
    const tab: Tab = {
      id: createTabId(),
      filePath: null,
      title: t('status.untitled'),
      editorState: state,
      isDirty: false,
      scrollPosition: 0
    }
    setTabs((prev) => [...prev, tab])
    setActiveTabId(tab.id)

    if (editorViewRef.current) {
      editorViewRef.current.updateState(state)
      onStateChangeRef.current?.()
    }
    return tab.id
  }, [t, saveCurrentState])

  // 打开文件 tab（如果已打开则切换）
  const openFileTab = useCallback(
    (filePath: string, content: string) => {
      // 用 ref 检查是否已打开，避免 stale closure 导致重复创建
      const existing = tabsRef.current.find((t) => t.filePath === filePath)
      if (existing) {
        switchTab(existing.id)
        return existing.id
      }

      saveCurrentState()
      const doc = parseMarkdown(content, filePath)
      const state = EditorState.create({ doc, plugins: createPlugins() })
      const tab: Tab = {
        id: createTabId(),
        filePath,
        title: fileNameFromPath(filePath, t),
        editorState: state,
        isDirty: false,
        scrollPosition: 0
      }
      setTabs((prev) => [...prev, tab])
      setActiveTabId(tab.id)

      if (editorViewRef.current) {
        editorViewRef.current.updateState(state)
        onStateChangeRef.current?.()
      }
      return tab.id
    },
    [t, saveCurrentState, switchTab]
  )

  // 关闭 tab
  const closeTab = useCallback(
    (id: string): boolean => {
      const tab = tabs.find((t) => t.id === id)
      if (!tab) return false

      // dirty 检查
      if (tab.isDirty) {
        const msg = t('tab.closeDirty', { name: tab.title })
        if (!confirm(msg)) return false
      }

      const idx = tabs.findIndex((t) => t.id === id)
      const newTabs = tabs.filter((t) => t.id !== id)

      // 如果关闭的是活跃 tab，激活相邻 tab
      if (id === activeTabId) {
        const nextTab = newTabs[Math.min(idx, newTabs.length - 1)]
        if (nextTab && editorViewRef.current) {
          editorViewRef.current.updateState(nextTab.editorState)
          setActiveTabId(nextTab.id)
          onStateChangeRef.current?.()
        } else {
          setActiveTabId(null)
          onStateChangeRef.current?.()
        }
      }

      setTabs(newTabs)

      // 删除备份
      if (tab.filePath) {
        const hash = tab.filePath.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
        const name = tab.filePath.split(/[/\\]/).pop()?.replace(/\.md$/, '') || 'file'
        const key = `${name}_${Math.abs(hash).toString(36)}`
        window.api.backupRemove(key).catch(() => {})
      } else if (tab.isDirty) {
        window.api.backupRemove('untitled').catch(() => {})
      }

      return true
    },
    [tabs, activeTabId, t]
  )

  // 保存活跃 tab
  const saveActiveTab = useCallback(async (): Promise<boolean> => {
    const tab = getActiveTab()
    if (!tab || !editorViewRef.current) return false

    const content = serializeDoc(editorViewRef.current.state.doc, tab.filePath ?? undefined)

    if (tab.filePath) {
      const result = await window.api.saveFile(content, tab.filePath)
      if (result.success) {
        updateTab(tab.id, { isDirty: false })
        return true
      }
      alert(t('status.saveFailed'))
      return false
    }

    // 新文件 → 另存为
    const result = await window.api.saveFileAs(content)
    if (result.success && result.filePath) {
      updateTab(tab.id, {
        filePath: result.filePath,
        title: fileNameFromPath(result.filePath, t),
        isDirty: false
      })
      return true
    }
    return false
  }, [getActiveTab, updateTab, t])

  // 强制另存为（即使已有 filePath）
  const saveActiveTabAs = useCallback(async (): Promise<boolean> => {
    const tab = getActiveTab()
    if (!tab || !editorViewRef.current) return false
    const content = serializeDoc(editorViewRef.current.state.doc, tab.filePath ?? undefined)
    const result = await window.api.saveFileAs(content)
    if (result.success && result.filePath) {
      updateTab(tab.id, {
        filePath: result.filePath,
        title: fileNameFromPath(result.filePath, t),
        isDirty: false
      })
      return true
    }
    alert(t('status.saveFailed'))
    return false
  }, [getActiveTab, updateTab, t])

  // 标记活跃 tab 为 dirty（使用 ref 确保 onTransaction 回调始终能拿到最新 activeTabId）
  const markDirty = useCallback(() => {
    const id = activeTabIdRef.current
    if (id) {
      updateTab(id, { isDirty: true })
    }
  }, [updateTab])

  // 重新加载 tab 内容（外部文件修改后）
  const reloadTab = useCallback(
    (tabId: string, content: string) => {
      const tab = tabs.find((t) => t.id === tabId)
      if (!tab) return

      const doc = parseMarkdown(content, tab.filePath ?? undefined)
      const state = EditorState.create({ doc, plugins: createPlugins() })

      updateTab(tabId, {
        editorState: state,
        isDirty: false,
        scrollPosition: 0
      })

      if (tabId === activeTabId && editorViewRef.current) {
        editorViewRef.current.updateState(state)
        onStateChangeRef.current?.()
      }
    },
    [tabs, activeTabId, updateTab]
  )

  return {
    tabs,
    activeTabId,
    activeTab: getActiveTab(),
    editorViewRef,
    switchTab,
    openNewTab,
    openFileTab,
    closeTab,
    saveActiveTab,
    saveActiveTabAs,
    updateTab,
    markDirty,
    saveCurrentState,
    reloadTab
  }
}
