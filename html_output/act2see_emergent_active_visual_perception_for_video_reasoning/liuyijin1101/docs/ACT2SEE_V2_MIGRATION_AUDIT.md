# Act2See V2 结构审计与迁移蓝图

审计日期：2026-10-29（Asia/Shanghai）。性质：只读工程审计及设计；本报告是本轮唯一新增文件。状态：**规划可用，实施与整站验收未完成**。

## 1. 范围、证据等级与工程基线

最高优先级固定 UI 依据为根目录 `README_INSPATIO_WORLD_REUSE.md`，已先于业务源码读取。本次使用 paper-skill 的证据核验规则；不将历史报告的 VERIFIED 或“构建通过”自动继承为本轮结论。

- **源码确认**：本轮实际读取源码或原文，能确定定义、分支和数据；不能推导运行结果。
- **浏览器已验证**：本轮亲自在浏览器操作并观测到结果。本轮无此类新增证据。
- **尚未验证**：没有本轮运行、视觉、网络资源完整性或原文细节证据。
- 学术 `VERIFIED` 仅用于明确列出的原文核对范围；`UNVERIFIED` 表示仍待核验；需要真实视频或未发布轨迹时为 `AUTHOR_INPUT_NEEDED`，不影响先做教学示意。

### 1.1 实际文件结构

工程根目录：`E:\PaperSkill_projects\Act2See_web`。

| 文件/目录 | 作用与现状 |
|---|---|
| `src/main.tsx` | React StrictMode 入口；依次加载 reference-tokens、reference-components、interactions、migration CSS |
| `src/App.tsx` | Hero、HeroCompare、FlowMini、Chapter、全局进度、Final 容器集中定义 |
| `src/content.ts` | 13 章配置、五项 benchmark 数值、Figure 1–4 元数据、论文链接 |
| `src/ChapterBodies.tsx` | 13 个 JSX 正文组成的平行数组 `bodies`，依靠数字下标对应章节 |
| `src/Interactions.tsx` | 全部 16 个指定组件，以及 Label、Source、Frame 和步骤/测验数据 |
| `src/styles/reference-tokens.css`、`reference-components.css` | 参考公共视觉基础；一致性见第 4 节 |
| `src/styles/migration.css` | 同时含内容适配及 FlowMini 等固定层覆盖，有跨层污染风险 |
| `src/styles/interactions.css` | 论文实验台、图表、原图查看、测验样式；大量压缩为单行 |
| `public/paper/figure-1.png` 至 `figure-4.png` | 四幅现存论文图片；没有视频素材 |
| `paper.html` | 已保存论文 HTML，包含正文、附录和表格；外部图片并未全部本地化 |
| `docs/` | source-audit、evidence-mapping、story-architecture、qa-report 及 preview-desktop.png；均保留 |
| `src.zip`、`public.zip` | 历史压缩包；本轮未解压，内容及与当前目录的一致性未验证 |
| `dist/`、`node_modules/`、`tsconfig.tsbuildinfo` | 已存在；不能据此认定与当前源文件匹配或构建通过 |
| `package.json`、锁文件、TS/Vite 配置、index.html、README、.gitignore | 均只读保留 |

未发现当前工程自有 `AGENTS.md`。package.json：React/ReactDOM 19.2.6、lucide-react 1.45.0、TypeScript 5.9.3、Vite ^8.3.2。脚本为 dev、build、typecheck、preview；无测试脚本。`build` 执行 `tsc -b && vite build`，`typecheck` 也使用 `tsc -b`，可能更新 tsbuildinfo，故本轮均未执行。未启动开发服务器、安装依赖或部署。

### 1.2 Git 与保护边界

已执行只读 `git status --short --branch` 和 `git log -5 --oneline`，均返回 `fatal: not a git repository (or any of the parent directories): .git`。根目录隐藏文件枚举亦未见 `.git`。

因此：**当前分支、未提交 diff、历史提交基线均无法取得**；不是“工作区干净”，也不能认定“没有未提交修改”。当前所有文件都视为需保留的用户工作。没有执行 Git 初始化或任何改变 Git/工作区状态的命令。

现有项目文件（排除 node_modules、dist、.git）的 SHA256 清单已在会话内记录，用于交付前保护检查；这不是 Git 基线。未对依赖或构建产物作字节级审计。本轮不以构建或格式化触碰原文件。

历史 `docs/qa-report.md` 日期为 2026-10-04，声明桌面首屏/第一章、375px 手机、13 章展开、Reset、控制台和构建曾通过；其中手机描述另记实际宽度 360px。这些均属于**历史记录，非本轮复验**，且覆盖范围不等于全组件验收。

## 2. 当前章节、目标和组件

下列顺序来自 `content.ts`；学习目标由 question/takeaway 归纳。所有正文挂载点为 `src/ChapterBodies.tsx` 对应 `bodies[0..12]`，公共壳为 `src/App.tsx::Chapter`。下表具名内容组件均定义在 **`src/Interactions.tsx`**，不是独立同名文件。

