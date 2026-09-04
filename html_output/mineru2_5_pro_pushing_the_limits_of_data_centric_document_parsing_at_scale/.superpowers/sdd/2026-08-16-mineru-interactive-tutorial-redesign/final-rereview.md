# MinerU2.5-Pro 最终统一修复 scoped re-review

审查日期：2026-08-16  
审查范围：`final-review.md` 的 4 个 Important + 1 个 Minor，以及 `final-fix-rereview.diff` 所代表的统一修复波次是否引入新的 Critical / Important。  
审查基线：当前非 Git 工作树；已完整读取原 findings、fix report、1493 行 diff package、package 头列出的 4 个无同刻 baseline 文件和当前相关源码/测试。

## FINAL VERDICT: READY

原 4 个 Important + 1 个 Minor 均为 **ADDRESSED**。本修复波次未发现新增 Critical 或 Important；在本轮唯一 scoped re-review 后没有需要第二修复波次处理的残余阻断项。

## 原 findings 逐项判定

| # | 原 finding | 判定 | 当前证据 |
|---|---|---|---|
| Important 1 | 92.01 / +2.07 被误称为“主文第二名” | **ADDRESSED** | `src/experiences/MgamMatchingPuzzle.tsx:109` 已改为“v2 主文比较项（GLM-OCR / PaddleOCR-VL-1.5）”；保留模块 `src/modules/results-boundary.tsx:150` 同步修正。非测试源码错误标签扫描 0 命中；MGAM 回归同时断言正确标签和旧标签缺席。 |
| Important 2 | Step 1 没有进入视口后的约 6 秒自动视觉反转 | **ADDRESSED** | `src/experiences/DataCounterfactual.tsx:24-38` 以一次性 `IntersectionObserver` 门控；`:40-55` 在 2.5/3.5/4.5/6 秒推进普通页、公式、表格、多栏与完成 phase；`:85-91,119-136` 用 phase 驱动车道 `data-active` 和缺口 `data-covered`。`:57-62,73-81` 支持 glossary/用户接管并清除自动路径；reduced-motion 在 `:42-45` 直接进入稳定终帧。自动路径不调用持久化或 `onComplete`，只有用户选择 tail 才在 `:73-81` 完成。5 个专项测试覆盖屏外不计时、视觉 phase、用户接管、reduced-motion、自动不完成和 attention pause。 |
| Important 3 | 四章核心术语缺少 point-of-use glossary | **ADDRESSED** | DDAS：`src/experiences/DdasMicroscope.tsx:78-79,117`；CMCV：`src/experiences/CmcvRoutingChallenge.tsx:48,64`；Training：`src/experiences/TrainingTimeline.tsx:100,108-111,148`；MGAM：`src/experiences/MgamMatchingPuzzle.tsx:59`。对应 glossary id 均存在且代表性点击测试打开正确定义。TypeScript JSX AST 审计确认这四个文件中 `Term` 嵌入原生 `button` 为 0。 |
| Important 4 | Omni 缺少两条精确 forbidden claims | **ADDRESSED** | `src/data/media.ts:32-37` 集中声明“不是 MinerU2.5-Pro 训练样本”及“不能默认视为 OmniDocBench v1.6 的296页Hard子集”，由 `omni-output`、`omni-layout`、`omni-table` 统一复用。`src/components/PaperMedia.tsx:36-39,52-60` 将 registry boundary 传给 viewer；`src/components/PaperMedia.test.tsx:25-36` 验证完整图片 dialog 同时显示两条声明。 |
| Minor 1 | 打开全局 glossary 不暂停动画 | **ADDRESSED** | `src/components/Glossary.tsx:65-66,174-176,642-648` 提供单一 attention context；`src/hooks/usePlaybackTimeline.ts:27,54,102-104` 在 glossary 打开时保存当前 `currentRef` 位置并停止 RAF；`src/components/ResearchProblemOverview.tsx:149-183,199-203` 保留当前因果步骤；`src/experiences/DataCounterfactual.tsx:10,57-62` 冻结当前 preview phase。三者在关闭 glossary 后都没有自动恢复路径，专项回归验证时间/步骤/phase 保持不变。 |

## 本波次新增 Critical / Important

- Critical：无。
- Important：无。

代码结构上，attention signal 由 provider 单向下发，未改变 glossary 的打开/关闭与 hash 契约；新增术语入口没有嵌套交互控件；Step 1 自动预览仍与用户状态持久化和完成门槛分离；媒体修复继续复用集中 registry，没有产生场景间声明漂移。

## 新鲜验证

- 修复范围定向测试：10 files / 40 tests，全部 PASS。
- 全量 `npm test`：15 files / 67 tests，全部 PASS。
- `npm run build`：TypeScript + Vite PASS，65 modules transformed。
- 官方 PaperSkill validator：PASS；6 chapters、11 active modules、11/11 component IDs。
- JSX AST 审计：四个新增术语体验中 `Term` 嵌套原生 `button` 为 0。
- 错误 MGAM `92.01 = 第二名` 非测试源码扫描：0 命中。
- 两条 Omni 精确禁推断：集中 registry 均命中并由 viewer 行为测试覆盖。

## 验证边界

- 本轮没有浏览器连接，因此新增术语入口、Step 1 phase 过渡及 glossary popover 的真实排版/视觉仍未进行浏览器 QA；这与原报告中的既有未验证边界相同，不构成本次源码可证实失败。
- 真实跨域 Bilibili、真实断网、屏幕阅读器与触屏设备不在本次统一修复 diff 范围，未重复验证。
- 本轮只做 scoped re-review；未修改产品源码、测试、README 或修复报告，仅新增本审查报告。

