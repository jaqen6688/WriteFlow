# 贡献指南

感谢你对 WriteFlow 的关注！本指南帮助你快速上手。

## 快速开始

```bash
# 克隆你的 fork
git clone https://github.com/<your-username>/WriteFlow.git
cd WriteFlow

# 安装依赖
npm install

# 启动开发
npm run dev
```

**环境要求**：Node.js >= 18，npm >= 9

## 开发命令

- `npm run dev` — 开发模式，支持热更新
- `npm run build` — 编译 TypeScript 并打包
- `npm run build:win` — 构建 Windows 安装包
- `npm run build:mac` — 构建 macOS 安装包
- `npm run build:linux` — 构建 Linux 安装包

## 项目结构

```text
src/
├── main/          # Electron 主进程（窗口、IPC、菜单、备份）
├── preload/       # 主进程 ↔ 渲染进程桥接
└── renderer/src/  # React 应用
    ├── editor/    # ProseMirror 编辑器核心
    ├── hooks/     # React hooks
    ├── components/# UI 组件
    ├── i18n/      # 国际化（zh-CN, en, zh-TW）
    ├── styles/    # CSS 样式
    └── utils/     # 工具函数
```

## 代码规范

- **TypeScript** — `src/` 下不允许 `.js` 文件
- 遵循现有代码风格，写之前先看附近的代码怎么写的
- **UI 文本必须用 i18n** — 所有用户可见的字符串通过 `t()` 函数，不要硬编码
- 保持简单 — 不要添加没被要求的功能、抽象或错误处理

## 提交 PR

1. 先查看现有 Issue，避免重复
2. **Fork** 本仓库
3. **创建分支**：`git checkout -b feature/your-feature` 或 `fix/your-fix`
4. **提交**清晰的 commit message，说明改了什么和为什么
5. **推送**到你的 fork，向 `main` 分支提交 Pull Request

### PR 要求

- 一个 PR 只做一件事，保持改动聚焦
- PR 描述中说明改了什么、为什么改
- 修复 Bug 时引用相关 Issue 编号
- 提交前确保 `npm run build` 通过

## 提交 Issue

- **Bug 报告**：包含复现步骤、期望行为 vs 实际行为、截图或错误日志
- **功能建议**：描述使用场景和期望效果
- 提交前先搜索已有 Issue，避免重复

## 许可

提交代码即表示你同意以 [GPL-3.0 协议](LICENSE) 开源你的贡献。