| 序号 / ID | 当前完整标题 | 学习目标 | 实际内容组件 |
|---|---|---|---|
| 1 / gap | 为什么“先看完再思考”不够？ | 理解固定初始帧可能遗漏后来所需证据 | StaticLab |
| 2 / cot | 视觉帧怎样插进思维链？ | 理解文字、调用、返回帧与续写的交错关系 | CoTTimeline |
| 3 / channels | 检索真实帧，还是生成假设帧？ | 区分真实视频取证和假设生成 | ChannelsLab |
| 4 / pipeline | 从轨迹数据到主动感知模型 | 区分数据构造、SFT 和模型推理 | Pipeline |
| 5 / trace | 怎样构建可信的 Reasoning Trace？ | 理解人工 CoT 用作事后筛选标尺 | TraceLab |
| 6 / sft | SFT 如何学出“需要时再看”？ | 理解工具查询 token 与图像帧的损失边界 | SFTLab |
| 7 / simulator | 推理时，模型到底怎样边想边看？ | 理解一次视觉调用及追加帧后续写 | InferenceSimulator |
| 8 / benchmarks | 五个 Benchmark 分别在问什么？ | 区分任务能力与评测指标口径 | BenchmarkExplorer |
| 9 / results | 实验结果到底证明了什么？ | 读主结果、工具消融与比较边界 | ResultsLab、CounterfactualEvidence |
| 10 / figures | 四幅原图如何串成一条证据链？ | 区分构造、组成、样本和推理图的证据作用 | FigureWalk |
| 11 / active | Act2See 到底“主动”在哪里？ | 定义推理驱动取证并限制能力外推 | ActiveMap、MethodComparison |
| 12 / context | 从 V* 到 Act2See，问题怎样前进？ | 理解课程定位而非论文继承关系 | ContextMap |
| 13 / limits | 哪些证据能信，哪些问题还没解决？ | 区分失败事实、方法分析和未证明能力 | LimitsPanel |

另有 Landing（App.tsx 中 Hero/HeroCompare）及 `id="final"` 的理解检查（FinalQuiz，App.tsx 挂载）。故计数为 **13 个编号章节 + Landing + 独立 Final**，不是 14 个编号章节。指定的 16 个组件全部实际存在，且全部被当前页面引用。

## 3. 交互质量、动画与状态审计

本节全部为**源码确认；本轮浏览器均尚未验证**。质量分类：T=文本/选择切换；V=图像、图表或序列结构变化；D=学习者决策产生可解释反馈；S=静态呈现。V 不自动等于高质量机制实验。

| 组件 | 控件与状态 | 实际反馈 / 分类 | 保留价值与升级点 |
|---|---|---|---|
| HeroCompare | 无 state、无时间驱动 | 静态 t₁/t₂/t₃、查询/新帧标签，S | 保留双栏外壳；目前不是双栏自动循环动画 |
| StaticLab | stage 0→1→2→0 | 文案、状态标签及 Frame 色调/名称变化，T+弱V | 可复用三步对照；没有 FPS、真实帧或关键动作命中计算 |
| CoTTimeline | at 0..4，步骤按钮/前后步 | 选中态、证据说明，第 4 步新增抽象 Frame，T+弱V | 保留有界步进；缺少累计上下文、真实图证和两轮工作台 |
| ChannelsLab | retrieve/generate | token 字符串、三段流程、Frame 色调/名称变化，T+弱V | 保留工具语义；没有检索候选、条件帧与生成帧的空间对照 |
| Pipeline | at 0..5 | 六卡选择及输出到下一阶段的解释，T | 适合流程总览，不是数据流模拟 |
| TraceLab | at 0..4 | 筛选步骤说明；统计卡保持不变，T | 可复用筛选规则；没有样本经过筛选的可见去留变化 |
| SFTLab | after boolean | 增删工具调用/返回帧/续写节点，V | 有真实 DOM 序列变化；不是 token 预测、梯度或训练过程模拟 |
| InferenceSimulator | mode、step 0..5、question | 步骤圆点、证据文案、Frame 状态；模式改变重置步骤，T+弱V | 输入仅展示文字，不驱动决策；重置演示只重置 step，不重置 mode/question。保留透明说明与控制器 |
| BenchmarkExplorer | at 0..4 | benchmark、能力、指标说明切换，T | 适合任务导览；不构成性能实验 |
| ResultsLab | main/ablation/boundary | 按精确数值设置条宽，切到消融卡或边界说明，V | 可复用数据图表；没有任意参数计算新成绩，也不应伪造 |
| FigureWalk | at 0..3 | img src/图注/边界随 tab 真正改变；原图新标签打开，V | 成熟度较高的原图读图入口；需增加分面定位和上下文分配 |
| ActiveMap | 无状态 | 七节点静态流程，S | 可作小结，不能算互动 |
| ContextMap | 无状态 | V* 与 Act2See 静态教学比较，S | 留作可选背景，退出独立章 |
| CounterfactualEvidence | 无状态 | 三组附录统计卡，S | 保留条件说明，迁入 §9；不是反事实实验 |
| MethodComparison | 无状态 | 静态四路线表格、横向滚动容器，S | 可复用比较边界，迁入 §7 |
| LimitsPanel | 无状态 | 风险卡及十一问答案同时展开，S | 保留事实/分析区分；复习列表没有作答反馈 |
| FinalQuiz | answers 数组，可反复改选 | 每题正误、解释、已答与正确数；role=status，D | 真正有判断反馈；不调用模型，也不控制章节通关 |

`Frame` 只是 Film 图标、文字和渐变背景的 div，不能称为论文原始视频帧。源码没有业务视频播放器、采样器或自动执行检索/生成；没有现场模型/API 推理。CSS 存在章节/模块渐入、active 进度脉冲、按钮过渡及 reduced-motion 规则。公共 CSS 里的其他 keyframes 或视频类名不证明当前 DOM 使用了该功能。JS 的 requestAnimationFrame 用于导航滚动，不构成论文机制动画。

### 3.1 当前全局状态关联

唯一持久化键为 `act2see-tutorial-v1`，数据 `{unlocked, completed, review}`：

