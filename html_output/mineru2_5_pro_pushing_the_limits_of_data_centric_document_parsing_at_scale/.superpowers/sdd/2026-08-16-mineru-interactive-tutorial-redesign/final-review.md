# MinerU2.5-Pro 交互教程最终整项目审查

审查日期：2026-08-16  
审查基线：当前工作树（非 Git 工作区，不使用 commit SHA）  
审查标准：`superpowers:requesting-code-review` / code-reviewer

## FINAL VERDICT: NOT READY

没有 Critical，但有 4 个会直接破坏已批准教学/事实契约的 Important。自动化测试、构建和 PaperSkill validator 全部通过，不能覆盖这些内容与体验语义错误；修复以下 Important 并增加对应回归后再判 READY。

## Critical

无。

## Important

### 1. Hard 集结果把“主文比较项”误标为“第二名”

- 位置：`src/experiences/MgamMatchingPuzzle.tsx:108`；相关正确数据定义见 `src/data/facts.ts:25-29`，折叠证据说明见 `src/experiences/MgamMatchingPuzzle.tsx:118-119`。
- 问题：主结果面板显示“v2 主文第二名 92.01 / +2.07”。论文 v2 §6.2 的 92.01 是正文选用的 GLM-OCR / PaddleOCR-VL-1.5 比较项，不是排名第二；附录 Table 8 的实际第二名是 PaddleOCR-VL 92.48，对应领先 +1.60。组件自己的折叠说明已经区分两种口径，主面板却给出了错误排名标签。
- 用户影响：学习者会把 92.01 记为 Hard 集 runner-up，论文事实和数值口径被错误教学，而且高显著度主面板与低显著度证据区自相矛盾。
- 修复建议：把 92.01 明确标为“v2 主文比较项（GLM-OCR / PaddleOCR-VL-1.5）”；如需声称第二名，单独显示附录 Table 8 的 92.48 / +1.60。增加断言，禁止把 92.01 渲染为“第二名”。依据：[论文 v2 §6.2 与 Appendix Table 8](https://arxiv.org/html/2604.04771v2)。

### 2. Step 1 没有实现“进入视口后约 6 秒自动因果反转”

- 位置：`src/experiences/DataCounterfactual.tsx:13-17,36-38,62-74`；`src/styles/experience-data.css:8-14`。
- 问题：计时器在组件挂载时立即启动，没有 `IntersectionObserver` 或等价可见性门槛；6 秒后只把 `data-preview` 和提示文案改掉。样式表没有任何 `[data-preview]` 规则，车道激活和缺口覆盖仍完全取决于用户的 `choice === 'tail'`。因此既可能在屏外完成，也没有批准方案要求的“数量增加、覆盖仍偏窄 → 长尾补页、覆盖变宽”的自动视觉反转。
- 用户影响：六种体验节奏中的首个、也是建立数据因果链的自动演示退化成静态对照和提示换字；学习者无法先看到反事实再做选择。
- 修复建议：仅在体验首次进入视口后启动约 6 秒的普通页流入与长尾覆盖反转；用明确 preview phase 驱动车道/缺口视觉，用户选择仍是唯一持久化与完成来源；reduced-motion 直接落到关键终帧。增加“未进入视口不计时、进入后视觉状态实际改变、自动预览不触发完成”的回归。

### 3. 术语表没有覆盖体验中的首次就地出现

- 位置：`src/experiences/DdasMicroscope.tsx:78,116`；`src/experiences/CmcvRoutingChallenge.tsx:72-75`；`src/experiences/TrainingTimeline.tsx:107,114,116-117,147`；`src/experiences/MgamMatchingPuzzle.tsx:58`。
- 问题：体验主操作面直接以普通文本显示 `512 维 ViT-base`、`K-Means`、Easy/Medium/Hard、Stage、Replay、rollout、各任务 metric、Held-out Test 等核心术语，没有使用现有 `Term` / `GlossaryText` 就地入口。页头/章节文案只覆盖了其中一部分，不能保证学习者在首次需要理解的操作点打开定义。
- 用户影响：学习者必须离开当前因果步骤去顶部总索引查找，未满足“高密度术语在 point-of-use 可达”的批准契约，且体验文案与全局 glossary 形成两套脱节的教学层。
- 修复建议：按每章首次学习者可见出现包裹 `Term` / `GlossaryText`，至少覆盖上述 sampling、routing、training、reward 与 evaluation 术语；保留每章一次首现，避免反复链接造成噪声。增加代表性体验术语按钮与打开定义的测试。

### 4. OmniDocBench 的集中 forbidden claims 没有写出两条关键禁推断

- 位置：`src/data/media.ts:32-34`，由 Omni 资产在 `src/data/media.ts:98,117,136` 复用。
- 问题：集中声明只说“不是性能证据”和“不能作为 296 页 Hard 训练隔离的独立证明”。批准口径要求在所有相关原图/裁图查看上下文明确写出：“不是 MinerU2.5-Pro 训练样本”和“不能默认视为 296 页 Hard”。当前措辞没有否定第一种推断，对第二种也只否定“独立证明”，仍允许用户把图默认当作 Hard 页；局部场景并没有全部补齐这两条。
- 用户影响：这些图被放在采样、路由、渲染修复等教学流程中，容易被误读为实际训练页或 296 Hard 样本；放大 viewer 又会继承同一组较弱声明。
- 修复建议：在 `OMNI_FORBIDDEN_CLAIMS` 中加入两条精确禁推断，并让所有 Omni crop / viewer 统一继承；现有“不是性能证据”等附加边界可继续保留。用 registry 与 viewer 测试断言精确文本。

## Minor

### 1. 打开全局术语表不会暂停正在运行的动画

- 位置：`src/hooks/usePlaybackTimeline.ts:91-98`；`src/components/Glossary.tsx:376-386`；`src/components/ResearchProblemOverview.tsx:184,228`。
- 问题：时间线只在 `document.hidden` 时暂停；GlossaryProvider 的 `activePanel` 没有向体验暴露统一暂停信号。开场动画只在其自身区域点击 `.glossary-term` 时停止，从页头术语按钮打开也不会暂停。
- 用户影响：学习者阅读术语定义时，背后的时间线/自动叙事仍会前进，关闭后返回到不同状态。
- 修复建议：由 GlossaryProvider 暴露 modal-open/attention-pause 状态或统一事件；所有自动时间线保存 elapsed time 后暂停，关闭时不强制自动恢复。增加从页头打开 glossary 的计时器暂停回归。

## Requirements trace

| 要求 | 结论 | 证据/说明 |
|---|---|---|
| 教学因果链与去重 | PARTIAL | 开场问题→Data Engine→训练→评测链条与 1.2B 控制变量正确；唯一完整播放器成立；但 Step 1 自动反转缺失（Important 2）。 |
| 论文事实与数值口径 | FAIL | 92.98→95.69、端点 +2.71、分段 +2.72、65.5M/3.9M/192K、G=16 等与论文 v2 一致；Hard “第二名”标签错误（Important 1）。 |
| 六种体验、完成门槛与恢复 | PASS（自动化 + 静态） | 六体验 registry、操作后状态/说明、Step 5 Stage 3 排序、Step 6 正确分块、保存/恢复/重置均有现有测试覆盖；58/58 测试通过。 |
| 渐进解锁、hash、glossary | PARTIAL | 解锁、锁定 hash、错误 chapter/module、primer 与恢复测试通过；glossary 就地覆盖和打开暂停不完整（Important 3、Minor 1）。 |
| 真实媒体 allowed/forbidden claims | PARTIAL | 媒体注册、crop、fallback、viewer 上下文已集中化；Omni 两条关键禁推断未精确落地（Important 4）。 |
| Bilibili 页尾 consent / keyboard | PASS（自动化 + 静态） | 仅 Step 6 后页尾出现；每页一次 consent、portal/inert、焦点返回、iframe 删除与 Tab 顺序有测试；真实跨域 iframe 键盘行为未浏览器验证。 |
| 离线边界 | PASS（静态） | 教程媒体均为本地资产，源码未发现 fetch/XHR/WebSocket；仅用户同意后页尾 iframe 联网。真实断网会话未验证。 |
| 420px 响应式级联 | PASS（CSS 测试 + 静态） | 16px 正文、44px 控件、单列/横向 rail、anchor offset 与 reduced-motion 规则有回归；真实 360×800 / 420px 视觉未验证。 |
| PaperSkill 6 章 / 11 模块兼容 | PASS（官方 validator） | 6 chapters、11 active modules、11/11 componentId registrations。 |
| 旧四分钟/极速/独立视频模式移除 | PASS（源码扫描） | 旧 runtime shell 标识在非测试源码中 0 命中；README 只以“没有这些模式”说明边界。 |

## 验证范围

### 本轮新鲜执行并验证

- `npm test`：14 个 test files、58 个 tests，全部 PASS。
- `npm run build`：TypeScript + Vite PASS，65 modules transformed。
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`：PASS；6 chapters、11 active modules、11 component IDs。
- 旧 runtime 标识扫描：非测试 `src` 中 0 命中。
- 源码联网调用扫描：非测试 `src` 中 `fetch` / axios / XHR / WebSocket / EventSource 0 命中。
- CSS 无限动画声明扫描：0 命中。
- 论文 v2 主文、表 5、表 8 与附录 Table 8 的相关数值已同官方 arXiv HTML 逐项核对。

### 仅静态/自动化验证

- 六体验的 DOM 状态、完成与恢复；hash 错误输入；媒体 fallback/viewer 语义；Bilibili portal、inert 与父文档焦点循环。
- 420px CSS 级联、触控目标、横向 rail、reduced-motion 与无无限动画。
- 本地媒体/offline 架构边界；未把“没有运行时联网 API”扩大解释成真实断网环境已经通过。

### 未验证

- 浏览器连接为空，因此没有做 1366×768、420px、360×800 和短视口的真实视觉 QA；这本身不作为失败依据。
- 没有在真实跨域 Bilibili iframe 中验证原生 Tab/Shift+Tab、Escape、焦点返回与加载失败体验。
- 没有运行真实断网会话、屏幕阅读器或触屏设备测试。
- Paper figure viewer 的桌面居中、移动端 bottom-sheet、遮罩与 sticky close 只由源码/CSS/JSDOM 证实，未做真实渲染确认。

