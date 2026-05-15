import { Menu, BrowserWindow } from 'electron'

type Locale = 'zh-CN' | 'en' | 'zh-TW'

const menuLabels: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    file: '文件',
    newFile: '新建',
    openFile: '打开...',
    saveFile: '保存',
    saveFileAs: '另存为...',
    quit: '退出',
    edit: '编辑',
    undo: '撤销',
    redo: '重做',
    cut: '剪切',
    copy: '复制',
    paste: '粘贴',
    selectAll: '全选',
    view: '视图',
    toggleSidebar: '切换侧边栏',
    zoomIn: '放大',
    zoomOut: '缩小',
    resetZoom: '重置缩放',
    toggleDevTools: '开发者工具',
    help: '帮助',
    about: '关于 WriteFlow'
  },
  'en': {
    file: 'File',
    newFile: 'New File',
    openFile: 'Open...',
    saveFile: 'Save',
    saveFileAs: 'Save As...',
    quit: 'Quit',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select All',
    view: 'View',
    toggleSidebar: 'Toggle Sidebar',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    toggleDevTools: 'Toggle Developer Tools',
    help: 'Help',
    about: 'About WriteFlow'
  },
  'zh-TW': {
    file: '檔案',
    newFile: '新建',
    openFile: '開啟...',
    saveFile: '儲存',
    saveFileAs: '另存為...',
    quit: '結束',
    edit: '編輯',
    undo: '復原',
    redo: '重做',
    cut: '剪下',
    copy: '複製',
    paste: '貼上',
    selectAll: '全選',
    view: '檢視',
    toggleSidebar: '切換側邊欄',
    zoomIn: '放大',
    zoomOut: '縮小',
    resetZoom: '重設縮放',
    toggleDevTools: '開發者工具',
    help: '說明',
    about: '關於 WriteFlow'
  }
}

let currentLocale: Locale = 'zh-CN'

export function getMenuLabels(): Record<string, string> {
  return menuLabels[currentLocale]
}

function getWin(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] || null
}

function send(action: string): void {
  const win = getWin()
  if (win && !win.isDestroyed()) {
    win.webContents.send(action)
  }
}

export function setMenuLocale(locale: Locale): void {
  currentLocale = locale
  rebuildMenu()
}

export function rebuildMenu(): void {
  const labels = menuLabels[currentLocale]

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: labels.file,
      submenu: [
        { label: labels.newFile, accelerator: 'CmdOrCtrl+N', click: () => send('menu:new-file') },
        { label: labels.openFile, accelerator: 'CmdOrCtrl+O', click: () => send('menu:open-file') },
        { type: 'separator' },
        { label: labels.saveFile, accelerator: 'CmdOrCtrl+S', click: () => send('menu:save-file') },
        { label: labels.saveFileAs, accelerator: 'CmdOrCtrl+Shift+S', click: () => send('menu:save-file-as') },
        { type: 'separator' },
        { label: labels.quit, role: 'quit' }
      ]
    },
    {
      label: labels.edit,
      submenu: [
        { label: labels.undo, role: 'undo' },
        { label: labels.redo, role: 'redo' },
        { type: 'separator' },
        { label: labels.cut, role: 'cut' },
        { label: labels.copy, role: 'copy' },
        { label: labels.paste, role: 'paste' },
        { label: labels.selectAll, role: 'selectAll' }
      ]
    },
    {
      label: labels.view,
      submenu: [
        { label: labels.toggleSidebar, accelerator: 'CmdOrCtrl+\\', click: () => send('menu:toggle-sidebar') },
        { type: 'separator' },
        { label: labels.zoomIn, accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: labels.zoomOut, accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: labels.resetZoom, accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: labels.toggleDevTools, role: 'toggleDevTools' }
      ]
    },
    {
      label: labels.help,
      submenu: [
        { label: labels.about, click: () => send('menu:about') }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