1. 初始 unlocked=0；开始后至少为 1。只挂载 index < unlocked 的章；旧章继续留在 DOM 中。
2. 每章继续入口仅出现在最新解锁章且非 review 状态。next 增加 unlocked/completed；最后章设置 completed=13、review=true 并滚到 final。
3. FlowMini 在每章都读同一个 unlocked。它表示解锁前沿，**不是滚动当前章，也不是测验通过数**；completed 没有驱动进度外观。
4. 没有 Sidebar、底栏、章节路由、哈希恢复或 activeChapter 状态；定位靠 destination、getElementById、scrollIntoView 和 h1/h2 focus。
5. “复习全部章节”仅滚到第一章，不创建新的模式；review 已在进入 Final 时设为 true，继续按钮随之隐藏。
6. “重新开始”删除存储键、清零全局进度、递增 epoch 重挂载 main，连同所有实验台和 FinalQuiz 局部状态清空。之后 effect 会重新保存零进度对象，故不是存储永久保持空。
7. 局部 useState 不持久化；刷新保留解锁数，不保留模拟器步骤或测验答案。没有基于答对/实验完成的解锁门槛。
8. savedProgress 仅严格验证 unlocked 范围；completed 未验证整数/非负，review 未与 completed/unlocked 联合约束。构造异常存储可出现提前 Final 等不一致。

13→9 若直接沿用旧键：旧 unlocked 10..13 会被判无效而归零，1..9 虽保留数字但内容语义错位；review 可能提前显示。必须设计版本迁移，不能简单 clamp。

## 4. 固定 UI 对照

### 4.1 外部来源与访问结果

