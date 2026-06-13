# Changelog

## 0.5.3 (2026-06-13)

### Bug Fixes

- **保存文件时误报"已被外部程序修改"**：保存自己打开的文件时仍弹出"已被外部程序修改，是否重新加载？"提示。保存期间暂停该文件的监听，避开 WriteFlow 自身写入触发的事件 (`fileWatcher.ts`, `ipc.ts`)
- **关于对话框博客链接更新**：博客地址更新为 jaqen.cc (`AboutDialog.tsx`)

## 0.5.2 (2026-06-07)

### Bug Fixes

- **重复打开同一文件创建多个 tab**：快速连续打开同一文件时去重检查失败。改用 ref 保存最新 tabs 状态避免 stale closure (`useTabManager.ts`)

## 0.5.1 (2026-05-30)

### Bug Fixes

- **大纲栏点击标题不跳转**：点击左侧大纲栏标题无法滚动到对应位置。原因是 ProseMirror `scrollIntoView` 作用于非滚动容器，改为手动计算并滚动外层容器 (`Sidebar.tsx`)

## 0.5.0 (2026-05-30)

### New Features

- **代码块复制按钮**：悬停代码块右上角出现复制按钮，点击将代码复制到剪贴板，按钮短暂显示复制成功反馈
- **代码块语言标签**：悬停代码块时右上角显示语言名称（如 JAVASCRIPT），方便识别代码类型

## 0.4.1 (2026-05-18)

### Bug Fixes

- **HTML 行内标签导致打开文件崩溃**：包含 `<xxx>` 行内 HTML 标签的 Markdown 文件打开时 ProseMirror 解析失败。改进 DOM parser 容错处理 (`schema.ts`)
- **编辑器视图同步**：修复切换标签页时大纲不更新的问题

## 0.4.0 (2026-05-16)

### New Features

- **外部文件变更检测**：当文件被外部程序修改时自动提示重新加载，避免覆盖他人的更改

## 0.3.1 (2026-05-16)

### Improvements

- 新增 macOS Intel (x64) 安装包构建
- README 添加百度网盘下载链接（国内用户加速）
- 下载表格补充各平台说明（哪个文件对应哪个系统）
- GitHub 仓库设置优化（开启 Discussions、关闭 Wiki/Projects、添加 Topics）

## 0.3.0 (2026-05-14)

### New Features

- **右键"打开方式"**：注册 `.md` 和 `.markdown` 文件关联，安装后可右键用 WriteFlow 打开文件
- **单实例运行**：已打开时再次双击 .md 文件，会在已有窗口中新开标签页

## 0.2.2 (2026-05-14)

### Bug Fixes

- **关闭未保存文档后下次启动又出现**：关闭 untitled 标签页时未清除备份，导致重启后自动恢复 (`useTabManager.ts`)

## 0.2.1 (2026-05-13)

### Bug Fixes

- **打包后页面空白（工具栏/侧边栏消失）**：渲染进程中 `require()` 在生产环境不可用，改为 ES import。影响文件：`markdown.ts`、`schema.ts`
- **关于页面版本号不更新**：版本号从硬编码改为从 `package.json` 动态读取

### Improvements

- 开源准备：协议从 MIT 更换为 GPL v3
- 补全 `package.json` 仓库元数据（repository、bugs、homepage、keywords）
- 重写 CONTRIBUTING.md，补充项目结构、代码规范、PR 要求
- GitHub Issue/PR 模板更新
- README 添加 GitHub Release badge、微信二维码
- 添加测试框架（Vitest），覆盖 outline、wordCount、markdown 解析、i18n 完整性
- 添加 GitHub Actions CI（三平台构建）
- `.gitignore` 补充 `docs/superpowers/` 和 `test_selfcheck.html`

## 0.2.0 (2026-05-12)

### New Features

- **代码块语法高亮**：集成 highlight.js，支持多语言高亮，亮色/暗色双主题配色
- **数学公式**：支持 `$...$` 行内公式和 `$$...$$` 块级公式，KaTeX 渲染
- **任务列表**：支持 `- [ ]` / `- [x]` 待办事项，可点击 checkbox 切换状态
- **脚注**：支持 `[^1]` 脚注引用和定义（markdown-it-footnote）
- **Tab/Shift+Tab 列表缩进**：在列表项中用 Tab 缩进、Shift+Tab 反缩进
- **表格表头**：区分 `<th>` 和 `<td>`，表头自动加粗高亮
- **跨平台打包**：新增 macOS (dmg) 和 Linux (AppImage) 构建目标

### Bug Fixes

- **图片保存路径不可移植**：保存 md 文件时 `local://` 绝对路径自动转回相对路径
- **关闭所有文件后侧边栏未隐藏**：无标签页时自动隐藏侧边栏

### Improvements

- **保存失败提示**：保存/另存为失败时弹出提示（三语 i18n）
- 清理废弃代码（`EditorView.tsx`、`useFileIO.ts`）

## 0.1.1 (2026-05-10)

### Bug Fixes

- **打包后页面空白**：生产环境 renderer 文件被 electron-builder 移至 `extraResources`，主进程仍从 asar 内部路径加载导致找不到 HTML 文件。改用 `process.resourcesPath` 定位 (`src/main/index.ts`)
- **工具栏插入图片无法显示**：Electron 安全策略阻止 `file://` 协议加载本地图片。注册自定义 `local://` 协议绕过限制，支持中文路径 (`src/main/index.ts`)
- **Markdown 文件中相对路径图片无法显示**：`![](./images/pic.png)` 等相对路径基于 HTML 页面而非 md 文件解析。打开文件时自动根据 md 文件目录转为 `local://` 绝对路径 (`src/renderer/src/editor/markdown.ts`)
- **应用图标缺失**：`resources/icon.png` 为 1x1 像素占位文件，替换为正式图标
- **关闭所有文件后侧边栏未隐藏**：没有打开标签页时侧边栏仍显示旧大纲内容，改为无标签页时自动隐藏 (`src/renderer/src/components/Layout.tsx`)

### Other

- 禁用代码签名（`signAndEditExecutable: false`），避免 Windows 符号链接权限错误

## 0.1.0 (2026-05-09)

### Features

- WYSIWYG 所见即所得编辑（ProseMirror，类 Typora 块切换）
- 多标签页支持
- 大纲导航侧边栏
- 明暗主题切换
- 国际化（简体中文 / English / 繁体中文）
- 自动备份与静默恢复
- GFM 表格支持
- 文件管理（打开 / 保存 / 另存为 / 拖拽打开）
- 格式化工具栏、状态栏、快捷键
- 关于对话框、快捷键帮助面板
