# PaperSkill 项目复用 InSpatio-World 页面规范

> 将本文件放进新的 PaperSkill 论文网页项目时，按此规范实现**固定页面骨架与视觉组件**。论文内容、教学案例、图表和交互机制必须依据新论文本身重新制作。本文总结了 V* 项目中多轮迁移、纠偏和冻结后的要求；它是一份可执行的迁移说明，而不是 V* 论文内容模板。

## 1. 唯一目标与参考来源

目标是让不同论文教程看起来使用**同一套 PaperSkill 组件**，只替换论文相关内容。对于固定 UI，要求复制参考源码中实际使用的组件、DOM/JSX 结构、CSS class、样式和行为；不能凭截图重新画一个“类似版本”，也不能擅自优化、简化或换实现。

- [InSpatio-World 参考页面](https://reducttech.github.io/PaperSkill/papers/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816/)
- [InSpatio-World 公开源码目录](https://github.com/ReductTech/PaperSkill/tree/a94f6089b9c0b7a83947e854a5014403ca3975e1/html_output/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816)
- 固定参考版本：`a94f6089b9c0b7a83947e854a5014403ca3975e1`。V* 项目在 2026-10-03 保存了该版本的来源清单和源码快照。开始新项目时先锁定来源版本、记录文件路径和提交号，再移植。

V* 项目后期曾以本机 `E:\vista4d_web` 中已经对齐的章节骨架作为直接复制来源，包括 `SectionHeading`、`FlowMini`、`ChapterBridge`、`LearningModule` 及对应 CSS。这个路径只是当时的本机参考，不是新项目的依赖；新项目应优先以公开 InSpatio 源码和已验收的实际组件为准。**不要把 V* 项目后来叠加的专属教学交互误认成 InSpatio 原始组件。**

## 2. 固定 UI 与论文内容的边界

| 固定 PaperSkill UI：复制并在验收后冻结 | 新论文内容：替换或重新设计 |
|---|---|
| 页面背景、内容宽度、字体、色板、设计 tokens、间距、圆角、阴影、按钮和焦点样式 | 论文标题、作者、会议、关键词、摘要式核心问题、外链 |
| Hero 基础结构与传统方法/本文方法双栏容器 | 双栏里的图像、动画、场景、方法流程和说明 |
| Sidebar、当前章高亮、折叠、移动端抽屉、底部上一章/下一章栏 | 章节数量、章节标题与导航目的地 |
| 章节标题、`§` 编号、难度标签、章节进度、本节作用、subsection 外壳与标题条 | “本节作用”文字、各小节正文、论文图、实验台、结论与限制 |
| 渐进学习入口、继续学习、复习/重置的公共交互框架 | 解锁章节时实际呈现的论文知识和章节专属状态 |

允许把参考的 10 章适配成新论文的实际章数，但不能因此重画进度条、Sidebar 或导航。允许替换文字、链接与内容数据，但固定组件的布局、class、色彩、字号、间距和状态视觉保持一致。论文内容如果与固定壳冲突，应调整内容组织或局部内容组件，而不是修改公共骨架。

## 3. 必须复用的页面结构

### 3.1 Landing / Hero

保留居中的浅色论文型 Hero：`INTERACTIVE TUTORIAL` 标识、完整英文论文标题、中文标题/说明、简短核心问题或洞见、元信息/关键词、论文/PDF/代码链接、传统方法与本文方法双栏对照，以及显著的“开始学习 §1”入口。首页首先让读者通过画面理解论文的核心差别，避免用大量静态文字淹没双栏演示。

双栏容器的对齐、尺寸、边框、标签和响应式行为来自参考组件；画面与动画必须根据新论文重做。V* 项目里的“杯子”“Passive MLLM vs V*”及其教学场景仅属于 V*，不能原样搬到其他论文。首页若有用户指定的截图、替换图或删除区域，以该项目的具体要求为准，不把这些一次性要求扩展成所有项目的通则。

### 3.2 侧边栏与底部导航

直接读取参考 `PptBars.tsx` 和 `ppt-mode.css` 的 `.slide-*` 结构。侧边栏包含顶部教程标识和论文标题、`§` 章节列表、当前章深蓝高亮、折叠控件；移动端使用抽屉、遮罩和目录按钮。参考侧边栏宽度为 **288px**，不能因截图显示缩放而误改几何尺寸。底部固定栏保留“上一章 / 当前章节位置 / 下一章”，主内容和底栏要与侧边栏展开/折叠状态对齐。

需要保留真实导航行为：点击章节到达对应内容；渐进解锁状态与可访问状态一致；移动端打开时焦点留在抽屉中，`Esc` 可关闭，关闭后焦点返回菜单按钮；隐藏的导航不可被键盘误聚焦。不能只复制视觉却丢掉操作。

### 3.3 每章固定骨架

一章的顺序是：

```text
§N. 章节标题 + 难度标签
§1 → §2 → … → §N 的章节进度
“本节作用”提示卡
N.1 / N.2 / … 正文模块与交互
章节收束、继续学习入口
底部固定上一章 / 当前进度 / 下一章导航
```

章节标题使用参考 `chap-title`、`.num`、`.badge-tag`；进度使用 `FlowMini` 对应的 `.flow-mini`、`.flow-step`、`.flow-arrow`；“本节作用”使用 `ChapterBridge` 对应的 `.chap-bridge`、`.cb-icon`、`.cb-body`、`.cb-title`、`.cb-text`；小节使用参考 `Module` 或已验收的同系 `LearningModule` 外壳、编号和标题条。`本节作用`放在正文模块之前，不能省略，也不能用自制的普通段落顶替。

章节标题旁不要另加 `chapter-question`、`chapter-thesis`、`chapter-source` 等 V* 重构时曾出现的自定义固定元素。章节问题融入标题即可；takeaway 放在合适的正文节点；Figure、Algorithm、Table 依据应贴近对应内容，而不是挂成每章统一装饰。不要再新增另一套顶部导航、徽章或说明卡。

### 3.4 渐进学习、复习与重置

首页点“开始学习 §1”后揭示第一章；每章通过固定继续入口揭示下一章。Sidebar、章节进度和底栏都应映射同一份章节状态。新项目如果实现 Review / Reset，要让复习回看与重新开始的语义明确、状态一致；不能用纯视觉按钮冒充已经实现的功能。是否存在独立 Review Mode 或评分 Quiz，取决于新项目的明确需求，不能仅凭视觉迁移报告推定参考站自带这些功能。

## 4. 视觉系统：从源码取值，不凭印象调色

V* 项目已核对过的参考设计值如下。移植时仍应以锁定版本的源文件为准，避免项目里的后续覆盖样式污染基线。

| 项目 | 参考值或规则 |
|---|---|
| 页面与卡片 | 灰蓝页面 `#eef2f7`、顶部浅色 `#f7f9fc`、白色卡片 `#fff`、浅蓝辅助底 `#eef3fb` |
| 文字与边框 | 主文字 `#21324a`、次文字 `#68778f`、边框 `#d7deea`、强调边框 `#9fb0c8` |
| 语义色 | 深蓝 `#27446e` 用于引导和当前态；橙 `#f07e47` 用于行动；绿 `#228d5c` 用于成功；红 `#c43f52` 用于失败；紫色用于辅助语义 |
| 字族 | 正文 `Segoe UI / PingFang SC / Hiragino Sans GB / Arial`；代码与编号可用 `Cascadia Code / SFMono / Consolas`；`§` 数字使用参考的 Georgia 处理 |
| 字号 | Hero 约 54px/900；章节约 30px/800；模块标题约 18px/800；正文约 18px；解释约 16px；徽标和注释约 13–15px |
| 几何 | 主内容约 1120px；章节内边距约 32px；模块 header 约 `14px 20px`、body 约 `18px 22px 22px`；圆角采用 24/18/12/8/胶囊层级 |
| 阴影与动效 | 柔和阴影 `0 12px 34px rgba(25,42,70,.08)`；过渡约 160/280/480ms；支持 `prefers-reduced-motion` |
| 键盘焦点 | 可见的约 3px 深蓝半透明轮廓和 3px offset；不能用 `outline: none` 抹掉焦点 |

一页的视觉层级应是：**灰蓝页面 → 白色 Hero/Chapter → 浅灰标题条的 Module → 模块内的场景、控件与反馈**。不要把通用 UI 做成大面积深色 dashboard、巨型品牌字或密集小字号信息墙。颜色承担稳定语义：蓝色引导，橙色当前行动，绿色完成，红色错误/失败；基线或未激活状态用中性色。

## 5. 源码对照清单

在参考仓库锁定版本中逐个打开这些文件，确认实际 JSX、class 和 CSS。只复制需要的固定框架，保留来源记录：

| 部位 | 参考源码 |
|---|---|
| 全局 tokens、颜色、字族、动效 | `src/styles/tokens.css` |
| Hero、Chapter、Module、按钮等基础样式 | `src/styles/components.css`、`src/styles/paper.css` |
| 侧边栏与底部导航 | `src/components/PptBars.tsx`、`src/styles/ppt-mode.css` |
| 论文型首页与双栏容器 | `src/components/Hero.tsx`、`src/modules/hero-new.tsx` |
| 章节顺序、进度、渐进揭示 | `src/App.tsx`、`src/components/FlowMini.tsx`、`src/lib/useProgressiveChapters.ts` |
| “本节作用”、正文模块 | `src/components/ChapterBridge.tsx`、`src/components/Module.tsx` |

V* 项目中的对应落点可用于排查移植过程：`src/components/TutorialSidebar.tsx`、`src/styles/inspatio-sidebar.css`、`src/components/PaperSkillChapter.tsx`、`src/components/LearningModule.tsx`、`src/styles/vista4d-chapter.css`、`src/styles/paper-tokens.css`、`src/styles/paper-skill-frame.css`。其中 Vista4D 来源的组件是本项目后期纠偏采用的已验收骨架；`src/components/S1…S6`、Hero 演示和 V* 科学内容是论文专属内容。

## 6. 新项目执行顺序

1. **保存基线**：检查现有 Git 状态、源码、页面与功能，记录不能丢失的论文内容和用户已有修改；不要覆盖未提交工作。
2. **锁定参考**：读取公开源码，列出准备复用的组件、DOM/class、CSS、tokens、来源提交；截取 Landing、普通章节、Sidebar、底栏的参考画面。
3. **先移植固定壳**：Hero、Sidebar、Chapter Header、Progress、Difficulty Badge、本节作用、subsection、底栏、按钮和全局样式。章节数与文字用数据适配。
4. **再填论文内容**：为新论文设计问题链、章节职责、图像、演示、实验台、结果、局限和收束。科学事实逐项核对原论文；教学示意明确标注，不能伪装成论文原始图或实测数值。
5. **逐页冻结**：某个固定组件经源码和浏览器对照验收后，将其视作公共基础。后续只优化指定章节正文内部；确需改公共组件时先说明影响范围，并全站回归。
6. **实际浏览器验收**：用相同视口并排打开参考页与新页，对照截图；明显不同就继续修正，不在“风格相近”时停止。然后检查构建、导航、关键交互、键盘、移动端、窄屏溢出和 reduced motion。

## 7. 验收标准

- Landing：标题层级、元信息、双栏尺寸与标签、开始入口与参考同一组件体系；两栏内部表达新论文的真实差别。
- 普通章节：`§` 编号、标题、难度标签、章节进度、本节作用、首个 subsection 与底栏逐项并排对照；除论文文字和章节数量外，固定骨架不应有明显视觉差异。
- Sidebar：宽度、头部、列表、当前高亮、折叠与手机抽屉与参考一致；导航实际可用。
- 全站：同一套 tokens、按钮、反馈、间距、圆角和阴影；没有新造的公共卡片体系。
- 行为：渐进揭示、继续学习、复习/重置（如项目要求）、移动端菜单、焦点管理正常；页面无运行错误，生产构建通过。
- 学术：论文图、方法、数据和结论有出处；教学动画与假设数值标注清楚，不照搬 InSpatio 或 V* 的科学内容。
- 交付：列出复制的源文件/组件/CSS、替换的论文数据、做过的浏览器对照、仍存在的像素差异与未验证项。不自动提交或部署，除非该项目另有授权。

## 8. 历史纠偏：以最后确认的固定骨架为准

V* 项目曾有一轮要求删除章节标题下的横向进度，因为当时新增的是脱离模板的自定义 `flow-mini`。之后用户明确要求**恢复参考项目的固定章节进度组件**，并将 Chapter Progress 与 Hero、Sidebar、章节标题、难度标签、本节作用、subsection、底栏等一起永久冻结。因此新项目应复用参考的章节进度，不能沿用“所有进度条都要删除”的过期指令。要避免的是自创重复导航，不是参考固定组件本身。

另外，早期视觉迁移报告记录了当时功能基线中尚不存在独立 Review Mode、全局 Restart 或评分 Quiz。后续 V* 项目继续发展，不能把早期验收报告当作当前功能清单；新项目始终应以当下源码与具体要求核实功能。

## 9. 可直接交给执行者的任务说明

```text
请把本论文的 PaperSkill 网页固定 UI 完整移植为 InSpatio-World 参考页面的同一套组件。先阅读本 README 和锁定版本的参考源码，逐项列出实际组件、DOM/JSX、class、CSS 与 tokens，再复制，不根据截图自行仿写。固定层包括 Hero 基础框架、传统方法/本文方法双栏容器、Sidebar、Chapter Header、§ 编号、Difficulty Badge、Chapter Progress、本节作用、subsection shell/header、公共按钮、底部导航、渐进学习及移动端框架。只把论文标题、章节数、正文、图像、动画和实验内容替换为本论文的真实内容。每完成一类固定组件，都用相同视口与参考页面并排截图检查；明显不同继续修正。保护现有未提交改动和已冻结组件。最后报告来源映射、修改文件、构建与浏览器验收、残余差异。不要自动 Git commit 或部署。
```
