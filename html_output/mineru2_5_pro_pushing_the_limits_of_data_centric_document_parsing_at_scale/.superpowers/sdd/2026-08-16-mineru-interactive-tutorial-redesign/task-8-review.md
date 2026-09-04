# Task 8 Independent Review

## VERDICT: FAIL

- **Spec compliance verdict: FAIL.** 旧 `StepConceptVisual`、`LearningLab`、`RealDocumentCases` 组件及其两个专用样式文件已删除；Hero、术语表、论文图片查看器、六章 registry、渐进解锁和 11 个显式 `widgetRegistry[...]` 映射均保留。App 的全解锁回归能到达六个具名体验，并断言旧壳、视频任务轨/进度轨和独立 checkpoint 不渲染。README 的六交互、媒体来源/限制、页尾按需 Bilibili、离线边界、已移除模式及无部署/PR 记录也符合 brief。唯一阻断项是绑定规格中的 420px 正文至少 16px、控件至少 44px 并未真正由当前 CSS 保证。
- **Task quality verdict: FAIL.** 测试、类型检查、validator、HTTP 和删除边界质量良好，但响应式验收采用了会被现有高优先级规则覆盖的通用选择器，且遗漏链接控件；实现报告和进度 ledger 随后把这项静态检查记为已满足，结论过度。
- 浏览器连接确实不可用；进度第 19 行和实现报告均明确写明 `Browser visual QA: NOT RUN — no browser connection available`，也把真实断网会话列为未观察项。本审查未因未运行真实浏览器 QA 判失败。

## Critical

无。

## Major

1. **420px 的 16px 正文和 44px 控件规则没有在实际级联中成立。**
   - **位置：** `src/styles/paper.css:876-882`；反例声明见 `src/styles/experience-data.css:14`、`src/styles/experience-labeling.css:4`、`src/styles/experience-training.css:4,40`、`src/styles/further-learning.css:25`、`src/styles/research-overview.css:220,309,423`；链接尺寸见 `src/styles/paper.css:73-87,416-419,789-792`。
   - **影响：** `main :is(p, li, dd, label, output) { font-size: 16px; }` 的 specificity 低于 `.data-counterfactual__hint`（13px）、`.data-counterfactual__result p`/`.experience-boundary`（12px）、`.cmcv-lane p`（12px）、`.training-timeline__header p`（13px）、`.mgam-puzzle__reference p`（13px）、延伸资源正文（13px）和研究问题正文（移动端可到 12px），所以这些学习者可见正文在 420px 仍小于 16px。控件规则只覆盖 `button/input/select/summary/[role="button"]`，没有覆盖普通链接；页头品牌链接在小屏由 40px 的 mark 撑高，页尾“阅读原论文”链接也没有 44px 的高度规则。该项同时推翻实现报告“16px body copy / 44px controls”的静态验收声明。
   - **建议：** 在所有组件样式之后增加同等或更高 specificity 的 420px 覆盖（或逐一修改这些正文选择器），确保真正的 computed font-size 不小于 16px；把交互链接纳入 44px 目标并用 `inline-flex`/padding 建立可点击高度。增加一个解析最终 CSS 或真实 computed style 的移动端回归，至少覆盖六个体验的一段正文、页头品牌和页尾论文链接。

## Minor

无。

## Verification notes

- `npm test`: PASS，14 files / 57 tests。
- `npx tsc --noEmit`: PASS。
- `node ..\PaperSkill\paper-skill\scripts\validate-output.js .`: PASS；6 chapters、11 active modules、11 component IDs registered。
- 独立 HTTP 复核：`/`、六个本地图片、六个 experience 源模块均为 200，13/13；临时 Vite job 已停止。
- 旧组件文件和两个专用样式文件不存在；`src/modules/registry.tsx:26-36` 仍有 11 个显式赋值，`src/experiences/registry.tsx:16-21` 仍有六个 chapter experience 映射；未发现 `animation: ... infinite` 或 `animation-iteration-count: infinite`。
- 严格 UTF-8 解码与 U+FFFD 扫描未发现异常；实现者报告的 197 是写入 Task 8 实现报告之前的扫描时点，当前项目自有文本文件数量增加不构成矛盾。
