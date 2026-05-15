## 行为准则

> 偏向谨慎而非速度，简单任务自行判断。

### 先思考再编码
- 明确陈述假设，不确定就问
- 存在多种理解时列出来，不要默默选择
- 有更简单的方法就说出来，必要时提出反对
- 不明白就停下来，指出哪里不清楚

### 简洁优先
- 不添加未被要求的功能、抽象、灵活性
- 不为不可能出现的场景写错误处理
- 能 50 行搞定的事不要写 200 行

### 精准修改
- 不"改进"相邻代码、注释或格式
- 遵循现有风格，即使你会用不同方式写
- 只删除你的改动导致的无用代码，不清理原有死代码
- 每处改动都能直接追溯到用户的请求

### 目标驱动执行
- 将任务转化为可验证的目标
- 多步骤任务先简述计划，每步标注验证方式
- 明确的成功标准可以自主循环验证，模糊的标准需要不断澄清

## 项目踩坑记录（务必遵守）

### UI 文本语言一致性
- UI 文本要么全中文，要么全英文，绝不混用
- 通用技术术语（Markdown、UTF-8、URL）可保留英文
- 代码符号（H1、B、I、S）保持不变，但 hover 提示必须跟随当前语言
- 任何新增 UI 文本必须通过 i18n `t()` 函数，禁止硬编码

### ProseMirror EditorView 生命周期
- **不要在 useEffect 依赖数组中包含会频繁变化的回调**（如依赖 `activeTabId` 的 `markDirty`），否则每次依赖变化都会销毁重建 EditorView，导致文档内容丢失
- **用 ref 保存需要持久引用的回调和状态值**：`onTransaction` 回调通过 ref 传给 `dispatchTransaction`，`activeTabId` 通过 ref 让 `markDirty` 始终读取最新值
- **EditorView 必须绑定到始终存在于 DOM 的容器**：条件渲染（`{condition ? <div ref={...}/> : <div/>}`）会导致容器被销毁重建，EditorView 失效。用 CSS 控制显隐，始终挂载容器
- **直接调用 `view.updateState()` 不会触发 `dispatchTransaction`**：tab 切换、打开文件等操作绕过了 React 状态更新链路，导致 Sidebar（大纲）等依赖 `editorState` 的组件不刷新。每次 `updateState` 后必须手动调用 `syncState` 同步 React state

### prosemirror-markdown token 注册
- **token spec key 必须使用不带 `_open`/`_close` 后缀的基础名**：`prosemirror-markdown` 内部的 `tokenHandlers` 函数会自动将 `table: { block: 'table' }` 扩展为 `table_open` 和 `table_close` 两个 handler。如果写成 `table_open: { block: 'table' }`，实际注册的是 `table_open_open`/`table_open_close`，导致 `Token type not supported` 错误
- **`markdown-it('commonmark')` 不支持 GFM 表格**：需要用默认模式 `markdownIt({ html: false })` 才能解析 `| ... |` 表格语法

### 编辑器布局自适应
- **不要硬编码编辑区域 `max-width`**：桌面编辑器应去掉 `max-width` 限制，让内容自适应填满可用空间

### 渲染进程禁止 require()
- **`src/renderer/` 下禁止使用 `require()` 加载 npm 模块**：Electron 配置了 `contextIsolation: true` + `nodeIntegration: false`，渲染进程没有 Node.js 环境
- `require()` 在 dev 模式下被 Vite 转译所以能跑，但打包后报 `ReferenceError: require is not defined`，导致整个 JS 中断、页面空白
- 一律用 ES `import` 语句引入

### 关闭标签页时必须清理备份
- 关闭标签页时，备份清理必须同时处理有 `filePath` 和无 `filePath`（untitled）两种情况
- 无文件路径的 tab 备份 key 固定为 `'untitled'`，关闭时也必须调用 `backupRemove('untitled')`
- 否则用户关闭未保存文档后，下次启动文档又会出现

### GitHub Actions Release workflow
- **构建步骤必须传入 `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`**：否则 electron-builder 报 `GitHub Personal Access Token is not set`
- **不要用 `publish: none`**：需要额外的 `electron-publisher-none` 包，直接提供 `GH_TOKEN` 即可
- **job 必须添加 `permissions: contents: write`**：否则 `softprops/action-gh-release` 报 `Resource not accessible by integration`