固定来源：[参考目录](https://github.com/ReductTech/PaperSkill/tree/a94f6089b9c0b7a83947e854a5014403ca3975e1/html_output/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816)，commit `a94f6089b9c0b7a83947e854a5014403ca3975e1`。

参考部署页：[InSpatio-World](https://reducttech.github.io/PaperSkill/papers/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816/)。web 工具访问目录出现 Cache miss，访问部署页提示不可访问。首次终端请求被沙箱代理套接字权限阻止；提权只读重试后，**12 个指定 raw 源文件全部 HTTP 200**，仅在内存读取，没有新增参考快照文件。部署页面没有浏览器截图或像素对照，不能声称视觉验收完成。

下表参考路径均相对上述固定目录；raw 来源根为 `https://raw.githubusercontent.com/ReductTech/PaperSkill/a94f6089b9c0b7a83947e854a5014403ca3975e1/html_output/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816/`。

| 检查项 | 当前文件 | 已读取参考文件 | 源码对照结果 / 问题 | 冻结层 |
|---|---|---|---|---|
| Hero 基础壳 | App.tsx::Hero/HeroCompare；reference-components.css | components/Hero.tsx；styles/components.css | hero/hero-inner/hero-compare/bg-side/head/canvas/tag 基本结构一致；本地增加作者机构和链接，需核对几何；尚无像素验收 | 是，内部场景否 |
| Hero 专属动画 | App.tsx::HeroCompare；migration.css .scene-* | modules/hero-new.tsx | 参考为车、路书、灯塔 canvas，3200ms 循环；本地为静态标签。不能移植参考论文场景冒充 Act2See | 否 |
| Sidebar | 无 | components/PptBars.tsx；styles/ppt-mode.css | 整项缺失。参考桌面 288px、折叠、滚动当前态、移动抽屉；不能用普通链接列表替代 | 是，待补齐验收 |
| Chapter Header / § | App.tsx::Chapter；reference-components.css | App.tsx；styles/components.css | chap-title/num/badge-tag 和 Georgia 编号已沿用；章节文字可替换 | 是，待视觉验收 |
| Difficulty Badge | App.tsx::Chapter；content.ts | App.tsx 的 ch.badge/ch.badgeLabel | 本地显示 source（如 §2.1 · Table 1 · Algorithm 1），颜色由 index<6/<10 决定；并非独立难度字段。来源应贴近正文，难度按章配置 | 是；标签文字为数据 |
| Chapter Progress | App.tsx::FlowMini；migration.css | components/FlowMini.tsx | 状态逻辑近似；参考 Fragment+div.flow-step[data-step]，本地 span.flow-pair+span.flow-step，且新增最小宽度/窄屏覆盖；不完全一致 | 是 |
| 本节作用 | App.tsx::Chapter | components/ChapterBridge.tsx | chap-bridge/cb-icon/body/title/text 已对应；本地放 question，建议改成明确章节作用而非只重复问句 | 是，文案否 |
| subsection shell/header | App.tsx::Chapter | components/Module.tsx；styles/components.css | 模块外壳 class 一致；本地每章只有一个 module、编号 01..13，另加 module-source；参考按 module.id/title 渲染多模块。V2 应按 N.1/N.2 组织 | 是 |
| bottom navigation | 无 | components/PptBars.tsx；styles/ppt-mode.css | 整项缺失；需与 Sidebar 展开、折叠和当前滚动章一致 | 是 |
| Progressive Learning | App.tsx start/next/map | lib/useProgressiveChapters.ts；App.tsx | 逐章挂载/继续/滚动相似；参考内存计数，本地增加持久化和 Final。需统一多导航入口状态 | 是，持久化为项目扩展 |
| Review / Reset | App.tsx；Interactions.tsx::FinalQuiz | 已读 App.tsx/useProgressiveChapters.ts 未见独立 Review/Reset/Quiz | 本地项目扩展，不能宣称参考站自带。保留已有功能并纳入统一状态 | 公共行为验收后冻结 |
| tokens | styles/reference-tokens.css | styles/tokens.css | 主色/字族/半径/动效相符，但不是完整同文件：本地缺六个 inherit 字号/字重/行高别名，见下文 | 是 |
| 公共基础 CSS | styles/reference-components.css | styles/components.css | 归一化 CRLF/LF 后全文相等；仍受 migration.css 覆盖，故不等于最终视觉完全一致 | 是，优先保留 |
| 公共按钮/焦点 | App.tsx；reference-components.css；interactions.css | styles/components.css；styles/ppt-mode.css | chap-loader 已沿用；内容中 button-primary/outline/quiet 未见对应专属规则，仅受通用按钮样式等影响；实验台另有选中态体系 | 公共按钮是，内容反馈按章 |
| 响应式/reduced motion | index.html；四份 CSS；App.tsx | styles/components.css、paper.css、ppt-mode.css；PptBars.tsx | 本地有 768/600/500/390 等断点、device-width viewport、减少动效；无抽屉，无法满足整套导航验收 | 是 |

CSS 精确核对：远程 tokens UTF-8 文本 SHA256 为 `6ADC17CD803742C4AB911160B0E78A710DB3371D4D7F1390A9E2500C8CBCE08D`；components 为 `EA96A81E73D6C7AE511DE281F518B2E47808D021BD298AC8869ED4FB963F74F9`。本地 components 与远程忽略换行后相等；tokens 缺 `--ui-type-h3-size/weight/line-height` 和 `--ui-type-body-small-size/weight/line-height` 六个 `inherit` 声明及空行。未来 ppt-mode.css 会给这些变量实际值。

参考 paper.css 主要包含论文场景变量、公式排版和视频演示样式，不应整份当固定 UI 覆盖移入；只取实际需要且属于固定契约的规则。参考 hero-new 是论文专属画面，禁止作为固定 Hero 组件冻结。

### 4.2 参考本身与本地规范的行为差异

参考 PptBars 的当前章按视口上方 30% 参考线与章节 top 计算；Sidebar 点击未揭示章会循环 revealNext 到目标，is-locked 仅降低透明度，并非 disabled。迁移时应保留这种“可点击并解锁至目标”的一致语义，不能让视觉看似可点而实际无效，也不能擅自新增测验通关门槛。

参考 chapterNodes 使用 `main section.chap`。若直接复制到本项目，独立 Final 的 `.chap` 会被计入，造成 9 章导航/10 个节点错位。应将 Final 纳入 §9 内部或让适配选择器只索引九个 chapter ID。

参考源码没有显示 Esc 关闭、焦点圈定/返回、折叠导航 inert 等完整实现；且 scrollIntoView 硬编码 smooth。README 要求更严格，应保留原 DOM/class/布局并补齐行为，不照搬缺陷。参考 CSS 手机抽屉为 280px，桌面为 288px；这不是尺寸冲突。实际移动键盘与 reduced-motion 仍需浏览器验收。

**冻结判定：目前仅可确认部分源文件/结构复用，不能宣布整套 UI 已冻结。阶段 A 对齐并验收后冻结固定层；后续只能改章内内容及数据。**

## 5. 原素材、数据来源与学术风险

### 5.1 资源库存与复用去向

| 现有资源 | 大小/用途 | V2 去向与边界 |
|---|---|---|
| public/paper/figure-1.png | 397,954 bytes；两轮轨迹构造 | §4 工作台原图依据，§5 引用；不能标成 Act2See 在线推理日志 |
| figure-2.png | 586,272 bytes；数据组成 | §5，保留原图；配套数据若重绘须逐项核对 |
| figure-3.png | 381,370 bytes；训练样本 | §6，区分输入、目标序列、外部帧与 loss mask |
| figure-4.png | 811,221 bytes；推理案例 | §8 主体，§9 失败案例引用；允许后续有出处的裁切定位 |
| paper.html | 正文/附录/图表引用 | 本地核验依据；本轮不修改 |
| content.ts::benchmarks | 五对准确率 | §7 原值保留，补齐设置/脚注 |
| Interactions.tsx 中 Tables 6/8/11/12 等数值 | 部分为硬编码，不在统一数据表 | §5/7/9 分配；后续集中来源字段，禁止静默改数 |
| docs/source-audit.md、evidence-mapping.md | 历史溯源 | 保留历史版本；未来新增核验结果，不把旧日期当当前状态 |
| docs/preview-desktop.png | 历史截图 | 可作历史参考，不能作为本轮浏览器证明 |

当前 public 只有四幅 PNG；没有 MP4/WebM/GIF、原视频片段、独立条件帧/生成帧、完整机器可读轨迹、模型权重、Table 截图或 PDF。Table 1–13 的内容可在 paper.html 中定位，但网页没有逐表实现。原图像素、裁切清晰度、PNG 与远程源图字节一致性本轮未验证，历史“原图归档”声明需保留此限定。

### 5.2 本轮核对与待核验

主论文：[arXiv v1](https://arxiv.org/html/2605.01657v1) 可访问；题名、作者及 Figure 1 两轮构造角色已用在线原文核对。下列较详细数值对照来自当前本地 `paper.html` 与业务源码，而非模型记忆；未对整个 HTML 和远程 v1 做字节一致性验证。

| 内容 | 当前显示/依据 | 核验结果与风险 |
|---|---|---|
| Table 2 主结果 | Video-MME 71.8→74.2；VideoEspresso 41.5→46.8；EgoNormia 48.9→51.3；VCR-Bench 38.2→47.1；ViTIB 60.2→63.3 | 与本地原表对应行一致；五项同基座均提升。后四个基座值有 † 作者评测脚注，现有 UI 未完整呈现 |
| 指标 | Video-MME 无字幕；EgoNormia verified split 行为及理由均正确；另三项平均准确率 | 原 Table 2 图注支持；不可跨 benchmark 比较条长代表难度 |
| Figure 1 | Gemini 首轮查询→外部工具→第二轮完成 CoT | 在线正文/图注支持。两轮不是两次工具调用；§4 标明“训练示范轨迹构造”，可另与 Algorithm 1 推理机制对照 |
| Table 6 | 1000 样本试验，含人工 CoT 提示 5.26%，不含 45.21% | 本地原表值匹配；不是正式训练集含帧比例 |
| Table 7 | VLM 来源 vs 人工标注来源：ViTIB 58.3/62.0；Video-MME 68.6/73.7 | 本轮读到原表；现有 TraceLab 未显示完整对照，§5/7 可分工补充；每组 1000，不能混入 Table 2 |
| Table 8 | 71.9/72.8/72.4/73.7（文字/检索/生成/组合） | 现有值与历史证据记录一致，正文确认四组各 1000；精确行值仍需实施前逐行复核并存来源锚点 |
| Table 3 | Chain-of-Frames 75.3 对 Act2See 74.2 | 当前已有边界提醒；跨方法设置和完整行需复核，不能宣称全面领先 |
| §3.4 / Appendix C.3 | 3373 总轨迹；1608 含帧；1026/582 检索/生成 | 现有记录及组件一致；1608/3373≈47.67%，1026+582=1608。C.3 源数据 1334 CausalVQA +1307 MINERVA +732 Social Genome=3373；详细类别在原文，未完整转成网页数据 |
| Table 11 | 0.5fps Act2See：106 帧/877 TFLOPs/38.7%；1fps 基座：210 帧/1025/38.2% | 本轮本地原表匹配；含检索生成 GPU 操作、全 VCR-Bench 摊销，延迟排除数据加载。不能称同帧预算比较 |
| Table 12 | 反事实：不调用35.52/检索43.41/生成56.01/组合56.22 | 原表匹配；107 题由 GPT-5.2 分类，非基准自带真值标签。差值为百分点；不要混称相对提升 |
| 生成失败 | 13/127≈10.2%；语义7、物理4、几何2 | Appendix F 对应正文匹配；不是所有生成模型通用失败率 |
| Table 13 | 10/20/30% 失败时46.88/46.40/45.69，检索对照45.56 | 本轮读到；当前 Source 写 Tables 11–13，但未显示本表。其人为失败设定须连同正文核对后才加入 §9，不混同观测 13/127 |
| SFT/工具细节 | LoRA、8×A100、2.5×10⁻⁶、batch1、1 epoch；TFVTG、SD3.5 Large、初始1fps/检索3fps、BGE>80%、重试最多2次、人工抽查100 | 当前源码和历史报告存在；本轮未逐句完成独立复核，标 UNVERIFIED 待 §3/5/6 实施前核对 §2–4/C.1/C.2；不得把教学预测当真实 logits |

主要待办风险：

1. 当前 `PAPER` 为无版本 HTML URL，而页脚声称 v1；Source(where) 所有链接均指全文，不带 section/table anchor。历史 evidence-mapping 所称“使用章节锚点”与实际源码不一致。下一轮应规划版本化和精确定位。
2. §4.4 VideoEspresso 帧预算文字与 Table 2 相反，本轮在本地原文再次看见；保留矛盾，不替作者修订。
3. CVF 403 和代码“coming soon”仅是 2026-10-04 旧记录；本轮未重查 CVF 最终版、官方仓库发布/权重状态，均标 UNVERIFIED。不要将旧状态当作 10-29 最新结论。
4. Figure 4 的具体面板和轨迹文本、咖啡失败裁切，尚未本轮逐像素/逐句比对。§8 的“真实案例”必须直接来自原图/原文，不允许编造输出或置信度。
5. FPS 漏帧实验是教学机制，不可宣称论文测得某 FPS 必然失败。关键事件持续时间、采样相位都会影响命中，不可只给单调“FPS 越高必然正确”。
6. §6 token 预测可展示词元类别和 loss mask；没有真实 logits 就不画“模型置信度 92%”。手工教学分布若使用，必须显著标教学设定，优先避免数值概率。
7. 当前正文/组件英文较多；首次应采用“监督微调（SFT）”“思维链（CoT）”“检索（Retrieve）”“生成（Generate）”等中文优先介绍。
8. 本地没有真实视频和完整运行轨迹；若下一轮要求真实片段，需查找公开授权来源或用户提供（AUTHOR_INPUT_NEEDED）。未取得时采用明确标注的自绘教学场景，不能声称原视频。
9. 计算量已经有数据，延迟还缺可追溯的精确展示；应读 Appendix F 与 Figure 6。Figure 5/6 未在 public 归档，Table 4/5 训练策略完整对照也未实现。

## 6. 旧 13 章 → 新 9 章精确映射

本表 I=`src/Interactions.tsx`，B=`src/ChapterBodies.tsx`；各行完整旧标题见第 2 节，并在此保留以便迁移。不得按原数组位置直接删除四项。

| 旧 ID / 标题 | 组件和当前路径 | 新目的地 | 处置与可复用内容 | 耦合/工程风险 |
|---|---|---|---|---|
| gap / 为什么“先看完再思考”不够？ | B[0]→I::StaticLab | §1；少量动机给 Landing | 重构；保留固定/主动对照与证据标签 | Hero 与 FPS 实验共享场景数据但不能共享播放 state，避免跨章互相重置 |
| cot / 视觉帧怎样插进思维链？ | B[1]→I::CoTTimeline | §4 | 合并重构为工作台；保留前后步和 token 术语 | at 的 5 步不是两次调用；不能与 InferenceSimulator 的 6 步直接按 index 合并 |
| channels / 检索真实帧，还是生成假设帧？ | B[2]→I::ChannelsLab | §2 决策语义；§3 工具实验 | 拆分重构；复用 mode、条件生成说明 | §2 增加直接回答分支；三选一不能硬塞入二值 mode |
| pipeline / 从轨迹数据到主动感知模型 | B[3]→I::Pipeline | §5 为主；§6 训练衔接；§4 简短角色标识 | 合并；保留六阶段职责 | 不重复整套流程，Gemini 与受训模型角色分开 |
| trace / 怎样构建可信的 Reasoning Trace？ | B[4]→I::TraceLab | §5 | 保留规则/计数、升级样本去留反馈 | 示例样本质量阈值不得伪装真实筛选日志 |
| sft / SFT 如何学出“需要时再看”？ | B[5]→I::SFTLab | §6 | 保留前后序列、重构 token/loss mask | 训练前后仅教学，不表示每个真实样本必然调用 |
| simulator / 推理时，模型到底怎样边想边看？ | B[6]→I::InferenceSimulator | §2 决策面板 + §4 交错状态机；§8 仅真实案例对照 | 合并重构；复用 step/重置、证据描述 | 旧 question 只改文字；升级时必须明确哪些输入影响路径，不能造成假推理 |
| benchmarks / 五个 Benchmark 分别在问什么？ | B[7]→I::BenchmarkExplorer | §7 | 保留数据与指标导览 | 与 ResultsLab 使用同一 benchmark ID，不能依赖相同数组下标 |
| results / 实验结果到底证明了什么？ | B[8]→I::ResultsLab、CounterfactualEvidence | §7 主结果/消融；§9 反事实/成本 | 拆分保留；精确数值/条件说明 | Table2/8 不混为同训练规模；Table11/12 不是主结果全集 |
| figures / 四幅原图如何串成一条证据链？ | B[9]→I::FigureWalk | 图1→§4；图2→§5；图3→§6；图4→§8/§9 | 淘汰独立“原图总览章”，保留可参数化查看器和图片 | 现有 at 默认0，复用必须限定图列表/初始图；多个实例状态独立 |
| active / Act2See 到底“主动”在哪里？ | B[10]→I::ActiveMap、MethodComparison | ActiveMap→§2/§9；MethodComparison→§7 | 合并；保留定义和比较边界 | 静态组件不得列为新增交互完成项 |
| context / 从 V* 到 Act2See，问题怎样前进？ | B[11]→I::ContextMap | §9 可选背景小节 | 淘汰独立章，保留教学性对照 | 不能把课程排列写成论文因果继承；不要挤占可靠性正文 |
| limits / 哪些证据能信，哪些问题还没解决？ | B[12]→I::LimitsPanel | §9 | 保留风险和复习题；整合 CounterfactualEvidence | 十一问与 FinalQuiz 不重复；生成失败事实与分析分栏 |
| Final（非旧编号章） | App.tsx::final→I::FinalQuiz | §9 内收束 | 保留题库、反馈、Review/Reset | 避免变成第10章/被 PptBars 当额外 section；Reset 必须覆盖所有新增状态 |
| Landing（非旧编号章） | App.tsx::Hero/HeroCompare | Landing | 保留固定外壳，重做专属同步动画 | 不修改冻结双栏几何和公共 tokens |

“淘汰”指退出独立导航和重复呈现，不意味着删除原图、论文证据或有用组件。当前轮没有实际淘汰任何文件。

## 7. Landing + §1–§9 蓝图

以下标题与顺序为固定约束；建议 ID 只是实施设计，当前文件尚未创建。每章内部采用 N.1/N.2/N.3 模块，保持公共壳不变。

| 目的地 / 建议 ID | 不变标题 | 内部分工、输入→状态→可见反馈 | 证据与验收关键点 |
|---|---|---|---|
| Landing / top | 让模型学会边想边看 | 同一问题、同一场景和共享时间时钟；左栏固定取帧，右栏推理发现缺口→请求→补帧→续写；自动循环并可暂停/重播 | 教学场景标注；两栏时间点同步，差异来自取证机制；reduced motion 可逐步读 |
| §1 / evidence-gap | 为什么看过视频，却错过关键证据？ | 1.1 短动作与问题；1.2 调 FPS/相位，在时间线上改变采样点与帧条；1.3 看关键事件窗口是否被覆盖 | 必须实际改变采样集合、命中标记和可见帧；显示示意参数，不输出虚构模型准确率 |
| §2 / evidence-decision | 模型怎么知道自己还需要看什么？ | 2.1 已知/缺失证据；2.2 对给定情境选择直接回答/检索/生成；2.3 用可见证据位置解释选择后果 | 学习者选项改变流程分支和证据槽；不宣称运行模型判别或校准置信度 |
| §3 / visual-tools | 需要的画面，从哪里来？ | 3.1 查询与候选时间点；3.2 检索到原帧；3.3 条件帧+查询→假设生成结果，并比较来源地位 | 真实素材不足时用标注示意；生成分支也先取条件帧，不能从空白凭空生成的假流程 |
| §4 / interleaved-cot | 新画面怎样进入模型的推理过程？ | 4.1 Figure1 原图定位；4.2 首轮保留到调用结束→工具槽插帧→第二轮续写；4.3 对照 Algorithm1 推理应用 | “两轮”是构造轮次，非两次调用。工作台累积上下文、只增加新段，可回看/重置；标明 Gemini 与 Act2See 的角色 |
| §5 / demonstrations | 怎样制造高质量的主动观察示范？ | 5.1 三数据集与图2；5.2 Gemini 轨迹构造/Pipeline；5.3 答案、相似度、格式筛选及数据组成/Table6–7 | 示例记录经过筛选有可见保留/丢弃反馈；正式统计独立展示，不能由教学筛选伪造总体计数 |
| §6 / sft-learning | SFT 怎样让模型学会主动观察？ | 6.1 图3 训练样本；6.2 token 类别与下一 token 教学选择；6.3 loss mask 覆盖文字/查询、排除工具返回图像 | 学习者动作改变序列和监督高亮；不捏造 logits、训练曲线或模型输出 |
| §7 / evaluation | 怎样证明 Act2See 真的有效？ | 7.1 五基准/指标；7.2 Table2 主结果；7.3 Table3–5 策略比较及 Table7–8 数据/工具消融 | 控件切换真实条件并重绘对应图表；训练规模、帧预算、基座脚注可见，不跨表混算 |
| §8 / cases | 模型真的会主动看吗？ | 8.1 Figure4 检索案例；8.2 条件生成案例；8.3 失败例的查询/结果差异，承接 §9 | 选择案例改变原图面板及来源定位；原文转录与教学解释分离，不用抽象 Frame 冒充真实输出 |
| §9 / reliability | 主动观察就意味着可靠吗？ | 9.1 生成失配；9.2 Table12 反事实收益；9.3 Figure6/Table11 延迟计算及 Table13 鲁棒性；9.4 局限、可选 ContextMap、总结/FinalQuiz/Review/Reset | 保留设置与样本范围；无原始延迟值不编造；测验反馈和全站 Reset 验收 |

全章通用要求：正文中文优先；事实、教学示意、自行分析就地标注；动画必须使机制中的取样、分支、插帧、监督或比较条件发生可观察变化。仅按钮选中和说明替换不算核心实验验收通过。

## 8. 状态与工程迁移策略

1. 将 `chapters` 与 `bodies[index]` 改为以稳定 ID 对应的注册关系，保留组件内部有价值逻辑。章节配置增加明确 difficulty、role、modules、sourceRefs；不再用 source 充当难度。
2. 全局区分 unlocked（解锁前沿）、completed（走完学习入口）、activeId（滚动所在章）、review（回顾）。Sidebar/底栏读取 activeId；FlowMini 保留参考的 revealed 语义，不擅自改成测验分数条。
3. 新持久化用 `act2see-tutorial-v2` 和显式 version。保留 v1 原值。建议第一次迁移保守按新章所需旧内容全部到达才映射，并将新交互完成标记设为未完成；旧 fully completed 可开放九章但不伪造新测验完成。实施前用固定映射表测试各旧 unlocked=0..13，而非 Math.min(9,n)。
4. 实验台状态局限在本章；跨章只共享不可变示例/来源元数据。Landing 时钟只供两栏同步，不驱动全站；卸载/隐藏/暂停时清理 RAF，reduced-motion 下不强制自动播放。
5. v2 Reset 清理当前 v2 进度和局部状态，不删除无关 localStorage 或无提示擦掉 v1 备份；复习只导航，不重新评分、不改变已完成状态。
6. 建议将 Final 放进 §9 的 module 内，九个导航目标唯一；新章标题过长应由参考布局自然换行，不缩小公共字体来容纳。
7. 大文件拆分按章渐进实施，不一次性移动所有逻辑。`Interactions.tsx` 的通用 Frame/Source/Label 可能形成隐式依赖，提取时保持各阶段原导出兼容，避免顺手改未验收章节。

## 9. 分阶段实施计划

以下均为**未来允许范围建议，不是本轮写入授权或已完成变更**。所有阶段禁止自动提交/推送/部署，保留现有用户工作。固定层在 A 验收后永久冻结；若后续发现公共缺陷，另列影响范围并进行全站回归，不能借内容调整顺带改壳。每章验收后记录冻结范围，下一章不随意回改。

### A. 九章结构与导航迁移（下一轮优先，仅做此阶段）

- 允许：`src/App.tsx`、`src/content.ts`、`src/ChapterBodies.tsx`、`src/main.tsx`；按参考对齐 `src/styles/reference-tokens.css`、`src/styles/migration.css`；新增 `src/components/PptBars.tsx`、`FlowMini.tsx`、`ChapterBridge.tsx`、`Module.tsx`、`src/lib/useTutorialProgress.ts`、`src/styles/ppt-mode.css`（名称为计划）；必要时新增 source/freeze 记录。
- 禁止：修改 `Interactions.tsx` 内科学内容/数值、四幅 PNG、paper.html、锁文件、package.json、TS/Vite 配置、压缩包和旧证据报告；reference-components.css 已一致，原则上不动。
- 工作：先用现有组件按本报告重新组合成九章，集中章节配置；移入参考导航与公共组件，补足 README 的焦点行为；修正 source badge、subsection 编号、FlowMini DOM/覆盖；移入 Final；处理 v1→v2。
- 依赖：固定参考 commit、章节映射、持久化语义；不依赖新动画或新视频完成。
- 风险：平行数组错配、旧存储语义错位、Final 被导航计数、多个滚动 effect 竞争、长章节当前态、抽屉隐藏但可 Tab、底栏遮挡。
- 验收：9 章准确标题/顺序/ID；所有旧内容有去向；全路径开始/继续/Sidebar/上一下章/Review/Reset；旧进度0..13、异常 JSON、存储不可用；展开/折叠桌面与手机焦点/Esc；参考同视口截图及 DOM/class/CSS 对照。对齐后冻结公共壳。

### B. Landing

- 允许：仅 HeroCompare 专属内容（可提取新增 `src/components/Act2SeeHeroDemo.tsx`）、独立场景数据/局部样式、新增有来源的素材；App.tsx 仅替换插槽引用。
- 禁止：A 冻结的 Hero 外壳、标题字号、双栏容器、tokens、导航、其他章正文。
- 依赖：A 已验收；同一问题与场景的可用素材/教学标注。
- 风险：双独立计时器不同步、隐藏仍播放、生成画面被误认真实、画面挤压固定壳。
- 验收：同步时间线、循环/暂停/重播、两栏同初始输入；关键帧遗漏与补证可见；无真实推理假象；窄屏与减少动效可读。

### C. §1–§4（每章完成后再推进下一章）

- 允许：`ChapterBodies.tsx` 对应四章、`Interactions.tsx` 中 StaticLab/ChannelsLab/CoTTimeline/InferenceSimulator/ActiveMap 的相关内容；推荐逐步提取 `src/chapters/Chapter1.tsx` 至 `Chapter4.tsx` 和各自局部 CSS；必要的只读数据/新素材。
- 禁止：A/B 已冻结层、§5–9 内容和既有图像原件、公共 tokens、配置/依赖。
- 依赖：§1 场景事件区间；§2 明确三分支示例；§3 工具证据地位；§4 Figure1/Algorithm1 可追溯文本。
- 风险：FPS 的采样相位被忽略、question 输入假响应、检索与生成状态串用、两轮被误画为两次调用、同一实例共享 state。
- 验收：FPS 改采样集合；决策改路径并有理由；工具改候选/条件/结果画面；工作台真正插入帧与后续上下文；每章前后步/重置/键盘可用，无虚构准确率或模型轨迹。

### D. §5–§8（按 §5→§6→§7→§8 顺序）

- 允许：对应正文及 Pipeline/TraceLab/SFTLab/BenchmarkExplorer/ResultsLab/FigureWalk/MethodComparison；可新增 `src/chapters/Chapter5.tsx` 至 `Chapter8.tsx`、结构化 evidence 数据、局部样式和有出处的图像派生件。
- 禁止：A–C 验收内容、原始 PNG 覆盖、无来源数字、新模型运行接口、依赖变更。
- 依赖：三数据集计数和筛选规则；SFT 原文；Table2–8 设置；Figure4 面板/原文转录。
- 风险：示例筛选去留与论文总统计混同；图像帧错误纳入语言 token loss；跨表条件混算；裁切原图遗漏失败信息。
- 验收：§5 样本流与论文总体分开；§6 token 与 loss mask 可操作；§7 所有数值/脚注逐行核对并有单位；§8 每个案例链接原图，明确事实/解释/失败。章内验收后冻结。

### E. §9

- 允许：对应正文及 CounterfactualEvidence/LimitsPanel/ContextMap/FinalQuiz；新增 `src/chapters/Chapter9.tsx`、附录数据/局部样式；Review/Reset 只接已冻结公共接口。
- 禁止：前八章、Hero、公共导航和已冻结状态协议；不能为总结改全站风格。
- 依赖：Appendix F、Figure4/6、Table11–13；准确区分观察失败与人为扰动。
- 风险：13/127 外推、相对增益与百分点混淆、不同帧预算被隐藏、复习误清进度、测验正确数被当模型准确率。
- 验收：生成可靠性/反事实/计算与延迟/局限完整；数据条件可见；测验四题与解释、改选计分、Review 滚动、Reset 后所有章节实验状态恢复；没有额外第十章。

### F. 整站学术与交互验收

- 默认仅允许新增验收记录/截图/检查脚本；缺陷修改限确诊问题所属文件，任何冻结层变更单列影响范围后回归。禁止无关改写、依赖安装、自动提交部署。
- 依赖：A–E 逐章完成；可访问参考页和本地运行环境；素材出处齐备。
- 学术验收：逐项 claim→section/table/figure→版本；作者/会议/仓库状态更新；所有原图、数据、单位、帧预算、训练规模、失败类型核对；所有教学输出显式标记。
- 功能验收：1440/1280 桌面与 768/390/375/360 手机；Landing、每章首个模块及底栏截图；滚动长章、折叠、抽屉焦点、键盘、reduced-motion、刷新恢复、旧存储迁移、全站 Reset；每个核心实验至少两种不同输入产生可解释视觉差异。
- 工程验收：在后续允许写构建产物的阶段运行 typecheck/build；查控制台与网络错误、图片可用性、横向溢出、动画清理、逐章已冻结区域回归。通过才可宣布 V2 完成，不以组件存在代替验收。

## 10. 下一轮具体文件清单与完成界限

下一轮建议只授权阶段 A。具体现有改动清单：

1. `src/content.ts`：九章标题/稳定 ID、独立难度/作用/来源元数据；保留既有 benchmark 和 figure 数据。
2. `src/ChapterBodies.tsx`：按映射表重新组合现有内容，以 ID 关联，Final 进入 §9；不重写实验台。
3. `src/App.tsx`：公共壳引用、导航接入、全局状态适配、Review/Reset，移除来源当徽章和单模块编号逻辑。
4. `src/main.tsx`：导入参考 ppt-mode.css；保持样式顺序明确。
5. `src/styles/reference-tokens.css`：补齐锁定源码缺失的六个别名；不另造色板。
6. `src/styles/migration.css`：仅撤销/隔离 FlowMini 等固定层漂移，内容局部样式保留。

计划新增：`src/components/PptBars.tsx`、`FlowMini.tsx`、`ChapterBridge.tsx`、`Module.tsx`、`src/lib/useTutorialProgress.ts`、`src/styles/ppt-mode.css`。这些路径**目前不存在**，不能在报告中当成现有实现。若选择保留部分组件在 App.tsx，仍必须保持参考 DOM/class，不需要为拆文件而拆文件。

下一轮禁止触及：`src/Interactions.tsx` 的科学内容及交互重写（留 B–E）、`public/paper/*` 原件、`paper.html`、两份 ZIP、`package.json`/锁文件/配置、`README_INSPATIO_WORLD_REUSE.md`，以及全部历史证据文档。`reference-components.css` 已源码一致，应作为只读基线。

### 完成与未完成

- 已完成：先读固定规范；现有文件/章节/16组件/状态/资源/主要数据检查；Git 只读探测及障碍记录；固定 commit 12 文件源码核对；CSS 精确比较；13→9 映射、九章蓝图、A–F 计划及下一轮路径清单。
- 未完成：实际重构、Sidebar 补齐、动画/视频/Token 实验实现、固定 UI 浏览器对照、全交互运行验收、当前构建检查、CVF/代码发布现状复核、原图像素与全部论文数值的完整核验。均未冒称已完成。
- 本轮交付仅本文件；没有修改、删除、移动业务代码/素材/配置，没有安装依赖，没有 Git 写操作，没有部署。固定 UI 本轮仅报告差异，不能据此宣布验收冻结。
