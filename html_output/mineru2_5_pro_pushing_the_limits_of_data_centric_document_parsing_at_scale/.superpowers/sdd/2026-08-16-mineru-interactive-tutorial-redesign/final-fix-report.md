# MinerU2.5-Pro 最终统一修复报告

日期：2026-08-16  
范围：`final-review.md` 的 4 个 Important + 1 个 Minor；未部署、未创建 PR、未初始化或修改 Git 历史。

## 状态

最终审查列出的五项已在同一修复波次内实现，并通过对应行为回归、全量测试、构建、官方 validator 与静态边界扫描。保留 6 章、11 个 active modules、11 个显式 componentId registrations，以及离线核心边界。

## RED → GREEN 证据

### A. MGAM Hard 比较口径

- 根因：主体验把 v2 正文使用的 `92.01 / +2.07` 比较项误标为“第二名”；保留的 dormant `results-boundary` 模块也有相同残留。
- RED：`npx vitest run src/experiences/MgamMatchingPuzzle.test.tsx -t "keeps held-out GT fixed"` — 1/1 FAIL，缺少“v2 主文比较项（GLM-OCR / PaddleOCR-VL-1.5）”，DOM 仍显示“v2 主文第二名”。
- 修复：主体验和保留模块统一写为“v2 主文比较项（GLM-OCR / PaddleOCR-VL-1.5）”；附录 Table 8 的真正 runner-up `92.48 / +1.60` 继续只在独立证据口径中出现。
- GREEN：`npx vitest run src/experiences/MgamMatchingPuzzle.test.tsx` — 7/7 PASS；错误标签静态扫描 0 命中。

### B. Step 1 可见后一次性因果预览

- 根因：原计时器在 mount 时启动，6 秒后只改提示标志；preview 不控制车道或三个缺口。
- RED：`npx vitest run src/experiences/DataCounterfactual.test.tsx -t "waits for first visibility"` — 1/1 FAIL；屏外推进 6 秒后得到 `tail-previewed`，预期仍为 `waiting`。
- 修复：用一次性 `IntersectionObserver` 门槛启动约 6 秒 phase：`ordinary-arriving → tail-formula → tail-table → tail-multicolumn → complete`；phase 直接控制两条车道的 `data-active` 和三个缺口的 `data-covered`。用户操作立即转入 `user-ordinary|user-tail` 并清除自动计时；只有用户路径上报状态/完成。reduced-motion 在首次可见时直接落到稳定终帧。
- GREEN：`npx vitest run src/experiences/DataCounterfactual.test.tsx` — 5/5 PASS，覆盖屏外不计时、phase 视觉状态、无自动持久化、用户接管、reduced-motion 与 glossary pause。

### C. 四章 point-of-use glossary

- 根因：DDAS、CMCV、Training、MGAM 的主操作现场只显示普通文本，学习者无法在当前因果步骤打开定义。
- RED：四个体验文件以 `-t "opens the"` 定向运行 — 4/4 代表性测试 FAIL，均因对应可访问术语按钮不存在。
- 修复：
  - DDAS：DDAS、ViT-base、K-Means；
  - CMCV：CMCV 与 Easy / Medium / Hard 分流口径；
  - Training：GRPO、三阶段、Replay、Rollout、任务奖励及当前 Edit Distance / CDM / TEDS / IoU；
  - MGAM：MGAM 与 Held-out Test。
  所有入口位于主操作现场的非 button 容器中，没有 button 嵌套；每个核心术语只保留一次强调入口，装饰性 Replay 文本收敛为循环符号以避免重复。
- GREEN：DDAS / CMCV / Training 定向全文件 15/15 PASS，MGAM 7/7 PASS；代表性点击分别打开 K-Means、Medium、任务奖励/编辑距离、隔离测试集的正确定义。

### D. Omni forbidden claims

- 根因：集中 registry 只禁止“性能证据”和“训练隔离独立证明”，没有精确否定训练样本与 296 页 Hard 默认归属。
- RED：`npx vitest run src/data/media.test.ts src/components/PaperMedia.test.tsx -t "forbids|portal dialog"` — 2/2 FAIL；registry 与 viewer 均缺少两条精确文本。
- 修复：`OMNI_FORBIDDEN_CLAIMS` 集中加入“不是 MinerU2.5-Pro 训练样本。”与“不能默认视为 OmniDocBench v1.6 的296页Hard子集。”；`omni-output`、`omni-layout`、`omni-table` 及其 crop viewer 继续统一继承。
- GREEN：`npx vitest run src/data/media.test.ts src/components/PaperMedia.test.tsx` — 5/5 PASS。

### E. Glossary attention pause

- 根因：GlossaryProvider 的 `activePanel` 没有提供给自动叙事；各播放器只知道自己的局部状态或 document visibility。
- RED：DataCounterfactual、ResearchProblemOverview、usePlaybackTimeline 三个 provider/header 回归 — 3/3 FAIL；打开全局术语表后 phase、因果步骤和 elapsed time 继续推进。
- 修复：GlossaryProvider 提供唯一的 `GlossaryAttentionContext<boolean>`，并导出 `useGlossaryAttentionPause()`。DataCounterfactual 保存当前 preview phase 后停止未到期计时，ResearchProblemOverview 保留当前 step 并停止 autoRunning，usePlaybackTimeline 保留 `currentRef` elapsed 并取消 RAF。关闭面板只清除 attention 信号，不触发任何自动恢复；用户可用原有选择、重播或播放控件继续。
- GREEN：`npx vitest run src/experiences/DataCounterfactual.test.tsx src/components/ResearchProblemOverview.test.tsx src/hooks/usePlaybackTimeline.test.tsx` — 9/9 PASS。

## 新鲜全量验证

- `npm test`：PASS，15 files / 67 tests。
- `npm run build`：PASS，TypeScript + Vite，65 modules transformed。
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`：PASS；6 chapters、11 active modules、11/11 component IDs。
- Legacy runtime scan：0 命中。
- 非测试源码运行时联网 API scan（fetch / axios / XHR / WebSocket / EventSource）：0 命中。
- CSS infinite animation scan：0 命中。
- 错误 MGAM `92.01 = 第二名` 标签 scan：0 命中。
- Strict UTF-8 / U+FFFD：PASS；224 个 project-owned text files，0 invalid UTF-8，0 files containing U+FFFD。

## Concerns / 未验证

- 浏览器连接仍为 `[]`，因此没有进行 1366×768、420px、360×800、短视口或真实 reduced-motion 的视觉 QA；本报告不把测试/构建当作视觉实测。
- 未在真实跨域 Bilibili iframe、真实断网会话、屏幕阅读器、触屏设备上复验。
- glossary popover、Step 1 phase 过渡与新增 point-of-use 入口的真实排版只由源码、CSS 与 JSDOM 行为覆盖，尚无浏览器渲染证据。

## 修改范围

只修改了上述修复所需的 glossary/pause 状态链、四个体验的术语入口、Step 1、MGAM/保留结果模块、media registry 及对应测试；另新增本报告并追加 progress。没有部署、PR 或 Git 操作。
