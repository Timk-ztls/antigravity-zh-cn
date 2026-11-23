# Google Antigravity 网页版简体中文汉化包

面向 Google Antigravity 网页版（含 Remote Control 跨域主界面 `iframe`）的简体中文 Tampermonkey（篡改猴）汉化脚本，支持 GitHub 自动检查更新。

## 一键安装（支持自动更新）

> 前置条件：浏览器已安装 [Tampermonkey（篡改猴）](https://www.tampermonkey.net/) 或兼容的用户脚本管理器。

- **GitHub Raw 主安装链接（推荐）**：
  [点击安装 antigravity-zh-cn.user.js](https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.user.js)
- **jsDelivr 国内镜像安装链接（备用）**：
  [点击安装（镜像）antigravity-zh-cn.user.js](https://cdn.jsdelivr.net/gh/Timk-ztls/antigravity-zh-cn@main/antigravity-zh-cn.user.js)

> **从旧版手动粘贴脚本升级**：本脚本保留与旧版完全一致的 `@name` 与 `@namespace`（`https://antigravity.google.com/`）。直接点击上方安装链接后，Tampermonkey 会自动提示 **「升级」/「重新安装」**，直接确认即可覆盖旧版并保留设置，不会产生重复脚本。

## 自动更新机制

- 脚本头部通过 `@updateURL` 指向轻量元数据文件 [`antigravity-zh-cn.meta.js`](https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.meta.js)（仅检查 `@version` 是否递增），通过 `@downloadURL` 指向 [`antigravity-zh-cn.user.js`](https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.user.js)。
- **自动更新**：Tampermonkey 默认会按周期自动检查 `.meta.js` 的版本号并在后台或弹窗提示更新。
- **手动立即更新**：打开 Tampermonkey 管理面板 -> 选中「Google Antigravity 网页版汉化包」-> 在列表操作或顶部菜单点击 **「检查用户脚本更新」** 即可立刻拉取最新版本。

## 核心特性

- **跨域 `iframe` 完整生效**：未设置 `@noframes`，同时覆盖 `antigravity.google.com/*` 与真实渲染工作区 UI 的跨域子框架 `antigravity.static.usercontent.goog/web/*`，并通过 `postMessage` + `GM_addValueChangeListener` 实现跨框架同步。
- **防误伤护栏**：
  - 保护智能体正文（`[data-testid="planner-response-text"]`）、用户消息、代码块（`pre` / `code`）、终端（`.xterm`）、编辑器与输入框（`textarea` / `input` / `[contenteditable="true"]`）不被翻译。
  - 过滤 Material / `.google-symbols` 图标字体连字，保护用户自定义项目名称（仅翻译系统占位名）。
  - 支持多行换行与长达 800 字符的设置页及技能长描述，同时解锁原生 `<select>` / `<option>` 下拉菜单翻译。
- **高质量词库**：当前内置 **1816 条**精确 UI 词条 + **118 条**动态正则模板规则（涵盖设置页、项目设置、插件扩展市场与全部官方/伙伴插件说明、自定义扩展 Token 明细、项目右键/三点菜单、界面布局、快捷键、权限弹窗、型号配额、语音听写语种、`@` 引用、`mcp:rea:*` MCP 提示词与常见 `/` 命令及内置技能说明等）。
- **实用增强功能**：
  - 油猴菜单支持 **「切换中 / 英文界面（开关汉化）」**，基于 `WeakMap` 保存原文，关闭后无损恢复英文。
  - 支持在浮层保持打开时按下 **`Alt + Shift + C`**，跨框架无损采集尚未汉化的 UI 词条（例如本地后端或自定义技能动态返回的 `/` 命令描述）并自动复制到剪贴板。

## 维护与发布新版本

1. 编辑 `antigravity-zh-cn.user.js` 补充词条或修复规则，并递增 `@version`（例如 `1.1.2`）。
2. 运行同步与校验脚本，自动同步 `antigravity-zh-cn.meta.js` 并检查零重复 Key、零图标连字、语法与正则：
   ```bash
   node --check antigravity-zh-cn.user.js
   node scripts/verify-and-sync.mjs --sync
   ```
3. 提交并推送至 `main` 分支，GitHub Actions CI 会自动验证，已安装脚本的 Tampermonkey 客户端即可收到更新。

## License

[MIT](./LICENSE)
