# Act2See PaperSkill V2 · 第 2 轮 B 固定 UI 对齐报告

日期：2026-10-29（Asia/Shanghai）。工程：`E:\PaperSkill_projects\Act2See_web`。根目录没有 Git 仓库；未执行 `git init`、commit、push 或部署。

## 1. 修改前保护与校验

- 新快照：`E:\PaperSkill_projects\Act2See_web_V2_roundA_snapshot_20261029`。与旧 `Act2See_web_V1_backup_20261029` 分开，旧备份未覆盖、删除或移动。
- 快照包含业务源码、配置、README、docs、public、锁文件及 `src.zip`、`public.zip`，共 **33 个文件**；排除 `node_modules`、`dist`、`tsconfig.tsbuildinfo` 和后建的 `.research`。修改前 31 个文件逐项 SHA256 相同，随后补入两份历史压缩包并逐项校验相同，总计 **33/33**。
- 修改前拟变动文件 SHA256：`App.tsx` `B1B90BB6323583F72695304E085E607AEFC94BB6562D3198566907A394662A61`；`main.tsx` `B305B4718F6F9DA97867D66DB738488E96DDB0553F4321EE7604A7C32BCF7847`；`reference-tokens.css` `6FDF87CCC7399F8B98A0FB05498CE082E27D58847637DA8B24703D3D785B8D3E`；`migration.css` `87A9003E27C7F73BA2A27FF7C8E3EA9F61101E13D6EB566278A8571F99939085`。
- 修改后，快照中除上述四个允许修改文件外，**29 个原文件 SHA256 均未变化**。包括 `content.ts`、`ChapterBodies.tsx`、`Interactions.tsx`、`tutorialProgress.ts`、`reference-components.css`、四幅论文图、`paper.html`、历史报告、配置、锁文件与 README。

## 2. 唯一参考与组件来源

