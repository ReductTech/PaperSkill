# 浏览器与工程验收

日期：2026-10-07。交付状态：**READY_WITH_WARNINGS**。网站验收通过；论文复现与作者文字歧义保留为明确边界。

## 实际运行

- npm install：完成，依赖审计 0 vulnerabilities（本次安装输出）。
- npm run dev：Vite 8.3.2，在 127.0.0.1:5173 启动。
- npm run typecheck：通过。
- npm run build：通过。第三方 lucide-react 的两个 `use client` 指令有非阻断构建提示；本项目是客户端 SPA，不涉及服务端组件边界。
- Playwright 驱动系统 Microsoft Edge，实际操作全部 17 章与 Final 五题。没有用预写 localStorage 代替渐进解锁验收。
- 浏览器脚本错误 0；测试期间 HTTP 4xx/5xx 0。

## 功能检查

| 检查 | 结果 |
|---|---|
| 首页按钮进入 S1 并聚焦标题 | PASS |
| 初始仅首页与 S1、下一章锁定 | PASS |
| 全部章节核心交互完成后解锁 | PASS |
| Fixed vs Adaptive 三方案 | PASS |
| 状态—策略—动作—反馈四环 | PASS |
| 模块浏览与 Policy 两分支 | PASS |
| Reward 键盘滑块与候选收益 | PASS |
| Table 4 五成本设置、图表更新 | PASS |
| Pipeline 5步执行、2步预算、结束禁用 | PASS |
| 训练流程、比较、实验、结果三面板 | PASS |
| Fig.5 子集/路线数值与原图库 | PASS |
| Final 错误反馈、修正、5题全对 | PASS |
| Review 按钮与“继续复习”文案 | PASS |
| 刷新后进度、Final完成状态保留 | PASS |
| Reset 后仅 S1、刷新后仍保持重置 | PASS |
| 直接访问锁定 hash 不显示后续章节 | PASS |
| Mobile 菜单、Esc关闭、焦点返回 | PASS |
| Mobile Tab / Shift+Tab 对话框焦点约束 | PASS |
| localStorage 被禁用后仍可开始学习 | PASS |
| reduced-motion 模式操作完整 | PASS |

验收中修复：菜单在隐藏时尝试恢复焦点、刷新后 Final 显示空答案、同页 hash 改变未守卫。这些修复后重新跑过完整主流程。

## 响应式

| 视口宽度 | 文档实际宽度 | 结果 |
|---|---|---|
| 1440 | 1440 | 无横向溢出 |
| 1280 | 1280 | 无横向溢出 |
| 1024 | 1024 | 无横向溢出，移动导航 |
| 768 | 768 | 无横向溢出 |
| 430 | 430 | 无横向溢出 |
| 375 | 375 | 无横向溢出 |

每个宽度都检查整篇已解锁内容；表格为明确标注、可聚焦的独立横向滚动区域。移动端图像对照纵向排列、pipeline 自动换行、reward 候选纵向排列，避免通过裁掉整个正文来隐藏溢出。

实际查看了 Hero、固定对照、Reward、Simulator、实验结果、Final 桌面和移动截图，并查看了移动 viewport 截图，区分长元素截图中的固定工具栏截图伪影与真实页面布局。原图均有替代文本与放大入口。

## 系列视觉对照

用只读 HTTP 服务打开本机 V* 的现有 dist，并实际截图 / 读取 computed styles，与本项目在同样 1440px 视口对照：

- 页面背景 #eef2f7、深蓝 #27446e、橙色 #f07e47、边框 #d7deea：一致。
- 字体栈、内容宽度 token 1120px、24/18/12/8 圆角系列：一致。
- Hero 白底、24px 圆角与 `0 12px 34px rgba(25,42,70,.08)` 阴影：一致。
- 固定侧栏宽度 260px：一致。
- 浅灰交互头、胶囊按钮、章节蓝色提示、移动菜单与 Final 纸张卡片：沿用同一体系。
- AdaptiveISP 的故事与实验室独立实现；Hero 因标题和流程内容重新排版，非像素级克隆。

InSpatio 公网页面首次抓取未成功，因此视觉直接验收基线是本机成熟 V* 页面，加上已读取的 Vista4D 样式。没有声称逐个检查了其他全部项目的渲染。

## 证据文件

- `.research/qa/report.json`：主流程、六宽度、错误计数。
- `.research/qa/visual-comparison.json`：V* 与本项目的实际 computed styles、焦点检查。
- `.research/qa/*.png`：桌面/移动截图。仅用作工程验收，不是论文实验图。
- `scripts/qa.cjs`、`scripts/visual-check.cjs`：验收脚本。

## 保留的限制

UNVERIFIED：未运行官方 Python 模型、训练和数据集评测；未验证真实端侧延迟或能耗。官方仓库经在线源文件静态核查，克隆失败，未锁定 commit。AUTHOR_INPUT_NEEDED：若必须解释论文内部不一致，需原作者澄清；不影响本教程使用表中实值。

无既有项目写入、无 git commit、无 push、无 PR、无 PaperSkill import。
