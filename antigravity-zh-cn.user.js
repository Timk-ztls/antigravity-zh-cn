// ==UserScript==
// @name         Google Antigravity 网页版汉化包
// @namespace    https://antigravity.google.com/
// @version      1.1.1
// @description  Google Antigravity 网页版 (含跨域主界面 iframe) 简体中文汉化，内置防误伤护栏（不翻译对话正文、代码块、终端与文件路径），支持一键中英切换、Alt+Shift+C 跨框架未汉化词条采集与 GitHub 自动更新。
// @author       Timk-ztls
// @license      MIT
// @homepageURL  https://github.com/Timk-ztls/antigravity-zh-cn
// @supportURL   https://github.com/Timk-ztls/antigravity-zh-cn/issues
// @updateURL    https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.meta.js
// @downloadURL  https://raw.githubusercontent.com/Timk-ztls/antigravity-zh-cn/main/antigravity-zh-cn.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=antigravity.google.com
// @match        https://antigravity.google.com/*
// @match        https://antigravity.google/*
// @match        https://antigravity.static.usercontent.goog/web/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_ENABLED_KEY = 'enabled';
  const IS_TOP = (function () {
    try {
      return window.self === window.top;
    } catch (_) {
      return false;
    }
  })();

  const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label'];
  const SYSTEM_PROJECT_LABELS = new Set(['No Project', 'Not in Project', 'All Workspaces']);

  // 对话正文、代码、终端、日志与文件展示容器：其内部文本与属性均不参与翻译
  const PROTECTED_CONTAINER_SELECTOR = [
    'code',
    'pre',
    'kbd',
    'samp',
    'var',
    'svg',
    'math',
    'canvas',
    'mat-icon',
    '[translate="no"]',
    '.xterm',
    '.monaco-editor',
    '.cm-editor',
    '.prism-code',
    '[data-testid="planner-response-text"]',
    '[data-testid="progress-update-response-text"]',
    '[data-testid="planner-response-debug-error"]',
    '[data-testid="user-message-content"]',
    '[data-testid="side-question-followup-user"]',
    '[data-testid="live-transcript-pane"]',
    '[data-testid="live-user-turn"]',
    '[data-testid="artifact-view"] .md-table-bleed',
    '[data-testid="artifact-pdf-view"]',
    '[data-testid="csv-file-viewer"]',
    '[data-testid="image-file-viewer"]',
    '[data-testid="sidecar-logs-content"]',
    '[data-testid="setup-script-output"]',
    '[data-testid="background-task-command"]',
    '[data-testid="terminal-surface"]',
    '[data-testid="terminal-tab-surface"]',
    '[data-testid="standalone-terminal-view"]',
    '[data-testid="bottom-terminal-panel-active-shell"]',
    '[data-testid="code-gutter"]',
    '[data-testid="code-gutter-diff"]',
    '[data-testid="file-title-name"]',
    '[data-testid="browser-url-display"]',
    '[data-testid="vcs-commit-message"]',
    '[data-testid="automation-instructions-markdown"]',
    '[data-testid="automation-instructions-text"]'
  ].join(',');

  // 文本节点额外保护：输入框、图标字体连字(.google-symbols 等)、脚本样式
  const TEXT_PROTECTED_SELECTOR = [
    PROTECTED_CONTAINER_SELECTOR,
    'script',
    'style',
    'noscript',
    'textarea',
    'input',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    '[role="textbox"]',
    '.notranslate',
    '.google-symbols',
    '.material-icons',
    '.material-symbols-outlined',
    '.material-symbols-rounded',
    '.material-symbols-sharp'
  ].join(',');

  // 图标字体元素自身属性保护（允许翻译拥有图标子节点的 button / a 属性）
  const ATTR_SELF_PROTECTED_SELECTOR = [
    'script',
    'style',
    'noscript',
    'svg',
    'mat-icon',
    '.notranslate',
    '.google-symbols',
    '.material-icons',
    '.material-symbols-outlined',
    '.material-symbols-rounded',
    '.material-symbols-sharp'
  ].join(',');

  // ==================== 精确词典（基于 Antigravity web 1.5.14 真实提取） ====================
  const EXACT_MAP = {
    // --- 外壳与顶栏 (antigravity.google.com) ---
    'Skip to main content': '跳转到主内容',
    'Download Desktop App': '下载桌面客户端',
    'Install as App': '安装为桌面应用',
    'Send feedback': '发送反馈',
    'Antigravity Remote Control': 'Antigravity 远程控制',

    // --- 侧边栏、项目与会话列表 ---
    'Sidebar': '侧边栏',
    'Toggle Sidebar': '切换侧边栏',
    'Toggle sidebar': '切换侧边栏',
    'Close Sidebar': '关闭侧边栏',
    'Customize Sidebar': '自定义侧边栏',
    'Customize Sections': '自定义分区',
    'New Conversation': '新建对话',
    'New conversation': '新建对话',
    'New Conversation in Project': '在项目中新建对话',
    'New conversation button': '新建对话按钮',
    'Projects': '项目',
    'Project': '项目',
    'Create New Project': '创建新项目',
    'Create Project': '创建项目',
    'New Project': '新建项目',
    'Project options': '项目选项',
    'Project Settings': '项目设置',
    'Open project settings': '打开项目设置',
    'Project Name': '项目名称',
    'Project location': '项目位置',
    'Archive project': '归档项目',
    'Create a project first.': '请先创建一个项目。',
    'A project with this name already exists.': '已存在同名项目。',
    'A group with this name already exists.': '已存在同名分组。',
    'Enter project name...': '输入项目名称...',
    'Search projects...': '搜索项目...',
    'No projects created': '尚未创建项目',
    'No Project': '无项目',
    'Not in Project': '未归属项目',
    'All Workspaces': '所有工作区',
    'Display Options': '显示选项',
    'No conversations yet': '暂无对话',
    'No conversations found': '未找到匹配的对话',
    'Conversations': '对话列表',
    'Conversation': '对话',
    'Search Conversations': '搜索对话',
    'Search conversations...': '搜索对话...',
    'Search for conversations...': '搜索对话...',
    'Clear search': '清除搜索',
    'Clear Search': '清除搜索',
    'Group By': '分组方式',
    'Sort By': '排序方式',
    'Sort Conversations': '排序对话',
    'Last Updated': '最近更新',
    'Last Prompt': '最近提问',
    'Last Activity': '最近活动',
    'Manual Order': '手动排序',
    'Custom Order': '自定义排序',
    'Pinned': '已置顶',
    'Pin / Unpin Conversation': '置顶 / 取消置顶对话',
    'Archived Only': '仅看已归档',
    'Only Archived': '仅已归档',
    'Only Unread': '仅未读',
    'Only Automations': '仅自动化任务',
    'Unread': '未读',
    'Unsent draft': '未发送草稿',
    'Mark All as Read': '全部标为已读',
    'Rename Conversation': '重命名对话',
    'Archive conversation': '归档对话',
    'Archive': '归档',
    'Delete Conversation': '删除对话',
    'Delete Permanently': '永久删除',
    'Restore': '恢复',
    'Conversation Archived': '对话已归档',
    'Conversation Unarchived': '对话已取消归档',
    'Conversation name': '对话名称',
    'Conversation Name': '对话名称',
    'Conversation ID': '对话 ID',
    'Conversation History': '对话历史',
    'Conversation Log': '对话日志',
    'New Group': '新建分组',
    'Rename Group': '重命名分组',
    'Move to Group': '移动到分组',
    'Remove from Group': '从分组移除',
    'Group name': '分组名称',
    'Move Up': '上移',
    'Move Down': '下移',
    'Inbox': '收件箱',
    'Inbox Mode': '收件箱模式',
    'This Computer': '此电脑',
    'This computer': '此电脑',
    'Remote': '远程',
    'Local': '本地',
    'Online': '在线',
    'Offline': '离线',
    'Connected': '已连接',
    'Not connected': '未连接',
    'Needs reconnect': '需要重新连接',
    'Needs re-auth': '需要重新授权',
    'Recent': '最近',
    'Recent Files': '最近文件',
    'Recent files': '最近文件',
    'Settings': '设置',
    'Open Settings': '打开设置',
    'Open settings menu': '打开设置菜单',

    // --- 首页、输入框与上下文 ---
    'Announcements and tips': '公告与提示',
    'Select Environment': '选择环境',
    'Message input': '消息输入框',
    'Input Box': '输入框',
    'Ask anything, @ to mention, / for actions': '随便问点什么，输入 @ 引用内容，输入 / 执行命令',
    'Ask anything, @ to mention': '随便问点什么，输入 @ 引用内容',
    'Listening. Ask anything.': '正在聆听，请随时提问。',
    'Add context': '添加上下文',
    'Send message': '发送消息',
    'Cancel Sending Message': '取消发送消息',
    'Select Model': '选择模型',
    'Select Model to Send Message': '选择模型以发送消息',
    'Select another model': '选择其他模型',
    'Change model': '切换模型',
    'No Model Selected': '未选择模型',
    'No Models Available': '暂无可用模型',
    'No models available': '暂无可用模型',
    'Error Loading Models': '加载模型失败',
    'Loading models...': '正在加载模型...',
    'Queued messages': '排队中的消息',
    'Queued Messages': '排队中的消息',
    'Send Now': '立即发送',
    'Stop': '停止',
    'Stop execution': '停止执行',
    'Interrupt Agent': '中断智能体',
    'Continue as a new conversation': '作为新对话继续',
    'Add screenshot to conversation': '添加截图到对话',
    'Add files': '添加文件',
    'Upload Files': '上传文件',
    'Uploads': '上传内容',
    'No uploads': '暂无上传',
    'Documents': '文档',
    'No documents': '暂无文档',
    'Links': '链接',
    'No links': '暂无链接',
    'Mentions': '提及与引用',
    'Context Providers': '上下文来源',
    'Context usage': '上下文用量',
    'Context and quota indicator': '上下文与配额指示器',
    'Token Usage': 'Token 用量',
    'No token data available.': '暂无 Token 用量数据。',
    'Typeahead menu': '补全菜单',
    'Side Question': '旁白提问',
    'Side Questions': '旁白提问列表',
    'New Side Question': '新建旁白提问',
    'Ask a quick question without interrupting the main conversation.': '快速提问一个问题，不打断当前主对话。',
    'Ask a side question without interrupting the main conversation': '提一个旁白问题，不打断当前主对话',
    'Send reply': '发送回复',
    'Minimize side question': '最小化旁白提问',
    'Delete Side Question': '删除旁白提问',
    'Delete side question': '删除旁白提问',
    'Stop side question': '停止旁白提问',
    'Insert into main conversation': '插入到主对话',
    'Previous side question': '上一个旁白提问',
    'Next side question': '下一个旁白提问',
    'Previous question': '上一题',
    'Next question': '下一题',
    'Type your own answer': '输入你的回答',
    'Cancel questionnaire': '取消问卷',
    'Quick Start': '快速开始',
    'Build new features': '开发新功能',
    'Debug and fix': '排查与修复问题',
    'Research anything': '调研任何主题',
    'Write and edit docs': '撰写与编辑文档',
    'Build with one agent or a team': '单个智能体或多智能体协作构建',
    'Review plans and walkthroughs': '审阅计划与实现讲解',
    'You are in control': '一切尽在掌控',
    'Describe what you want. Your agent plans and builds it, and brings in other agents when needed.': '描述你的需求，智能体会自主规划并实现，并在需要时调度其他子智能体协同工作。',
    'Comment on the plan before your agent starts, and get a walkthrough when it finishes.': '可在智能体动手前审阅并批注方案，完成后可查看完整的实现讲解。',
    'By default, agents work in folders you choose and ask before sensitive changes. Adjust this anytime in Settings.': '默认情况下，智能体仅在你指定的目录内工作，并在执行敏感操作前请求确认，可随时在设置中调整。',
    'Ask about your code or any topic, get clear answers.': '围绕代码或任意主题提问，获取清晰解答。',
    'Automatically reproduce bugs, trace causes, test fixes.': '自动复现问题、定位根因并验证修复。',
    'Draft documents, emails, and notes that sound like you.': '起草符合你风格的文档、邮件与笔记。',
    'Hand off a feature and come back to working code.': '把需求交给它，回来即可收获可运行的代码。',
    'Set the rules, define the boundaries.': '制定规则，划清操作边界。',
    'Stay up to date.': '保持最新版本。',

    // --- 设置面板、配额、权限、远程控制、MCP、自动化、插件等 ---
    'General': '常规',
    'Appearance': '外观',
    'Account': '账号',
    'Accounts': '账号管理',
    'Models & Usage': '模型与用量',
    'Model Quota': '模型配额',
    'Model Credits': '模型额度',
    'Model selection': '模型选择',
    'Plan': '订阅方案',
    'Subscription': '订阅管理',
    'Quota': '配额',
    'Usage': '用量',
    'Permissions': '权限管理',
    'Permission': '权限',
    'Permission Details': '权限详情',
    'Permission Settings': '权限设置',
    'Permission preset': '权限预设',
    'Permission decision': '权限决策',
    'Local Permissions': '本地权限',
    'Tool Permissions': '工具权限',
    'Tool permissions': '工具权限',
    'File Permissions': '文件权限',
    'Network Permissions': '网络权限',
    'Terminal & Tooling Permissions': '终端与工具权限',
    'Browser Actuation Permissions': '浏览器操作权限',
    'GitHub Permissions': 'GitHub 权限',
    'GitHub Policies': 'GitHub 策略',
    'Plugin permissions': '插件权限',
    'Customizations': '自定义扩展',
    'Default Customizations': '默认自定义扩展',
    'Customize Global Skills': '自定义全局技能',
    'Skills': '技能 (Skills)',
    'Rules': '规则 (Rules)',
    'Skills & Rules': '技能与规则',
    'Hooks': '钩子 (Hooks)',
    'Manage Hooks': '管理钩子',
    'Manage hooks': '管理钩子',
    'Agent Hooks Configuration': '智能体钩子配置',
    'MCP Servers': 'MCP 服务器',
    'MCP servers': 'MCP 服务器',
    'MCP Tools': 'MCP 工具',
    'MCP tools': 'MCP 工具',
    'Add MCP Server': '添加 MCP 服务器',
    'Add MCP Servers': '添加 MCP 服务器',
    'Installed MCP Servers': '已安装的 MCP 服务器',
    'Refresh MCP servers': '刷新 MCP 服务器',
    'Delete MCP Server': '删除 MCP 服务器',
    'View MCP servers': '查看 MCP 服务器',
    'MCP Servers Disabled': 'MCP 服务器已禁用',
    'MCP server error': 'MCP 服务器错误',
    'Connectors': '连接器',
    'Connections': '连接',
    'Remote Control': '远程控制',
    'Remote Control Instances': '远程控制实例',
    'Remote Control link': '远程控制链接',
    'Enable Remote Control': '启用远程控制',
    'Show Remote Control QR code': '显示远程控制二维码',
    'Open in Remote Control': '在远程控制中打开',
    'Open on another device': '在其他设备上打开',
    'Open on phone': '在手机上打开',
    'Get started with Remote Control': '开始使用远程控制',
    'Device name': '设备名称',
    'Enter device name...': '输入设备名称...',
    'Nickname': '设备别名',
    'Work with local agents from another device.': '从其他设备操作本地智能体。',
    'Manage your conversations from the companion website.': '在配套网页端管理你的对话。',
    'Continue your work from another device with Remote Control. Scan the QR code or open the link below.': '通过远程控制在另一台设备上继续工作。扫描二维码或打开下方链接。',
    'Pick up this remote conversation on your phone or in any browser. Scan the QR code or open the link below.': '在手机或任意浏览器上接续此远程对话。扫描二维码或打开下方链接。',
    'A label for this computer when you connect from another device. Changing it reconnects.': '从其他设备连接时用于标识此电脑的名称。修改后会重新建立连接。',
    'A nickname for identifying this application in the companion website. Changing this will restart the connection.': '在配套网页端用于识别此应用的别名。修改后会重启远程连接。',
    'Notifications': '通知',
    'Notification Preferences': '通知偏好设置',
    'Notification settings': '通知设置',
    'Enable Notifications': '启用通知',
    'Enable notifications for agent': '为智能体启用通知',
    'Show system notifications when your action is needed or the agent finishes.': '当需要你确认或智能体完成任务时显示系统通知。',
    'Sound': '提示音',
    'Enable sounds for agent': '为智能体启用提示音',
    'Play a sound when your action is needed or the agent finishes.': '当需要你确认或智能体完成任务时播放提示音。',
    'Volume': '音量',
    'Chime volume': '提示音音量',
    'Set the volume of agent sounds.': '设置智能体提示音的音量。',
    'Voice': '语音',
    'Voices': '音色',
    'Voice speed': '语速',
    'Voice volume': '语音音量',
    'Voice engine': '语音引擎',
    'Voice engine address': '语音引擎地址',
    'Voice dictation unavailable': '语音听写不可用',
    'Microphone': '麦克风',
    'Input device for voice mode and dictation.': '用于语音模式与听写的输入设备。',
    'Dictation languages': '听写语言',
    'Available dictation languages': '可选听写语言',
    'Selected dictation languages': '已选听写语言',
    'Dictation language options': '听写语言选项',
    'Shortcuts': '快捷键',
    'Keyboard shortcuts': '键盘快捷键',
    'Customize Shortcuts': '自定义快捷键',
    'Open Keyboard Shortcuts': '打开键盘快捷键',
    'Add Shortcut': '添加快捷键',
    'Edit Shortcut': '编辑快捷键',
    'Remove Shortcut': '移除快捷键',
    'Keybinding Scheme': '键位映射方案',
    'Keyboard shortcuts for quick navigation and control.': '用于快速导航和控制的键盘快捷键。',
    'Manage your keybinding scheme and customize shortcuts in VS Code.': '管理键位方案并在 VS Code 中自定义快捷键。',
    'Browser': '浏览器',
    'Browser Use': '浏览器操作',
    'Browser Subagent': '浏览器子智能体',
    'Browser actions': '浏览器操作',
    'Browser actuation rules': '浏览器执行规则',
    'Browser downloads': '浏览器下载',
    'Browser JavaScript execution policy': '浏览器 JavaScript 执行策略',
    'Enable browser agent': '启用浏览器智能体',
    'Browsing data': '浏览数据',
    'Browsing history': '浏览历史',
    'Cookies and site data': 'Cookie 和网站数据',
    'Cookies by Site': '按网站查看 Cookie',
    'Clear Browsing Data?': '确认清除浏览数据？',
    'Clear cookies and site data': '清除 Cookie 和网站数据',
    'Sites with cookies': '包含 Cookie 的网站',
    'Downloads': '下载',
    'Download location': '下载保存位置',
    'Workspace': '工作区',
    'Workspaces': '工作区列表',
    'Worktree': '工作树 (Worktree)',
    'New Workspace': '新建工作区',
    'New Worktree': '新建工作树',
    'Select Worktree': '选择工作树',
    'Previous Worktrees': '历史工作树',
    'Current workspace': '当前工作区',
    'Default workspace VCS': '默认工作区版本控制 (VCS)',
    'Environments': '运行环境',
    'Environment': '运行环境',
    'More cloud environments': '更多云端环境',
    'Local Windows environment': '本地 Windows 环境',
    'SSH Host': 'SSH 主机',
    'SSH host': 'SSH 主机',
    'SSH Host…': 'SSH 主机…',
    'SSH Config': 'SSH 配置',
    'Security': '安全',
    'Security preset': '安全预设',
    'Telemetry': '遥测统计',
    'Conversation Telemetry': '对话遥测',
    'Enable telemetry': '启用遥测',
    'Telemetry is disabled in Settings': '设置中已禁用遥测',
    'Console Telemetry': '控制台遥测',
    'Developer': '开发者',
    'Labs': '实验室',
    'Advanced': '高级',
    'Advanced Settings': '高级设置',
    'Updater': '更新器',
    'Application': '应用程序',
    'Application Menu': '应用菜单',
    'Interface Layout': '界面布局',
    'Chat Layout': '对话布局',
    'Display': '显示',
    'Layout': '布局',
    'Theme': '主题',
    'Themes': '主题列表',
    'Dark Theme': '深色主题',
    'Light Theme': '浅色主题',
    'System default': '跟随系统',
    'System default app': '系统默认应用',
    'Auto (detected)': '自动（检测）',
    'Accent': '强调色',
    'Contrast': '对比度',
    'Color': '颜色',
    'Font': '字体',
    'Font size': '字号',
    'Conversation width': '对话面板宽度',
    'Markdown artifact width': 'Markdown 产物宽度',
    'Markdown view mode': 'Markdown 视图模式',
    'Enter to send': '按 Enter 发送',
    "Send messages with the keyboard's Enter key instead of starting a new line.": '按键盘 Enter 键直接发送消息（而不是换行）。',
    'Enter always submits. This adds a second shortcut.': 'Enter 始终提交发送，此项添加第二种快捷发送方式。',
    'Choose which key sends a message in the chat composer.': '选择在输入框中发送消息的按键方式。',
    'Choose how much detail is shown during a conversation.': '选择对话过程中展示的详细程度。',
    'Choose where links open by default when clicked.': '选择点击链接时的默认打开方式。',
    'Choose where terminal sessions appear.': '选择终端会话的显示位置。',
    'Open links in': '链接打开方式',
    'Terminal placement': '终端位置',
    'Link Settings': '链接设置',
    "Configure the agent's visual theme and display preferences.": '配置界面视觉主题与显示偏好。',
    'Configure the maximum width of the conversation panel.': '配置对话面板的最大宽度。',
    'Configure the default width of markdown artifacts.': '配置 Markdown 产物的默认宽度。',
    'Configure agent execution, queued message delivery, and permissions.': '配置智能体执行策略、排队消息投递方式及权限。',
    'Configure external tools via Model Context Protocol.': '通过模型上下文协议 (MCP) 配置外部工具。',
    'Configure hooks that run on agent lifecycle events.': '配置在智能体生命周期事件触发的钩子。',
    'Configure built-in browser, link opening, and browser subagent preferences.': '配置内置浏览器、链接打开方式和浏览器子智能体偏好。',
    'Configure workspace-specific permissions, resources, and customizations.': '配置工作区专属权限、资源和自定义扩展。',
    'Manage your plan, credentials, and general preferences.': '管理订阅方案、登录凭据与常规偏好。',
    'Manage your model quota and credits.': '管理模型配额与 AI 额度。',
    'Manage your notification preferences.': '管理通知偏好设置。',
    'Enable sandbox mode': '启用沙箱模式',
    'Enable terminal sandbox': '启用终端沙箱',
    'Restricts agent tools to a secure, isolated local sandbox.': '将智能体工具限制在安全隔离的本地沙箱中运行。',
    'Terminal command auto execution': '终端命令自动执行',
    'Controls whether terminal commands require your approval before running.': '控制终端命令在执行前是否需要你的审批确认。',
    'Controls the actions the agent can take.': '控制智能体可以执行的操作。',
    'Controls permissions for remote conversations.': '控制远程对话的权限。',
    'Always Proceed': '始终自动放行 (Always Proceed)',
    'Proceed in Sandbox': '在沙箱内自动放行',
    'Request Review': '每次请求确认',
    'Auto': '自动 (Auto)',
    'Turbo': '极速无拦截 (Turbo)',
    'Default': '默认',
    'Custom': '自定义',
    'Custom…': '自定义…',
    'Every command requires approval.': '每条命令都需要手动确认。',
    'Automatically decide if commands run.': '自动判断命令是否直接运行。',
    'Run all commands without restrictions.': '无限制运行所有命令。',
    'Run terminal commands with sandbox restrictions.': '在沙箱限制下运行终端命令。',
    'Ask before sensitive operations.': '敏感操作前先询问。',
    'Commands outside sandbox': '沙箱外命令',
    'Commands Outside Sandbox': '沙箱外命令',
    'Unsandboxed commands': '未进沙箱命令',
    'Terminal commands': '终端命令',
    'Terminal Commands': '终端命令',
    'File access rules': '文件访问规则',
    'File reads': '文件读取',
    'File writes': '文件写入',
    'Read files': '读取文件',
    'Write files': '写入文件',
    'Read URLs': '读取网页 URL',
    'Execute URLs': '操作网页 URL',
    'Network access rules': '网络访问规则',
    'Outside of folders file access policy': '工作目录外文件访问策略',
    'Command setup script': '命令前置初始化脚本',
    'A shell setup script run before every command the agent executes.': '智能体每次执行命令前运行的 Shell 初始化脚本。',
    'Enable AI credit overages': '启用 AI 超额按量额度',
    'Enable Overages': '启用超额额度',
    'Purchase Credits': '购买额度',
    'See Plans': '查看方案',
    'Refresh quota and credits data': '刷新配额与额度数据',
    'No quota information available.': '暂无配额信息。',
    'Model quota reached': '模型配额已用尽',
    'Baseline model quota reached': '基础模型配额已用尽',
    'Insufficient AI Credits': 'AI 额度不足',
    'Plan upgrade required': '需要升级订阅方案',
    'Pay As You Go': '按量付费',
    'Orchestrator': '编排器 (Orchestrator)',
    'Orchestrator Model': '规划编排模型',
    'Executor Model': '执行模型',
    'Orchestrator Settings': '编排器设置',
    'Orchestrator model selection': '规划编排模型选择',
    'Carries out the plan: searches, edits, builds, and tests. Pick a faster, cheaper model.': '负责落实计划：搜索、编辑、构建与测试。建议选择更快、成本更低的模型。',
    'Default uses server-managed routing and Orchestrator quota. Custom pins specific models for orchestration and execution.': '「默认」由服务端智能路由并使用编排配额；「自定义」可分别为规划和执行固定指定模型。',
    'Automatic check for updates': '自动检查更新',
    'Check for Updates': '检查更新',
    'Update Available': '有可用更新',
    'Updating': '正在更新',
    'A new version is available.': '发现新版本。',
    'App version': '应用版本',
    'Version': '版本',
    'Prevent sleep': '防止休眠',
    'Prevent the computer from sleeping while the app is running.': '应用运行期间阻止电脑自动休眠。',
    'Keep in menu bar': '常驻菜单栏',
    'Keep the app accessible from the menu bar and running in the background when all windows are closed.': '关闭所有窗口后仍保留在菜单栏并持续后台运行。',
    'Screen reader mode': '屏幕阅读器模式',
    'Optimize the interface and terminal output for screen readers.': '为屏幕阅读器优化界面与终端输出。',
    'Danger Zone': '危险操作区',
    'Delete all Remote Agents data': '删除全部远程智能体数据',
    'Delete All Remote Agents Data?': '确认删除全部远程智能体数据？',
    'Remote Agents Data': '远程智能体数据',
    'Sign in again': '重新登录',
    'Sign-in required': '需要登录',
    'Authentication Required': '需要身份验证',
    'Authentication expired': '身份验证已过期',
    'Not signed in': '未登录',
    'Log in': '登录',
    'Log back in': '重新登录',
    'Continue with Google': '使用 Google 账号继续',
    'Continue with Google Cloud': '使用 Google Cloud 继续',
    'Signed-in accounts': '已登录账号',
    'Other sign-in options': '其他登录方式',
    'Enter authorization code...': '输入授权码...',
    'Paste authorization code': '粘贴授权码',
    'Paste auth code': '粘贴授权码',
    'Paste code': '粘贴代码',
    'Finish signing in in your browser.': '请在浏览器中完成登录。',
    'Unauthenticated': '未认证',
    'Settings Unavailable': '设置暂不可用',
    'Reset to Default': '恢复默认',
    'Reset All to Defaults': '全部恢复默认',
    'Reset to preset': '恢复为预设',
    'Reset all shortcuts to defaults': '将所有快捷键重置为默认',
    'Reload app': '重新加载应用',
    'Reload this window.': '重新加载此窗口。',
    'Automations': '自动化任务',
    'Show Automations': '显示自动化任务',
    'New automation': '新建自动化任务',
    'Schedule': '定时计划',
    'On a schedule': '按定时计划触发',
    'When something happens': '按事件触发',
    'When it runs': '何时运行',
    'Where it runs': '运行环境',
    'What should it do?': '执行什么任务？',
    'How often': '执行频率',
    'Repeat every': '每隔',
    'Repeat unit': '重复单位',
    'Hourly': '每小时',
    'Daily': '每天',
    'Every hour': '每小时',
    'Every day': '每天',
    'Every week': '每周',
    'Every weekday': '每个工作日',
    'Last run': '上次运行',
    'Next run': '下次运行',
    'No runs yet': '尚无运行记录',
    'Not scheduled': '未计划',
    'Refresh all credentials': '刷新所有凭据',
    'Refreshed credentials for all automations.': '已刷新所有自动化任务的凭据。',
    'Plugins': '插件',
    'More Plugins': '更多插件',
    'UI Plugins': '界面插件',
    'UI plugins': '界面插件',
    'Show Plugins': '显示插件',
    'Show or Hide Plugins': '显示或隐藏插件',
    'Marketplace': '插件市场',
    'Browse the Marketplace': '浏览插件市场',
    'Explore the plugin marketplace': '探索插件市场',
    'Installed': '已安装',
    'Currently installed': '当前已安装',
    'Create plugin': '创建插件',
    'Create a Plugin with the Agent': '让智能体协助创建插件',
    'Plugin details': '插件详情',
    'Plugin metadata': '插件元数据',
    'No Plugins Available': '暂无可用插件',
    'No plugins available.': '暂无可用插件。',
    'Bundles': '扩展包',
    'Built In': '内置',
    'Recommended': '推荐',
    'Enable Recommended Skills': '启用推荐技能',
    'Include default customizations, such as default skills.': '包含默认自定义配置（如默认技能）。',
    'Include Jetski default customizations': '包含 Jetski 默认自定义配置',

    // --- 步骤、审批、面板、Git/Diff、终端、弹窗、常用操作 ---
    'Thinking': '思考中',
    'Thinking...': '思考中...',
    'Thought Process': '思考过程',
    'Working': '处理中',
    'Running': '运行中',
    'Starting': '启动中',
    'Starting the conversation…': '正在启动对话…',
    'Pending': '等待中',
    'Idle': '空闲',
    'Ready': '就绪',
    'Stopped': '已停止',
    'Stalled': '已停滞',
    'Failed': '失败',
    'Error': '错误',
    'Errors': '错误列表',
    'Unknown': '未知',
    'Active': '活跃',
    'Disabled': '已禁用',
    'Enabled': '已启用',
    'Resolved': '已解决',
    'Needs attention': '需要关注',
    'Needs Attention': '需要关注',
    'Needs Input': '等待输入',
    'Blocked, needs input': '已阻塞，需要你的输入',
    'Action required': '需要操作',
    'Verification required': '需要验证',
    'Setup required': '需要配置',
    'Confirmation required to execute this step': '执行此步骤前需要你的确认',
    'Confirm the command is safe to run outside of the sandbox with full network and disk access.': '请确认该命令可安全地在沙箱外（拥有完整网络和磁盘权限）运行。',
    'This command ran in the sandbox.': '此命令在沙箱中运行。',
    'Accept': '接受',
    'Reject': '拒绝',
    'Allow': '允许',
    'Deny': '拒绝',
    'Proceed': '继续执行',
    'Proceed with Plan': '按计划继续',
    'Review': '审阅',
    'Review Changes': '审阅变更',
    'Run': '运行',
    'Cancel': '取消',
    'Cancel Task': '取消任务',
    'Cancel All Tasks': '取消全部任务',
    'Cancel step': '取消此步骤',
    'Cancel recording': '取消录制',
    'Save': '保存',
    'Saved': '已保存',
    'Discard': '放弃',
    'Create': '创建',
    'Creating...': '创建中...',
    'Edit': '编辑',
    'Rename': '重命名',
    'Delete': '删除',
    'Remove': '移除',
    'Fork': '派生分支',
    'Fork Conversation': '派生新对话',
    'Fork in New Workspace': '在新工作区派生',
    'Fork in Shared Workspace': '在共享工作区派生',
    'Fork conversation in this folder': '在此目录派生对话',
    'Forked from': '派生自',
    'Undo': '撤销',
    'Undo to Here': '回退到此处',
    'Confirm Undo': '确认回退',
    'Revert file changes': '还原文件修改',
    'Stage change': '暂存更改',
    'Unstage change': '取消暂存',
    'Staged Changes': '已暂存的更改',
    'Discard unstaged changes': '丢弃未暂存的更改',
    'Include unstaged changes': '包含未暂存的更改',
    'Commit': '提交 (Commit)',
    'Commit succeeded': '提交成功',
    'Amend': '修补提交 (Amend)',
    'Amend succeeded': '修补提交成功',
    'Push': '推送 (Push)',
    'Push succeeded': '推送成功',
    'Branch': '分支',
    'Branch Changes': '分支变更',
    'Pull Requests': '拉取请求 (PR)',
    'Pull requests': '拉取请求 (PR)',
    'Issues': '议题 (Issues)',
    'Added': '已新增',
    'Added (Staged)': '已新增（已暂存）',
    'Modified': '已修改',
    'Deleted': '已删除',
    'Renamed': '已重命名',
    'Untracked': '未跟踪',
    'Untracked (Unstaged)': '未跟踪（未暂存）',
    'Uncommitted': '未提交',
    'No changes to review': '暂无变更需要审阅',
    'Code Change Summary': '代码变更摘要',
    'Open Diff': '打开差异对比',
    'Toggle file diff': '切换文件差异视图',
    'Files': '文件',
    'Files Changed': '已变更文件',
    'Modified Files': '已修改文件',
    'Files modified by the agent in this conversation': '智能体在本对话中修改过的文件',
    'Agent Edits': '智能体修改',
    'Changes': '变更',
    'Artifacts': '产物 (Artifacts)',
    'Artifact Comments': '产物评论',
    'Artifact updated by agent': '产物已由智能体更新',
    'Subagents': '子智能体',
    'Agents': '智能体',
    'Main Agent': '主智能体',
    'Custom Agents': '自定义智能体',
    'Background Tasks': '后台任务',
    'Background tasks and terminals agents left running, across all conversations.': '智能体在所有对话中保持运行的后台任务与终端。',
    'Terminals': '终端列表',
    'Terminal': '终端',
    'Open Terminal': '打开终端',
    'New Terminal': '新建终端',
    'Split Terminal': '拆分终端',
    'Split Right': '向右拆分',
    'Split Down': '向下拆分',
    'Kill Terminal': '终止终端',
    'Delete Terminal': '删除终端',
    'No active terminals': '当前无活跃终端',
    'Standalone Terminals': '独立终端',
    'Insert in terminal': '插入到终端',
    'Terminal: Select All': '终端：全选',
    'Overview': '概览',
    'Toggle Overview Panel': '切换概览面板',
    'Toggle Side Panel': '切换右侧边栏',
    'Toggle Terminal Panel': '切换终端面板',
    'Open in Side Panel': '在侧边栏打开',
    'Open in side pane': '在侧边栏打开',
    'Close Panel': '关闭面板',
    'File Explorer': '文件浏览器',
    'Code Search': '代码搜索',
    'Command Palette': '命令面板',
    'Open Search': '打开搜索',
    'Open File Search': '打开文件搜索',
    'Copy': '复制',
    'Copied': '已复制',
    'Copy Path': '复制路径',
    'Copy path': '复制路径',
    'Copy File Path': '复制文件路径',
    'Copy File Name': '复制文件名',
    'Copy Command': '复制命令',
    'Copy command': '复制命令',
    'Copy Content': '复制内容',
    'Copy Message': '复制消息',
    'Copy Link': '复制链接',
    'Copy Link Address': '复制链接地址',
    'Copy Image': '复制图片',
    'Copy Image Address': '复制图片地址',
    'Copy debug info': '复制调试信息',
    'Copy Config File Path': '复制配置文件路径',
    'Copy full URL to clipboard': '复制完整 URL 到剪贴板',
    'Path copied!': '路径已复制！',
    'Cut': '剪切',
    'Paste': '粘贴',
    'Select All': '全选',
    'Find': '查找',
    'Search': '搜索',
    'Filter': '筛选',
    'Filters': '筛选条件',
    'Clear filter': '清除筛选',
    'Clear file filter': '清除文件筛选',
    'Clear row filter': '清除行筛选',
    'Match case': '区分大小写',
    'Match whole word': '全字匹配',
    'Use regular expression': '使用正则表达式',
    'Previous match': '上一个匹配',
    'Next match': '下一个匹配',
    'Previous Page': '上一页',
    'Next Page': '下一页',
    'Current Page': '当前页',
    'Refresh': '刷新',
    'Refreshing...': '刷新中...',
    'Reload': '重新加载',
    'Back': '返回',
    'Forward': '前进',
    'Go Back': '后退',
    'Go Forward': '前进',
    'Back to home': '返回首页',
    'Close': '关闭',
    'Close (Esc)': '关闭 (Esc)',
    'Close Tab': '关闭标签页',
    'Close Other Tabs': '关闭其他标签页',
    'Close Tabs to the Left': '关闭左侧标签页',
    'Close Tabs to the Right': '关闭右侧标签页',
    'Dismiss': '忽略',
    'Dismiss error': '关闭错误提示',
    'Dismiss notification': '关闭通知',
    'Dismiss suggestion': '忽略建议',
    'Dismiss Tip': '关闭提示',
    'Dismiss service announcement': '关闭服务公告',
    'Got it': '知道了',
    'OK': '确定',
    'Try again': '重试',
    'Learn more': '了解更多',
    'Details': '详情',
    'Show Details': '显示详情',
    'Hide': '隐藏',
    'More': '更多',
    'More actions': '更多操作',
    'More options': '更多选项',
    'More toolbar actions': '更多工具栏操作',
    'Options': '选项',
    'View': '查看',
    'Preview': '预览',
    'Download': '下载',
    'Download File': '下载文件',
    'Download PDF': '下载 PDF',
    'Export as PDF': '导出为 PDF',
    'Share': '分享',
    'Open': '打开',
    'Open File': '打开文件',
    'Open in New Tab': '在新标签页打开',
    'Open in new tab': '在新标签页打开',
    'Open in New Window': '在新窗口打开',
    'Open in External Browser': '在外部浏览器打开',
    'Open in external browser': '在外部浏览器打开',
    'Open in Built-in Browser': '在内置浏览器打开',
    'Open in Tab': '在标签页打开',
    'Open in tab': '在标签页打开',
    'Open Folder (Interactive)': '打开文件夹（交互式）',
    'Open URL': '打开 URL',
    'Open with': '打开方式',
    'Open IDE': '在 IDE 中打开',
    'Show in folder': '在文件夹中显示',
    'Loading...': '加载中...',
    'Loading plugins...': '正在加载插件...',
    'Loading hooks...': '正在加载钩子...',
    'Loading logs...': '正在加载日志...',
    'Loading MCP servers...': '正在加载 MCP 服务器...',
    'Loading customizations...': '正在加载自定义配置...',
    'Loading events...': '正在加载事件...',
    'Loading worktrees...': '正在加载工作树...',
    'Loading trajectory...': '正在加载轨迹...',
    'Loading media...': '正在加载媒体...',
    'Loading apps...': '正在加载应用...',
    'Loading licenses...': '正在加载许可信息...',
    'Good response': '回答有帮助',
    'Good Response': '回答有帮助',
    'Bad response': '回答不佳',
    'Bad Response': '回答不佳',
    'Response actions': '回复操作',
    'Add to Chat': '添加到对话',
    'Add to Chat/Quote': '添加到对话 / 引用',
    'Quote': '引用',
    'Comment': '评论',
    'Comments': '评论',
    'Add inline comment': '添加行内批注',
    'Edit comment': '编辑批注',
    'Delete comment': '删除批注',
    'View comments': '查看批注',
    'View or edit comment': '查看或编辑批注',
    'Discard comment draft': '丢弃批注草稿',
    'Resume comment draft': '恢复批注草稿',
    'Write a comment...': '写下批注...',
    'Reply': '回复',
    'Send': '发送',
    'Sent': '已发送',
    'Zoom': '缩放',
    'Zoom In': '放大',
    'Zoom Out': '缩小',
    'Zoom in (+)': '放大 (+)',
    'Zoom out (-)': '缩小 (-)',
    'Zoom Level': '缩放比例',
    'Reset Zoom': '重置缩放',
    'Reset zoom (0)': '重置缩放 (0)',
    'Fit Mode': '适应模式',
    'Thumbnails': '缩略图',
    'Toggle Thumbnails': '切换缩略图',
    'Maximize': '最大化',
    'Minimize': '最小化',
    'Stop All Subagents': '停止全部子智能体',
    'Stop Subagent': '停止子智能体',
    'Stop subagent': '停止子智能体',
    'Stop this agent': '停止此智能体',
    'Resume this agent where it paused': '从暂停处继续此智能体',
    'Pause': '暂停',
    'Resume': '继续',
    'Agent terminated due to error': '智能体因错误终止',
    'Are you sure you want to delete this conversation? This action cannot be undone.': '确定要删除此对话吗？此操作不可撤销。',
    'Running processes are killed. This cannot be undone.': '正在运行的进程将被终止，此操作不可撤销。',
    'Conversation copied as Markdown to clipboard': '已将对话以 Markdown 格式复制到剪贴板',
    'No results': '无结果',
    'No matching results': '无匹配结果',
    'No files or folders found': '未找到文件或文件夹',
    'No environments found': '未找到运行环境',
    'No branches': '暂无分支',
    'No agents': '暂无智能体',
    'No events recorded': '暂无事件记录',
    'No events recorded.': '暂无事件记录。',
    'No MCP servers installed': '尚未安装 MCP 服务器',
    'No skills available': '暂无可用技能',
    'No instances yet.': '暂无实例。',
    'No workspaces open.': '暂无已打开的工作区。',
    'No previous worktrees': '暂无历史工作树',
    'No internet. Agent features may not work.': '当前无网络连接，智能体功能可能无法正常工作。',
    'All': '全部',
    'All Files': '全部文件',
    'Global': '全局',
    'Other': '其他',
    'Optional': '可选',
    'Name': '名称',
    'Description': '描述',
    'Status': '状态',
    'Scope': '作用域',
    'Never': '从不',
    'Any time': '不限时间',
    '3 days': '3 天',
    '7 days': '7 天',
    '14 days': '14 天',
    '21 days': '21 天',
    'Last 7 days': '最近 7 天',
    'just now': '刚刚',
    'You said': '你说',
    'Agent working': '智能体处理中',
    'Filter files...': '筛选文件...',
    'Filter rows...': '筛选行...',
    'Search customizations...': '搜索自定义配置...',
    'Search MCP servers by name': '按名称搜索 MCP 服务器',
    'Search connectors': '搜索连接器',
    'Search branches': '搜索分支',
    'Search sites...': '搜索网站...',
    'Search flags': '搜索实验标志',
    'Search for commands...': '搜索命令...',
    'Search Google Drive': '搜索 Google 云端硬盘',
    'Search results': '搜索结果',
    'See all': '查看全部',
    'See more results': '查看更多结果',
    'Connect': '连接',
    'Disconnect': '断开连接',
    'Connect GitHub': '连接 GitHub',
    'Configure': '配置',
    'Enable': '启用',
    'Failed to start conversation': '启动对话失败',
    'Failed to delete conversation': '删除对话失败',
    'Failed to rename conversation': '重命名对话失败',
    'Failed to fork conversation': '派生对话失败',
    'Failed to stop conversation': '停止对话失败',
    'Failed to stop agent': '停止智能体失败',
    'Failed to proceed': '继续执行失败',
    'Failed to continue': '继续失败',
    'Failed to save settings': '保存设置失败',
    'Failed to refresh credentials': '刷新凭据失败',
    'Failed to Commit': '提交失败',
    'Failed to Push': '推送失败',
    'Failed to Amend': '修补提交失败',
    'Failed to fetch diffs': '获取变更差异失败',
    'Failed to read file content': '读取文件内容失败',
    'File not found': '未找到文件',
    'Not Found': '未找到',
    'Not available': '不可用',
    'Not configured': '未配置',
    'Commands': '命令',
    'Actions': '操作',
    'Steps': '步骤',
    'Task': '任务',
    'Goal': '目标',
    'Goals': '目标',
    'Logs': '日志',
    'Output': '输出',
    'Input:': '输入：',
    'Output:': '输出：',
    'Error:': '错误：',
    'Timeout:': '超时：',
    'Event:': '事件：',
    'Events': '事件',
    'Prompt': '提示词',
    'Host': '主机',
    'Machine': '机器',
    'Repository': '仓库',
    'Repositories': '仓库列表',
    'Organizations': '组织',
    'Owner': '所有者',
    'Author': '作者',
    'Members': '成员',
    'Branches': '分支列表',
    'Remote branches': '远程分支',
    'Auto Pin': '自动置顶',
    'Auto-Resolve': '自动解决',
    'Best of N': '多路优选 (Best of N)',
    'Best-of-N Started': '多路优选已启动',
    'Best-of-N Ended': '多路优选已结束',
    'Conversation unavailable': '对话不可用',
    'Conversation limit reached': '已达对话上限',
    'Daily conversation limit reached': '已达每日对话上限',
    'Too many environments running': '运行中的环境过多',
    'Remote agents are busy': '远程智能体正忙',
    'No longer available': '已不再可用',
    'No longer active': '已不再活跃',
    'Nothing is running right now': '当前没有正在运行的任务',
    'Nothing said yet': '尚无消息',
    'Empty directory': '空目录',
    'Empty log': '空日志',

    // ==================== v1.1.0 补充：设置页、长描述、下拉项、语音与 @ / 菜单 ====================
    'Select...': '请选择...',
    'Models': '模型',
    'Agent': '智能体',
    'Agent Settings': '智能体设置',
    'Global Permissions': '全局权限',
    'Chat': '对话',
    'Accessibility': '无障碍',
    'Give Feedback': '提供反馈',
    'Provide Feedback': '提供反馈',
    'Jetski Chat': 'Jetski 对话',
    'Voice Mode': '语音模式',
    'Feature Environment Override': '特性环境覆盖',
    'Windows Subsystem for Linux': '适用于 Linux 的 Windows 子系统 (WSL)',
    'Workspace URI Switcher': '工作区 URI 切换器',
    'System': '跟随系统',
    'Light': '浅色',
    'Dark': '深色',
    'Narrow': '窄',
    'Wide': '宽',
    'Fill': '铺满',
    'Verbose': '详细',
    'Bottom Panel': '底部面板',
    'Side Panel': '侧边栏',
    'Built-in Browser': '内置浏览器',
    'External Browser': '外部浏览器',
    'New Tab': '新标签页',
    'Send Immediately': '立即发送',
    'Queue': '排队等待',
    'Inherit Global': '继承全局设置',
    'Low': '低',
    'Medium': '中',
    'High': '高',
    'Max': '最高',
    'Minimal': '极简',
    'Thinking effort': '思考深度',
    'View Usage': '查看用量',
    'Set up': '开始配置',
    'Switch mic': '切换麦克风',
    'Work in a New Worktree': '在新工作树中运行',
    'Add': '添加',
    'Add account': '添加账号',
    'Add Handler': '添加处理器',
    'Add Hook Card': '添加钩子卡片',
    'Add MCP': '添加 MCP',
    'Apply': '应用',
    'Authenticate': '身份验证',
    'Change': '更改',
    'Clear': '清除',
    'Click': '点击',
    'Customize': '自定义',
    'Delete all': '全部删除',
    'Delete All Data': '删除全部数据',
    'Delete Handler': '删除处理器',
    'Delete Hook': '删除钩子',
    'Done': '完成',
    'Get API key': '获取 API 密钥',
    'Get More AI Credits': '获取更多 AI 额度',
    'Invite a Friend': '邀请好友',
    'Make default': '设为默认',
    'Manage': '管理',
    'New': '新建',
    'Open MCP Config': '打开 MCP 配置',
    'Open System Preferences': '打开系统偏好设置',
    'Permanently delete': '永久删除',
    'Reconnect': '重新连接',
    'Reopen Locally': '在本地重新打开',
    'Reset': '重置',
    'Reset to auto': '重置为自动',
    'Restart sign-in': '重新开始登录',
    'Retry': '重试',
    'Revoke all': '全部撤销',
    'Saving…': '正在保存…',
    'See Activity': '查看活动',
    'Select': '选择',
    'Set': '设置',
    'Sign in': '登录',
    'Sign In': '登录',
    'Sign out': '退出登录',
    'Still running': '仍在运行',
    'Stop Editing': '停止编辑',
    'Stopping…': '正在停止…',
    'Submit': '提交',
    'Submitting...': '正在提交...',
    'Validate': '验证',
    'Validating setup script…': '正在验证初始化脚本…',
    'Visit': '访问',
    'copy link': '复制链接',
    'Cancel download': '取消下载',
    'Close downloads': '关闭下载栏',
    'Installing': '正在安装',
    'Loading preview…': '正在加载预览…',
    'Loading resources...': '正在加载资源...',
    'Loading token usage...': '正在加载 Token 用量...',
    'Loading workspace customizations...': '正在加载工作区自定义配置...',
    'Connecting to language server...': '正在连接语言服务器...',
    'Summarizing call…': '正在总结通话…',
    'Waiting for you to finish signing in…': '等待你完成登录…',
    'Your plan:': '当前方案：',
    'Command:': '命令：',
    'Domains:': '域名：',
    'Location:': '位置：',
    'Scopes:': '权限范围：',
    'Plugin:': '插件：',
    'Project ID:': '项目 ID：',
    'Matcher:': '匹配规则：',
    'Used for:': '用途：',
    'Valid until': '有效期至',
    'Current parameter:': '当前参数：',
    'Active environment: os=': '当前生效环境：os=',
    'Sign-in failed:': '登录失败：',
    'Allowed by you': '由你允许',
    'Also includes': '同时包含',
    'Available for': '适用于',
    'Available licenses': '可用许可证',
    'Billing model': '计费模式',
    'Blocked by organization policy': '已被组织策略阻止',
    'Included with plugin': '随插件附带',
    'Issued by': '签发方',
    'Issued to': '签发给',
    'Managed by Enterprise Gateway': '由企业网关托管',
    'managed by your organization': '由你的组织统一管理',
    'No compatible devices found.': '未找到兼容设备。',
    'No recent downloads': '暂无最近下载',
    'No sign-in needed': '无需登录',
    'No sites have cookies in the built-in browser.': '内置浏览器中暂无网站存储 Cookie。',
    'No project selected': '未选择项目',
    'No project selected or project management not available.': '未选择项目或项目管理暂不可用。',
    'No matching flags': '无匹配的实验标志',
    'No matching resources found.': '未找到匹配资源。',
    'No keyboard shortcuts found matching your filter.': '未找到匹配筛选条件的快捷键。',
    'There are no customizations enabled.': '当前未启用任何自定义配置。',
    '1 Draft': '1 份草稿',
    'All tools (*)': '所有工具 (*)',
    'Browser tools (browser_.*)': '浏览器工具 (browser_.*)',
    'Certificate details': '证书详情',
    'Conversation steps': '对话步骤展示',
    'Custom context menus': '自定义右键菜单',
    'Custom Flags': '自定义实验标志',
    'Custom flag to turn on': '要开启的自定义标志',
    'File Reads': '文件读取',
    'File Writes': '文件写入',
    'Download files': '下载文件',
    'Email': '邮箱',
    'Embedded web preview': '内嵌网页预览',
    'Enterprise': '企业版',
    'External': '外部用户',
    'Feedback Type': '反馈类型',
    'Google Drive': 'Google 云端硬盘',
    'Google One referral': 'Google One 推荐',
    'Host environment': '宿主环境',
    'Operating system': '操作系统',
    'User type': '用户类型',
    'Override feature environment': '覆盖特性环境',
    'Marketing emails': '营销邮件',
    'Print telemetry to the console': '在控制台打印遥测日志',
    'Recordings': '录音记录',
    'Save audio recordings': '保存音频录制',
    'Delete all recordings?': '确认删除所有录音记录？',
    'Protocol': '协议',
    'Select Billing Model': '选择计费模式',
    'Select License': '选择许可证',
    'Select your license': '选择你的许可证',
    'Choose a Subscription': '选择订阅方案',
    'Choose Region': '选择区域',
    'Other License': '其他许可证',
    'Provide Google Cloud Project': '提供 Google Cloud 项目',
    'Enter Google Cloud Project Details': '输入 Google Cloud 项目详情',
    'Upload Debug Bundle': '上传调试包',
    'Running (Dev only)': '运行中（仅开发模式）',
    'Auto-detect (browser defaults)': '自动检测（浏览器默认）',
    'Antigravity (AGY) Style': 'Antigravity (AGY) 风格',
    'VS Code Default': 'VS Code 默认',
    'VS Code keyboard shortcuts': 'VS Code 键盘快捷键',
    'Default (Gemini Pro)': '默认 (Gemini Pro)',
    'Default (Mendel)': '默认 (Mendel)',
    'Terms of Service': '服务条款',
    'Google Antigravity Terms of Service': 'Google Antigravity 服务条款',
    'Google Privacy Policy': 'Google 隐私权政策',
    'Prohibited Use Policy': '禁止使用政策',
    'Legal Help': '法律帮助',
    'By using this app, you agree to its': '使用本应用即表示你同意其',
    'You can change this in': '你可以修改此设置于',
    'Learn more about': '了解更多关于',
    'Scan the code to open this device in Remote Control, or': '扫码以在远程控制中打开此设备，或',
    'Only stored on your machine.': '仅保存在你的本地设备上。',
    'Stored and mounted in your cloud environment': '存储并挂载到你的云端环境中',
    'Files and resources in cloud workspaces': '云端工作区中的文件与资源',
    'Connected Google Drive and GitHub resources': '已连接的 Google 云端硬盘和 GitHub 资源',
    'Manage and delete your data anytime': '随时管理和删除你的数据',
    'Share your referral link with friends': '与好友分享你的推荐链接',
    'Toggle Google Cloud projects': '切换 Google Cloud 项目',
    'Toggle language list': '展开/收起语言列表',
    'Workspace folder suggestions': '工作区目录建议',
    'Workspace URI query parameter': '工作区 URI 查询参数',
    'Workspace URI to switch to': '要切换的工作区 URI',
    'Select or enter a workspace URI': '选择或输入工作区 URI',
    'Sync JJ worktrees to head': '将 JJ 工作树同步到最新提交',
    'Use full Git clones for Best of N': '多路优选 (Best of N) 使用完整 Git 克隆',
    'Use full VCS clones for Best of N': '多路优选 (Best of N) 使用完整 VCS 克隆',
    'New hook name': '新钩子名称',
    'Enter tool name or server...': '输入工具名称或服务器...',
    'Filter resources...': '筛选资源...',
    'Press keys...': '请按下快捷键...',
    'Search for MCP servers to add to your configuration': '搜索要添加到配置中的 MCP 服务器',
    'Search languages to add (e.g. English, Spanish, 中文, yue)...': '搜索要添加的语言（例如 English、中文、yue）...',
    'Type a voice variant name, such as rev27.': '输入语音变体名称（如 rev27）。',
    'Turn on a flag you don\'t have': '开启未默认授予的实验标志',
    'Paste a code instead': '改为粘贴授权码',
    'Paste the code shown after you sign in.': '粘贴登录后显示的授权码。',
    'Attach a screenshot (optional)': '附加截图（可选）',
    'Attach Antigravity server logs': '附加 Antigravity 服务端日志',
    'Attaching logs requires an email address': '附加日志需要填写邮箱地址',
    'Actual behavior': '实际表现',
    'Expected behavior': '预期表现',
    'Steps to Reproduce': '复现步骤',
    'Steps to reproduce the issue': '复现该问题的步骤',
    'Please list the steps to reproduce the issue': '请列出复现该问题的步骤',
    'Any error messages': '任何错误信息',
    'Any error messages seen when trying to log in': '登录时看到的任何错误信息',
    'Any relevant information': '其他相关信息',
    'Send feedback as': '反馈提交身份',
    'Thank you! Your feedback has been submitted successfully.': '感谢！你的反馈已成功提交。',
    'An error occurred while submitting your feedback. Please try again.': '提交反馈时出错，请重试。',
    'Screenshot must be under 10 MB': '截图大小不能超过 10 MB',
    'Setup script ran successfully.': '初始化脚本运行成功。',
    'Setup script failed.': '初始化脚本运行失败。',
    'Failed to parse settings. Fix and restart.': '解析设置失败，请修复后重启。',
    'Failed to load resources': '加载资源失败',
    'Failed to open MCP config file': '打开 MCP 配置文件失败',
    'Failed to inspect license for this project': '检查此项目许可证失败',
    'Couldn\'t load cookies.': '无法加载 Cookie。',
    'Couldn\'t clear browsing data. Try again.': '无法清除浏览数据，请重试。',
    'Couldn\'t delete your data. Try again.': '无法删除你的数据，请重试。',
    'This page isn\'t working': '此页面无法正常运作',
    'This site can\'t be reached': '无法访问此网站',
    'View site information': '查看网站信息',
    'Organization Allowed Domains (Read-Only)': '组织允许的域名（只读）',
    'Click items to multi-select · Drag or ‹/› pills to reorder': '点击可多选 · 拖拽或点 ‹/› 调整顺序',
    'Remove from list': '从列表中移除',
    'Remove resource': '移除资源',
    'Open Conversation in New Tab': '在新标签页打开对话',
    'Open Image in New Tab': '在新标签页打开图片',
    'Open Link in External Browser': '在外部浏览器打开链接',
    'Open Link in New Tab': '在新标签页打开链接',
    'Build With Google plugins': 'Build With Google 插件',
    'Build With Google Plugins': 'Build With Google 插件',
    'Missing a repository? Configure on GitHub': '缺少仓库？前往 GitHub 配置',
    'Join the Google Chat space': '加入 Google Chat 交流群',
    'Ask questions, report issues, and discuss features': '提问、反馈问题及讨论功能',
    'Inspect element to comment': '选取页面元素以添加批注',
    'Enable the plugin to sign in.': '请先启用该插件再登录。',
    'Enable this plugin to manage its accounts.': '请先启用该插件以管理其账号。',
    'Nothing is always allowed. You\'ll be asked before this plugin makes changes.': '默认不永久放行；该插件做出修改前会先征求你的同意。',
    'Changes plugins can make without asking.': '插件无需询问即可执行的更改。',
    'Services this plugin connects to on your behalf.': '该插件代表你连接的服务。',
    'These come with the plugin and can\'t be revoked.': '这些权限随插件附带，无法撤销。',
    'Credentials are only sent to the domains listed.': '凭据仅会发送到列表中的域名。',
    '5-hour limit': '5 小时限额',
    'Weekly limit': '每周限额',
    '5-hour': '5 小时',
    'Weekly': '每周',
    'Remaining': '剩余',
    'Interrupt the agent and send immediately.': '立即中断智能体当前步骤并发送消息。',
    'Queue until after the current turn.': '排队等待当前回合完成后再发送。',
    'Press Enter to send, Shift+Enter for a new line.': '按 Enter 发送，按 Shift+Enter 换行。',
    'Press Ctrl+Enter to send, Enter for a new line.': '按 Ctrl+Enter 发送，按 Enter 换行。',
    'Press Cmd+Enter to send, Enter for a new line.': '按 Cmd+Enter 发送，按 Enter 换行。',
    'Controls whether terminal commands require your approval before running.\n\nNote: A change to this setting will only apply to new messages sent to the agent. In-progress responses will use the previous setting value.': '控制终端命令在执行前是否需要你的审批确认。\n\n注意：修改此设置仅对后续新发送的消息生效，正在进行中的回复仍沿用旧设置。',
    'The agent never asks for confirmation before executing terminal commands (except those in the Deny list). This provides the agent with the maximum ability to operate over long periods without intervention, but also has the highest risk of the agent executing an unsafe terminal command.': '智能体在执行终端命令前从不请求确认（拒绝列表中的命令除外）。这能让智能体长时间无人值守运行，但也伴随执行不安全命令的最高风险。',
    'Terminal commands automatically proceed inside the sandbox. A command that needs to leave the sandbox proceeds only if an agent judges it reversible, and otherwise requests review.': '沙箱内的终端命令自动放行；需要离开沙箱的命令仅在智能体判断其可逆时自动执行，否则请求你的确认。',
    'The agent always asks for confirmation before executing terminal commands (except those in the Allow list).': '智能体在执行终端命令前始终请求确认（允许列表中的命令除外）。',
    'Terminal command automatically proceeds if the command runs inside the sandbox. Otherwise, it requests review.': '若终端命令在沙箱内运行则自动放行，否则请求你的确认。',
    'Let the agent open URLs, read web pages, and interact with browser content. This gives the agent access to important (and often critical) knowledge and methods of validation, but any browser integration does increase exposure to external malicious parties for security exploits.': '允许智能体打开网页、读取页面内容并与浏览器交互。这有助于获取关键信息并完成验证，但也会增加暴露于外部恶意网页的安全风险。',
    'Block all browser JavaScript execution.': '禁止所有浏览器 JavaScript 执行。',
    'Prompt for approval before running browser scripts.': '运行浏览器脚本前先请求审批。',
    'Allow full browser script execution without prompting.': '无需提示直接允许执行完整浏览器脚本。',
    'Automatically prompt you to restart the app when a new update is available. When disabled, you can check for updates manually from the app menu.': '有新版本时自动提示重启更新；关闭后可随时从应用菜单手动检查更新。',
    'These settings can only be changed on the computer running the app, not from a remote session.': '这些设置只能在运行本应用的本地电脑上修改，无法在远程会话中更改。',
    'Choose the models Orchestrator uses. A larger, smarter orchestrator model with a faster, cheaper executor gives high quality for fewer tokens.': '选择编排器使用的模型组合：更强的规划模型搭配更快、更低成本的执行模型，可在节省 Token 的同时获得高质量结果。',
    'Plans the work, makes design decisions, and reviews the result. Pick a top-tier model. You can also pick one per conversation from the Orchestrator row in the model menu.': '负责规划方案、做出设计决策并审查结果，建议选择旗舰模型。你也可以在模型菜单的编排器栏中为单次对话单独指定。',
    'Controls how much time and quota the model spends reasoning before responding. Higher effort improves accuracy on hard problems, at the cost of slower responses and higher quota use.': '控制模型在回答前用于深度思考的时间与配额。更高深度可提升难题准确率，但响应更慢且消耗更多配额。',
    'Allow/deny agent browser actuation access to specific URLs.': '允许或禁止智能体对特定 URL 执行浏览器操作。',
    'Allow/deny agent browser file downloads from specific sites.': '允许或禁止智能体从特定网站下载文件。',
    'Allow/deny agent command execution outside the sandbox.': '允许或禁止智能体在沙箱外执行特定命令。',
    'Allow/deny agent read access to specific files or directories.': '允许或禁止智能体读取特定文件或目录。',
    'Allow/deny agent read access to specific URLs or domains.': '允许或禁止智能体读取特定 URL 或域名。',
    'Allow/deny agent write access to specific files or directories.': '允许或禁止智能体写入特定文件或目录。',
    'Allow/deny specific terminal commands.': '允许或禁止执行特定终端命令。',
    'Configure allowed and denied paths for file reads and writes.': '配置允许或禁止读写的文件路径。',
    'Configure allowed and denied URLs for reading.': '配置允许或禁止读取的网页 URL。',
    'Configure allowed commands outside the sandbox.': '配置允许在沙箱外执行的命令。',
    'Configure allowed terminal commands.': '配置允许自动执行的终端命令。',
    'Configure default behaviors, skills, and MCP servers.': '配置默认行为、技能和 MCP 服务器。',
    'Configure GitHub access policies.': '配置 GitHub 访问策略。',
    'Configure when follow-up messages are sent.': '配置追问消息的发送时机。',
    'Configures how the agent tries to access files outside of its working folders.': '配置智能体访问工作目录以外文件时的处理策略。',
    'External tools the agent can call via Model Context Protocol.': '智能体可通过模型上下文协议 (MCP) 调用的外部工具。',
    'Replace the default browser right-click menu with quick actions.': '使用快捷操作菜单替换浏览器默认右键菜单。',
    'All active Antigravity shortcuts and user keybinding overrides are managed directly by VS Code.': '所有生效的 Antigravity 快捷键和自定义键位均直接由 VS Code 管理。',
    'Choose between non-colliding VS Code defaults or standalone Antigravity chords.': '在不冲突的 VS Code 默认快捷键或独立 Antigravity 组合键之间选择。',
    'Clear history, cookies and site data from the built-in browser, or manage cookies for each site.': '清除内置浏览器的历史记录、Cookie 和网站数据，或按网站单独管理 Cookie。',
    'Choose what to clear from the built-in browser. It can\'t be undone.': '选择要从内置浏览器清除的数据，此操作不可撤销。',
    'Cookies and other site data': 'Cookie 及其他网站数据',
    'Cookies, site storage and cache. Signs you out of all sites in the built-in browser and reloads its open tabs.': 'Cookie、网站存储与缓存。清除后会退出内置浏览器中所有网站登录并刷新已打开的标签页。',
    'Visited URLs and autocomplete suggestions.': '访问过的网址和地址栏自动补全建议。',
    'Folder where files downloaded in the built-in browser are saved.': '内置浏览器下载文件的默认保存目录。',
    'An agent is using the built-in browser. Clearing its data signs the agent out of sites and may interrupt its task.': '当前有智能体正在使用内置浏览器，清除数据会使其退出网站登录并可能中断任务。',
    'Constrain voice dictation to selected languages in priority order. Leave empty to auto-detect.': '按优先级将语音听写限制在所选语言内；留空则自动检测。',
    'Check that the microphone is unmuted and the right input device is selected.': '请检查麦克风是否未静音并已选择正确的输入设备。',
    'To modify notification settings, open your operating system\'s system preferences.': '要修改通知设置，请打开操作系统的系统偏好设置。',
    'Permanently delete your remote conversations, projects, scheduled tasks, connected plugins and settings. Data in the desktop app and your Google account are not affected.': '永久删除你的远程对话、项目、定时任务、已连接插件及设置。桌面端本地数据与 Google 账号不受影响。',
    'Try out early-stage features before they ship. These may be changed or removed at any time. These features are experimental, and we make no guarantees about performance or functionality.': '抢先体验尚未正式发布的实验性功能。这些功能随时可能变更或下线，不对其性能或稳定性作保证。',
    'Developer-only tools. These settings do not affect other users.': '仅供开发者使用的工具，这些设置不会影响其他用户。',
    'Simulate a different host (Electron, desktop or mobile Web, Extension, remote control, or installed PWA).': '模拟不同的宿主环境（桌面客户端、Web、扩展、远程控制或 PWA）。',
    'Simulate a different user cohort (Google, External, Enterprise).': '模拟不同的用户分组（Google 内部、外部用户、企业用户）。',
    'Simulate running on a different OS.': '模拟在不同的操作系统上运行。',
    'When enabled, the values below replace the auto-detected OS, host, and user type used for feature gating.': '启用后，下方选项将覆盖自动检测的系统、宿主与用户类型（用于特性开关判断）。',
    'Logs each telemetry event to the browser\'s DevTools console as it fires, with the click or key that caused it. Stays on across reloads until you turn it off.': '在每次遥测事件触发时将其及对应操作打印到浏览器开发者控制台，关闭前跨刷新持续生效。',
    'Run the app against a Linux environment. Connecting relaunches the app into the selected WSL distro.': '在 Linux 环境中运行本应用，连接后会重新在所选 WSL 发行版中启动。',
    'The app is currently connected to a WSL distro. Reopening locally relaunches it directly on Windows.': '当前已连接到 WSL 发行版，点击本地重开将直接在 Windows 上重启应用。',
    'The breakdown below shows token usage from customizations like rules, skills, and MCP. If a budget is exceeded, large rules are demoted to path pointers and large customizations are excluded automatically.': '下方明细展示了规则、技能和 MCP 等自定义配置的 Token 占用。超出预算时，大型规则会降级为路径引用，大型扩展将被自动排除。',
    'When enabled, the agent will include default customizations, including default skills.': '启用后，智能体将加载默认自定义扩展（包括内置默认技能）。',
    'Browse and enable plugins from the Build With Google catalog.': '浏览并启用 Build With Google 目录中的插件。',
    'Which workspace the New Conversation button and keyboard shortcut start you in.': '点击新建对话按钮或使用快捷键时默认进入的工作区。',
    'VCS used when creating a new workspace, including workspaces generated based off your initial prompt.': '新建工作区（包括基于首条提示词自动生成的工作区）时使用的版本控制系统。',
    'Select the workspace type that will be used for new conversations started with the New Workspace option.': '选择使用「新建工作区」发起新对话时的默认工作区类型。',
    'Sync newly created JJ worktrees to head when starting a conversation.': '发起对话时将新创建的 JJ 工作树自动同步到最新提交。',
    'Your agent\'s ability to execute commands is also controlled by enterprise security policies.': '智能体执行命令的能力同时受企业安全策略约束。',
    'Your administrator has disabled MCP servers for this workspace.': '管理员已禁用此工作区的 MCP 服务器。',
    'These allowed domain rules are set by your organization\'s administrator and cannot be removed.': '这些域名白名单由你的组织管理员设定，无法移除。',
    'These MCP allowlist rules are enforced by your organization\'s administrator.': '这些 MCP 白名单规则由你的组织管理员强制生效。',
    'Files, folders, and repositories you connect are accessible to your agent in this project, including during background or scheduled runs.': '你连接的文件、文件夹和代码仓库将在本项目中供智能体访问（含后台与定时任务）。',
    'Uploaded files and connected resources are mounted in your cloud environment.': '上传的文件和已连接资源会挂载到你的云端环境中。',
    'Uploaded project files and in-chat attachments are stored on Google servers and mounted into your cloud sandbox so your agent can read and work with them.': '上传的项目文件和聊天附件会存储在 Google 服务器并挂载至云端沙箱，供智能体读取与处理。',
    'Remove individual uploaded files or connected resources in Project Settings, or delete a project or conversation to remove its stored files.': '可在项目设置中移除单个已上传文件或连接资源，或直接删除项目/对话以清除存储文件。',
    'Here\'s how uploaded files, attachments, and connected resources work in your cloud environment': '了解上传文件、附件与已连接资源在云端环境中的工作方式',
    'Give each Best of N fork a full clone of your workspace, including its local commit history. Choosing a winner then gives your workspace that fork\'s state, so the commits it made are kept. Forks take longer to create than the default CitC clone.': '为每个多路优选分支创建完整工作区克隆（含本地提交历史），选定胜出方案后会保留其提交记录，但创建耗时比默认方式更长。',
    'Give each Best of N fork its own clone of your Git repository instead of a copy-on-write overlay. Each fork is then a real repository, so commits it makes are kept when you choose it as the winner. Forks take longer to create, and the wait grows with the size of your repository.': '为每个多路优选分支创建独立完整 Git 仓库克隆而非写时复制层，选定胜出后可保留提交记录，创建耗时会随仓库体积增大而增加。',
    'Hook will only trigger if the tool name matches run_command or view_file.': '仅当工具名称匹配 run_command 或 view_file 时触发钩子。',
    'Hook will only trigger if the tool name matches run_command.': '仅当工具名称匹配 run_command 时触发钩子。',
    'Hook will only trigger if the tool name starts with browser_.': '仅当工具名称以 browser_ 开头时触发钩子。',
    'Hook will trigger if any tool is executed.': '执行任意工具时都会触发钩子。',
    'English': '英语',
    'Chinese (Mandarin)': '中文（普通话）',
    'Cantonese': '粤语',
    'Japanese': '日语',
    'Korean': '韩语',
    'French': '法语',
    'German': '德语',
    'Spanish': '西班牙语',
    'Italian': '意大利语',
    'Portuguese': '葡萄牙语',
    'Russian': '俄语',
    'Arabic': '阿拉伯语',
    'Hindi': '印地语',
    'Indonesian': '印尼语',
    'Thai': '泰语',
    'Vietnamese': '越南语',
    'Turkish': '土耳其语',
    'Dutch': '荷兰语',
    'Polish': '波兰语',
    'Swedish': '瑞典语',
    'Norwegian': '挪威语',
    'Danish': '丹麦语',
    'Finnish': '芬兰语',
    'Czech': '捷克语',
    'Greek': '希腊语',
    'Hebrew': '希伯来语',
    'Romanian': '罗马尼亚语',
    'Ukrainian': '乌克兰语',
    'Directories': '目录',
    'Search workspace files': '搜索工作区文件',
    'Search workspace folders': '搜索工作区文件夹',
    'Search conversations': '搜索历史对话',
    'Docs, Sheets, Slides, and folders': '文档、表格、幻灯片与文件夹',
    'Browse MCP resources': '浏览 MCP 资源',
    'Browse rules': '浏览规则',
    'Attach terminal output': '附加终端输出',
    'Searching…': '正在搜索…',
    'Searching': '正在搜索',
    'to exit': '退出',
    'Workflow': '工作流',
    'Workflows': '工作流',
    'Skill': '技能',
    'Rule': '规则',
    'Plugin': '插件',
    'Hook': '钩子',
    'MCP server': 'MCP 服务器',
    'Slash Commands': '斜杠命令',
    'Slash commands': '斜杠命令',
    'Built-in': '内置',
    'Built-in commands': '内置命令',
    'System commands': '系统命令',
    'MCP Prompts': 'MCP 提示词',
    'Files & Folders': '文件与文件夹',
    'Code Context': '代码上下文',
    'Run a long-running task until the goal is achieved': '持续执行长耗时任务，直到彻底达成目标',
    'Compact or summarize conversation history': '压缩或总结当前对话历史以释放上下文窗口',
    'Schedule a recurring or one-time instruction': '设置定时循环任务或一次性倒计时提醒',
    'Browse, search, or interact with web pages': '浏览网页、搜索信息或操作 Web 应用',
    'Plan a complex task step-by-step before execution': '执行前先对复杂任务进行逐步拆解与规划',
    'Interview me to resolve design decisions': '通过交互式追问帮你理清并敲定设计方案',
    'Coordinate a team of autonomous agents': '组织多智能体团队并行协作完成大型任务',
    'Persist a correction or setup for future tasks': '将本次纠错或复杂配置沉淀为长期记忆规则',
    'Deep thinking, planning, and rigorous verification': '开启深度思考、多视角规划与严格验证模式',
    'Change how the agy-powerline statusline looks, with its theme, preset, layout, cap style and gradient commands, or save and load its config. Use when the user asks to change, restyle, simplify or share their agy-powerline bar.': '自定义 agy-powerline 状态栏外观（主题、预设、布局、渐变等）及保存/加载配置。',
    'Install or update the agy-powerline statusline and wire it into agy\'s settings. Use when the user asks to set up, install, update, fix or check agy-powerline.': '安装、更新、检查或修复 agy-powerline 状态栏并写入 agy 配置。'
  };

  function translateDuration(dur) {
    if (!dur) return dur;
    return String(dur)
      .replace(/(\d+)\s*d(?:ays?)?\b/gi, '$1 天')
      .replace(/(\d+)\s*h(?:ours?|rs?)?\b/gi, '$1 小时')
      .replace(/(\d+)\s*m(?:ins?|inutes?)?\b/gi, '$1 分钟')
      .replace(/(\d+)\s*s(?:ecs?|econds?)?\b/gi, '$1 秒')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function translateInlineValue(val) {
    const t = String(val || '').trim();
    return EXACT_MAP[t] || t;
  }

  // ==================== 动态模板正则规则 ====================
  const REGEX_RULES = [
    // 欢迎语
    [/^Hey (.+), what should we build today\?$/, (_, name) => `你好 ${name}，今天想做点什么？`],
    [/^Hey there, what should we build today\?$/, () => '你好，今天想做点什么？'],
    [/^Welcome back, (.+)\. Where should we pick up\?$/, (_, name) => `欢迎回来，${name}。我们从哪里继续？`],
    [/^Welcome back\. Where should we pick up\?$/, () => '欢迎回来。我们从哪里继续？'],
    [/^Good to see you, (.+)\. What's next\?$/, (_, name) => `很高兴见到你，${name}。接下来做什么？`],
    [/^Good to see you\. What's next\?$/, () => '很高兴见到你。接下来做什么？'],
    [/^Hey (.+)!$/, (_, name) => `你好，${name}！`],

    // 选择器与账号 aria-label
    [/^Select project, current: (.+)$/, (_, p) => `选择项目，当前：${translateInlineValue(p)}`],
    [/^Select model, current: (.+)$/, (_, m) => `选择模型，当前：${m}`],
    [/^Model: (.+)$/, (_, m) => `模型：${m}`],
    [/^Branch, current: (.+)$/, (_, b) => `分支，当前：${b}`],
    [/^Google Account: (.+)$/, (_, a) => `Google 账号：${a}`],

    // 相对时间与重置倒计时
    [/^(\d+)\s*s ago$/, (_, n) => `${n} 秒前`],
    [/^(\d+)\s*m ago$/, (_, n) => `${n} 分钟前`],
    [/^(\d+)\s*h ago$/, (_, n) => `${n} 小时前`],
    [/^(\d+)\s*d ago$/, (_, n) => `${n} 天前`],
    [/^(\d+)\s*w ago$/, (_, n) => `${n} 周前`],
    [/^(\d+)\s*mo ago$/, (_, n) => `${n} 个月前`],
    [/^(\d+)\s*y ago$/, (_, n) => `${n} 年前`],
    [/^Resets? in <1m$/i, () => '不到 1 分钟后重置'],
    [/^Resets? in (.+)$/i, (_, dur) => `将于 ${translateDuration(dur)} 后重置`],
    [/^(\d+) seconds?$/i, (_, n) => `${n} 秒`],
    [/^(\d+) minutes?$/i, (_, n) => `${n} 分钟`],
    [/^(\d+) hours?$/i, (_, n) => `${n} 小时`],
    [/^(\d+) days?$/i, (_, n) => `${n} 天`],

    // 智能体执行步骤与状态
    [/^Thought for (.+)$/, (_, dur) => `已思考 ${translateDuration(dur)}`],
    [/^Worked for (.+?)\s*·\s*(\d+)\s*updates?$/, (_, dur, cnt) => `已执行 ${translateDuration(dur)} · ${cnt} 次更新`],
    [/^Worked for (.+)$/, (_, dur) => `已执行 ${translateDuration(dur)}`],
    [/^Ran command:\s*(.+)$/, (_, cmd) => `已运行命令：${cmd}`],
    [/^Ran command$/, () => '已运行命令'],
    [/^Running command:\s*(.+)$/, (_, cmd) => `正在运行命令：${cmd}`],
    [/^Running command$/, () => '正在运行命令'],
    [/^Edited (.+)$/, (_, f) => `已编辑 ${f}`],
    [/^Created (.+)$/, (_, f) => `已创建 ${f}`],
    [/^Deleted (.+)$/, (_, f) => `已删除 ${f}`],
    [/^Read URL:\s*(.+)$/, (_, u) => `已读取网页：${u}`],
    [/^Read URL$/, () => '已读取网页'],
    [/^Read resource:\s*$/, () => '已读取资源：'],
    [/^Searched for "(.+)"$/, (_, q) => `已搜索 "${q}"`],
    [/^Searched for files:\s*(.+)$/, (_, pat) => `已搜索文件：${pat}`],
    [/^Searched files$/, () => '已搜索文件'],
    [/^Searched web:\s*"(.+)"$/, (_, q) => `已搜索网页："${q}"`],
    [/^Searched web$/, () => '已搜索网页'],
    [/^Listed directory (.+)$/, (_, d) => `已列出目录 ${d}`],
    [/^Analyzed Task Log$/, () => '已分析任务日志'],
    [/^Analyzing Task Log$/, () => '正在分析任务日志'],
    [/^Analyzed content$/, () => '已分析内容'],
    [/^Analyzing content$/, () => '正在分析内容'],
    [/^Messaging (.+)$/, (_, role) => `正在向 ${role} 发送消息`],
    [/^Messaged (.+)$/, (_, role) => `已向 ${role} 发送消息`],

    // 方案、额度、计数与常规反馈
    [/^Your plan:\s*(.+)$/, (_, p) => `当前方案：${p}`],
    [/^Available AI credits:\s*(.+)$/, (_, c) => `可用 AI 额度：${c}`],
    [/^(\d+) lines? added, (\d+) lines? removed$/, (_, a, d) => `新增 ${a} 行，删除 ${d} 行`],
    [/^(\d+) comments?$/, (_, n) => `${n} 条评论`],
    [/^\+(\d+) more$/, (_, n) => `还有 ${n} 项`],
    [/^(\d+) files? changed$/, (_, n) => `${n} 个文件已更改`],
    [/^Connected to (.+)$/, (_, target) => `已连接到 ${target}`],
    [/^Couldn't connect to (.+)$/, (_, target) => `无法连接到 ${target}`],
    [/^Go to page (\d+)$/, (_, n) => `跳转到第 ${n} 页`],
    [/^Go to slide (\d+)$/, (_, n) => `跳转到第 ${n} 张`],
    [/^Resume (\d+) comment drafts?$/, (_, n) => `恢复 ${n} 条评论草稿`],
    [/^(.+) \(Remote\)$/, (_, label) => `${translateInlineValue(label)}（远程）`],
    [/^(.+) \(experimental\)$/, (_, label) => `${translateInlineValue(label)}（实验性）`],
    [/^(.+) \(required\)$/, (_, label) => `${translateInlineValue(label)}（必填）`],
    [/^Failed to save (.+?):\s*(.+)$/, (_, item, err) => `保存 ${item} 失败：${err}`],
    [/^Failed to delete "(.+)"\.?$/, (_, item) => `删除 "${item}" 失败`],
    [/^Deleted "(.+)"\.?$/, (_, item) => `已删除 "${item}"`],
    [/^Enabled "(.+)"\.?$/, (_, item) => `已启用 "${item}"`],
    [/^Created automation "(.+)"\.?$/, (_, item) => `已创建自动化任务 "${item}"`],

    // 站点数据、处理器与组合菜单补充动态规则
    [/^(\d+)\s+on$/, (_, n) => `${n} 个已开启`],
    [/^No sites match "(.+)"\.?$/, (_, q) => `没有匹配 "${q}" 的网站`],
    [/^Clearing cookies and site data for (.+)$/, (_, s) => `正在清除 ${s} 的 Cookie 和网站数据`],
    [/^Site data cleared for (.+)$/, (_, s) => `已清除 ${s} 的网站数据`],
    [/^Couldn't delete cookies for (.+)$/, (_, s) => `无法删除 ${s} 的 Cookie`],
    [/^Could not clear site data for (.+)$/, (_, s) => `无法清除 ${s} 的网站数据`],
    [/^Add New Handler to (.+)$/, (_, h) => `为 ${h} 添加新处理器`],
    [/^No handlers configured for (.+)$/, (_, h) => `尚未为 ${h} 配置处理器`],
    [/^Handler #(\d+)$/, (_, n) => `处理器 #${n}`],
    [/^Select all in (.+)$/, (_, s) => `全选 ${s} 中的项`],
    [/^Modified in (.+)$/, (_, s) => `修改于 ${s}`],
    [/^Switch to (.+)$/, (_, s) => `切换到 ${s}`]
  ];

  // ==================== 翻译引擎核心 ====================
  const textStore = new WeakMap();
  const attrStore = new WeakMap();

  let isEnabled = GM_getValue(STORAGE_ENABLED_KEY, true);
  let scanScheduled = false;
  let toastTimer = null;

  function translateText(raw) {
    if (typeof raw !== 'string' || !raw) return null;
    const match = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return null;
    const [, lead, core, tail] = match;
    if (!core || core.length > 600) return null;
    if (!/[A-Za-z]/.test(core)) return null;

    const normalized = core.replace(/\r\n/g, '\n');
    if (Object.prototype.hasOwnProperty.call(EXACT_MAP, normalized)) {
      const zh = EXACT_MAP[normalized];
      return lead + zh + tail;
    }
    for (let i = 0; i < REGEX_RULES.length; i++) {
      const [re, formatter] = REGEX_RULES[i];
      const m = normalized.match(re);
      if (m) {
        const zh = formatter(...m);
        if (zh && zh !== normalized) {
          return lead + zh + tail;
        }
      }
    }
    return null;
  }

  function isProtectedElement(el) {
    if (!el || el.nodeType !== 1) return false;
    return Boolean(el.closest && el.closest(TEXT_PROTECTED_SELECTOR));
  }

  function isProtectedTextNode(node, trimmedCore) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest && parent.closest(TEXT_PROTECTED_SELECTOR)) return true;

    // 保护用户自定义项目名称，不覆盖其原名（系统占位名称除外）
    const projHeader = parent.closest && parent.closest('[data-project-label]');
    if (projHeader) {
      const projLabel = (projHeader.getAttribute('data-project-label') || '').trim();
      if (projLabel && trimmedCore === projLabel && !SYSTEM_PROJECT_LABELS.has(projLabel)) {
        return true;
      }
    }
    return false;
  }

  function isProtectedAttrElement(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.matches && el.matches(ATTR_SELF_PROTECTED_SELECTOR)) return true;
    if (el.closest && el.closest(PROTECTED_CONTAINER_SELECTOR)) return true;
    return false;
  }

  function processTextNode(node) {
    if (!node || node.nodeType !== 3) return;
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;

    const tracked = textStore.get(node);
    if (!isEnabled) {
      if (tracked && raw === tracked.translated) {
        node.nodeValue = tracked.orig;
      }
      return;
    }

    if (tracked && raw === tracked.translated) {
      return;
    }

    const core = raw.trim();
    if (isProtectedTextNode(node, core)) {
      return;
    }

    const translated = translateText(raw);
    if (translated && translated !== raw) {
      textStore.set(node, { orig: raw, translated });
      node.nodeValue = translated;
    } else if (tracked) {
      // React 将文本改为了新的无需翻译字符串，清除旧缓存
      textStore.delete(node);
    }
  }

  function processElementAttrs(el) {
    if (!el || el.nodeType !== 1) return;
    if (isProtectedAttrElement(el)) return;

    let map = attrStore.get(el);
    for (let i = 0; i < ATTRS_TO_TRANSLATE.length; i++) {
      const attr = ATTRS_TO_TRANSLATE[i];
      if (!el.hasAttribute(attr)) continue;
      const raw = el.getAttribute(attr);
      if (!raw || !raw.trim()) continue;

      const rec = map && map.get(attr);
      if (!isEnabled) {
        if (rec && raw === rec.translated) {
          el.setAttribute(attr, rec.orig);
        }
        continue;
      }

      if (rec && raw === rec.translated) {
        continue;
      }

      const translated = translateText(raw);
      if (translated && translated !== raw) {
        if (!map) {
          map = new Map();
          attrStore.set(el, map);
        }
        map.set(attr, { orig: raw, translated });
        el.setAttribute(attr, translated);
      } else if (rec && map) {
        map.delete(attr);
      }
    }
  }

  function walkSubtree(root) {
    if (!root) return;
    if (root.nodeType === 3) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== 1) return;

    processElementAttrs(root);

    const elemWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = elemWalker.nextNode())) {
      processElementAttrs(el);
    }

    const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = textWalker.nextNode())) {
      processTextNode(tn);
    }
  }

  function scanDocument() {
    if (document.body) {
      walkSubtree(document.body);
    }
  }

  function scheduleScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    const raf = window.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
    raf(function () {
      scanScheduled = false;
      scanDocument();
    });
  }

  // ==================== Toast 与提示 ====================
  function showToast(msg) {
    if (!IS_TOP || !document.body) return;
    let el = document.getElementById('agy-zh-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'agy-zh-toast';
      el.setAttribute('translate', 'no');
      Object.assign(el.style, {
        position: 'fixed',
        right: '20px',
        bottom: '20px',
        zIndex: '2147483647',
        padding: '10px 14px',
        borderRadius: '10px',
        background: 'rgba(24, 24, 27, 0.92)',
        color: '#f4f4f5',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        fontSize: '13px',
        lineHeight: '1.4',
        fontFamily: 'system-ui, -apple-system, "Microsoft YaHei", sans-serif',
        pointerEvents: 'none',
        transition: 'opacity 0.2s ease'
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (el) el.style.opacity = '0';
    }, 3200);
  }

  // ==================== 未汉化词条采集器 ====================
  function shouldIgnoreCollectedString(str, elForText) {
    if (!str || str.length < 2 || str.length > 140) return true;
    if (/[\u4e00-\u9fff]/.test(str)) return true; // 已含中文
    if (!/[A-Za-z]{2,}/.test(str)) return true; // 无英文单词
    if (/^(https?:|mailto:|data:|blob:|file:|chrome:|\/|\.\/|\.\.\/|[A-Za-z]:\\)/.test(str)) return true;
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(str)) return true; // 邮箱
    if (/^[0-9a-f]{7,64}(-[0-9a-f]{4,})*$/i.test(str)) return true; // SHA / UUID
    if (/^[\d\s.,:%+-]+$/.test(str)) return true;
    if (/^[^\s]+\.[a-z0-9]{1,5}$/i.test(str) && !/\s/.test(str)) return true; // 单一文件名
    if (elForText && isProtectedTextNode(elForText, str)) return true;
    return false;
  }

  function collectUntranslated() {
    const found = new Set();
    if (!document.body) return [];

    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = tw.nextNode())) {
      const raw = tn.nodeValue;
      if (!raw) continue;
      const trimmed = raw.trim();
      const tracked = textStore.get(tn);
      if (tracked && raw === tracked.translated) continue;
      if (shouldIgnoreCollectedString(trimmed, tn)) continue;
      found.add(trimmed);
    }

    const ew = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = ew.nextNode())) {
      if (isProtectedAttrElement(el)) continue;
      const map = attrStore.get(el);
      for (let i = 0; i < ATTRS_TO_TRANSLATE.length; i++) {
        const attr = ATTRS_TO_TRANSLATE[i];
        const val = el.getAttribute(attr);
        if (!val) continue;
        const trimmed = val.trim();
        const rec = map && map.get(attr);
        if (rec && val === rec.translated) continue;
        if (shouldIgnoreCollectedString(trimmed, null)) continue;
        found.add(trimmed);
      }
    }

    return Array.from(found).sort((a, b) => a.localeCompare(b));
  }

  // ==================== 跨 Frame 通信与状态同步 ====================
  const pendingCollectRequests = new Map();

  function setupMessaging() {
    window.addEventListener('message', function (event) {
      const data = event && event.data;
      if (!data || typeof data.type !== 'string') return;

      if (data.type === 'AGY_ZH_RESCAN') {
        scanDocument();
        return;
      }

      if (data.type === 'AGY_ZH_COLLECT_REQ' && data.requestId) {
        const items = collectUntranslated();
        try {
          event.source &&
            event.source.postMessage(
              {
                type: 'AGY_ZH_COLLECT_RES',
                requestId: data.requestId,
                origin: window.location.origin,
                items
              },
              '*'
            );
        } catch (_) {}
        return;
      }

      if (IS_TOP && data.type === 'AGY_ZH_COLLECT_RES' && data.requestId) {
        const bucket = pendingCollectRequests.get(data.requestId);
        if (bucket && Array.isArray(data.items)) {
          for (const item of data.items) bucket.set.add(item);
        }
        return;
      }

      if (IS_TOP && data.type === 'AGY_ZH_COLLECT_PUSH' && Array.isArray(data.items)) {
        const merged = new Set(collectUntranslated());
        for (const item of data.items) merged.add(item);
        finalizeCollectedItems(merged);
        return;
      }
    });

    if (typeof GM_addValueChangeListener === 'function') {
      GM_addValueChangeListener(STORAGE_ENABLED_KEY, function (_name, _oldVal, newVal) {
        isEnabled = Boolean(newVal);
        scanDocument();
      });
    }
  }

  function finalizeCollectedItems(merged) {
    const result = Array.from(merged).sort((a, b) => a.localeCompare(b));
    const payload = result.join('\n');
    console.log('[Antigravity 汉化包] 采集到未汉化词条 (' + result.length + ' 条):\n' + payload);
    if (typeof GM_setClipboard === 'function') {
      try {
        GM_setClipboard(payload, 'text');
      } catch (_) {}
    } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        navigator.clipboard.writeText(payload).catch(function () {});
      } catch (_) {}
    }
    showToast(`已采集 ${result.length} 条未汉化词条并复制到剪贴板（控制台也可查看）`);
  }

  function setupHotkey() {
    window.addEventListener(
      'keydown',
      function (e) {
        if (!e || e.repeat) return;
        const isC = e.key === 'C' || e.key === 'c' || e.code === 'KeyC';
        if (!(e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && isC)) return;
        e.preventDefault();
        if (IS_TOP) {
          triggerCrossFrameCollect();
          return;
        }
        const items = collectUntranslated();
        const payload = items.slice().sort((a, b) => a.localeCompare(b)).join('\n');
        if (typeof GM_setClipboard === 'function') {
          try {
            GM_setClipboard(payload, 'text');
          } catch (_) {}
        }
        try {
          if (window.top && window.top !== window) {
            window.top.postMessage(
              { type: 'AGY_ZH_COLLECT_PUSH', origin: window.location.origin, items },
              '*'
            );
          }
        } catch (_) {}
      },
      true
    );
  }

  function triggerCrossFrameCollect() {
    const requestId = 'agy_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const merged = new Set(collectUntranslated());
    pendingCollectRequests.set(requestId, { set: merged });

    const frames = document.querySelectorAll('iframe');
    for (let i = 0; i < frames.length; i++) {
      try {
        frames[i].contentWindow &&
          frames[i].contentWindow.postMessage({ type: 'AGY_ZH_COLLECT_REQ', requestId }, '*');
      } catch (_) {}
    }

    setTimeout(function () {
      pendingCollectRequests.delete(requestId);
      finalizeCollectedItems(merged);
    }, 280);
  }

  function triggerCrossFrameRescan() {
    scanDocument();
    const frames = document.querySelectorAll('iframe');
    for (let i = 0; i < frames.length; i++) {
      try {
        frames[i].contentWindow &&
          frames[i].contentWindow.postMessage({ type: 'AGY_ZH_RESCAN' }, '*');
      } catch (_) {}
    }
  }

  // ==================== 菜单与 DOM 监听初始化 ====================
  function registerMenus() {
    if (!IS_TOP || typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand('切换中 / 英文界面（开关汉化）', function () {
      isEnabled = !isEnabled;
      GM_setValue(STORAGE_ENABLED_KEY, isEnabled);
      scanDocument();
      triggerCrossFrameRescan();
      showToast(isEnabled ? '已开启 Antigravity 汉化' : '已切换为英文原版');
    });

    GM_registerMenuCommand('采集当前页未汉化 UI 词条（复制到剪贴板）', function () {
      triggerCrossFrameCollect();
    });

    GM_registerMenuCommand('立即重新扫描并应用汉化', function () {
      triggerCrossFrameRescan();
      showToast('已重新扫描并应用汉化');
    });
  }

  function startObserver() {
    const target = document.documentElement || document.body;
    if (!target || typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver(function () {
      scheduleScan();
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS_TO_TRANSLATE
    });
  }

  // 暴露只读调试辅助接口，方便排查与扩展
  window.__AGY_ZH_DEBUG__ = {
    translateText,
    isProtectedElement,
    collectUntranslated,
    rescan: scanDocument,
    exactCount: Object.keys(EXACT_MAP).length,
    regexCount: REGEX_RULES.length
  };

  setupMessaging();
  setupHotkey();
  registerMenus();
  scanDocument();
  startObserver();
})();