固定版本：ReductTech/PaperSkill commit [`a94f6089b9c0b7a83947e854a5014403ca3975e1`](https://github.com/ReductTech/PaperSkill/tree/a94f6089b9c0b7a83947e854a5014403ca3975e1/html_output/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816)。本轮实际取得下列十个 raw 源文件，HTTP 均为 200，核对副本位于 `.research/locked-reference` 的对应子树。

| 参考文件 | 本轮用途 |
|---|---|
| `src/components/PptBars.tsx` | Sidebar、移动抽屉、底栏的 JSX、`.slide-*` class 与滚动参考线 |
| `src/styles/ppt-mode.css` | 288px 桌面 Sidebar、280px 移动抽屉、底栏与正文让位样式；整体复制后追加确诊修复 |
| `src/components/FlowMini.tsx` | `Fragment`、`.flow-arrow`、`div.flow-step[data-step]` DOM |
| `src/components/ChapterBridge.tsx` | `.chap-bridge/.cb-icon/.cb-body/.cb-title/.cb-text` |
| `src/components/Module.tsx` | `.module/.module-head/.num/h4/.module-body` |
| `src/components/Hero.tsx` | 已有 Hero 外壳及双栏 class 核对，论文专属画面未动 |
| `src/styles/tokens.css` | 六个字体 token 别名核对 |
| `src/styles/components.css` | 公共组件 CSS 核对，现有 `reference-components.css` 保持不变 |
| `src/App.tsx` | 章节壳、渐进揭示与 PptBars 挂载位置核对 |
| `src/lib/useProgressiveChapters.ts` | 只借鉴揭示语义，运行状态仍由本地 v2 协议管理 |

参考部署页：[InSpatio-World](https://reducttech.github.io/PaperSkill/papers/inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling/lyaqiqi0816/)。本轮 web 工具提示不可访问；浏览器尝试打开也超时。因此**没有完成参考页与本地页的同视口像素对照**，不能将源码对齐写成像素级验收通过。

## 3. 文件变动与 DOM/class 对照

| 文件 | 变动 |
|---|---|
| `src/components/PptBars.tsx`（新增） | 沿用参考 `.slide-layout.ppt-overlay`、`.slide-sidebar`、`.slide-sidebar-header`、`.slide-sidebar-nav`、`.slide-sidebar-item`、`.slide-sidebar-num`、`.slide-sidebar-text`、`.slide-sidebar-toggle`、`.slide-sidebar-overlay`、`.slide-sidebar-collapse`、`.slide-nav`、`.slide-nav-btn`、`.slide-nav-counter`。导航接入共享 v2 状态；补移动焦点管理与 aria。 |
| `src/styles/ppt-mode.css`（新增） | 复制锁定 CSS；末尾补固定 Sidebar 显式视口高度、窄屏底栏内边距与字号、减少动效规则。 |
| `src/App.tsx` | `FlowMini` 换成参考 DOM；挂载 PptBars；统一 30% 视口参考线；导航只解锁及请求滚动，实际滚动后才同步 `activeId`。 |
| `src/main.tsx` | 在 `reference-components.css` 后导入 `ppt-mode.css`。 |
| `src/styles/reference-tokens.css` | 只补参考源码六个 `inherit` 字体 token 别名，实际值由 `ppt-mode.css` 提供。 |
| `src/styles/migration.css` | 删除本地 `.flow-pair` 包装及 FlowMini 宽度、gap、字号的固定层覆盖；论文内容局部样式保留。 |

Sidebar DOM 映射：顶部标识/完整英文论文标题为 `.slide-sidebar-header` 内的 venue/title；§1–§9 来自 `content.ts::chapters`，每项为 `.slide-sidebar-item`；当前项 `.active`，尚未揭示项 `.is-locked`。底栏 DOM 映射：`.slide-nav` 内依次为上一章按钮、`N / 9` counter、下一章按钮。展开/折叠使用参考的 `.sidebar-collapsed` 与根元素 `ppt-sidebar-collapsed`，正文与底栏随之对齐。

## 4. 九章导航与状态协议

- `chapters` 仍是原九个 ID、标题、顺序和 `difficulty`；Landing 不计章，FinalQuiz 仍在 `#reliability`（§9）的 `#final` 内。无第十章按钮。
- 只读写 `act2see-tutorial-v2`：`unlocked` 表示揭示范围，`completed` 仅由章节“继续学习”入口推进，`activeId` 由实际滚动位置计算，`review` 表示复习状态。没有建立 Sidebar 自有存储，也没有覆盖 `act2see-tutorial-v1`。
- Sidebar 点击未揭示章节一次揭示至该目标，但不写入 `completed`；已揭示章节直接导航。底栏从实际当前章前后移动；§9 时下一章禁用。导航与章节入口共用 App 的一次滚动请求，避免双重 `scrollIntoView`。平滑滚动过程中 counter 随 `activeId` 逐步更新。
- `FlowMini` 的 `revealed` 仍代表 `unlocked`，不表示分数或已通过章数。`parseV2`、v1 前缀迁移、异常 localStorage 与 reset 容错代码未修改。

## 5. 浏览器与构建验收

本地开发页在真实 Chromium 浏览器打开；用户指出的 `http://127.0.0.1:5173/` 可访问，并确认显示本轮 Sidebar。我另启的验收服务为 `http://localhost:5174/`。测试使用 1440×900、1280×844、768×844、390×844、375×844、360×800 视口；各宽度均无正向横向溢出。1440px 下桌面 Sidebar 实测 288px，补高度后覆盖完整 900px 视口；768px 及以下目录为 280px 抽屉，底栏按钮可见。1280px 的宽度读数曾在过渡中短暂为 283px，稳定规则为 288px。

实际交互覆盖：Landing 开始学习；§1 继续到 §2；直接点未解锁 §9 后页面挂载九章而 §1 的继续入口仍在（未制造提前完成）；底栏 §9 下一章禁用、上一章到 §8、再下一章回 §9；§9 FinalQuiz 位于 §9；复习返回 §1；Reset 返回 Landing；刷新后两章揭示状态恢复。长章滚动时 Sidebar 与底栏共用当前章。移动抽屉打开后焦点进入第一项，末项 Tab 回第一项，Esc 关闭并回到目录按钮；点击章节关闭抽屉，点击抽屉外遮罩关闭；关闭抽屉的按钮具有 `inert`，不可 Tab 进入。浏览器控制台测试期间无 error 日志。

`npm run typecheck`：通过。`node scripts/check-progress.mjs`：通过（v1 迁移、畸形数据、v2 恢复与存储失败）。`npm run build`：通过；Vite/Rolldown 对依赖 `lucide-react` 的 `use client` 给出两条非阻断提示。未安装依赖。

减少动画：`reference-components.css` 原有 reduced-motion 下的 `scroll-behavior: auto`，App 的导航使用 `matchMedia` 改为 instant，新增 Sidebar/底栏过渡关闭规则。**未在浏览器中模拟 OS reduced-motion 偏好**，此项仍待实际开关复验。

## 6. 冻结范围与待复验

本轮完成源码对齐并保持冻结的公共层：Hero 外壳和双栏容器、Chapter Header/§编号/Difficulty Badge、FlowMini、ChapterBridge、Module/subsection、公共按钮与 `reference-components.css`、页面 tokens、Sidebar/底栏 `.slide-*` 骨架。HeroCompare 内部画面、Landing 论文标题/元信息、九章正文和顺序、Interactions 科学数据、四幅论文图均未修改。

待复验：参考部署页可访问时，用相同六个视口并排截图核对像素；实机/浏览器 reduced-motion 开关；不同移动浏览器的安全区与底栏覆盖。当前结论为**锁定源码对齐与本地浏览器功能通过，参考页视觉对照未完成**。
