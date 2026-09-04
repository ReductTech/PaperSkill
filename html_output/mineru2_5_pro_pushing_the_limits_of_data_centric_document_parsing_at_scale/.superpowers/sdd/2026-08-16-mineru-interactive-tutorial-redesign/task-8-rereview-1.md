# Task 8 Fix Round 1 — Scoped Re-review

## VERDICT: PASS

本轮只复核原审查中 420px 正文 16px、交互控件与链接 44px 的 Major，以及修复引入的 Critical/Major 回归；未修改实现文件。原 finding 已完整解决，未发现新的 Critical 或 Major。

## Original finding status

### Major — 420px 正文字号和交互目标下限未在最终级联中成立：ADDRESSED

- `src/styles/paper.css:876-894` 现在以 `#root .app main` 限定教程正文，并对 `p/li/dd/label/output` 使用 `16px !important`；portal 中的延伸学习、术语表和论文图片查看器正文也有对应限定。该声明能覆盖原 finding 中 12–15px 的组件规则，包括自身带 `!important` 的延伸视频边界正文。
- 同一 media query 以 `body a[href]` 覆盖所有当前链接，并用 `inline-flex`、`min-width/min-height: 44px !important` 建立真实二维目标；按钮、非 hidden input、select、summary 和 `[role="button"]` 也统一获得 44×44 最小尺寸。原来约 40px 的品牌链接和无高度约束的页尾论文链接因此均被覆盖。
- `src/App.test.tsx:6-180,375-405` 的回归不是只检查声明文本：它解析全部实际加载的 CSS，展开适用于 420px 的 media rules，以 `Element.matches` 找到命中声明，再按 `!important`、selector specificity 和 source order 选择 winner。测试分别以 paper-first 和 paper-last 运行，包含六个体验、研究区、延伸区的八处正文以及品牌/页尾链接和 button/summary/input。原 CSS 的 13px RED 与当前 16/16 GREEN 记录和源码机制一致。
- 测试的级联模型未实现继承、CSS layers 和所有复杂 selector 语法，但本 finding 的目标属性均直接声明在受测元素上，项目没有 cascade layers，相关 selector 只使用其已处理的普通 ID/class/type、attribute 和 `:is/:not`。因此这些简化不会让本轮结果成为假阳性。

## New Critical/Major regressions

无。

ID-scoped `!important` 只在 420px 以下作用于教程正文语义元素；它没有改 display、position、grid 或 overflow。全局链接在该断点改为 `inline-flex`，但当前链接用途均为导航/动作/来源链接，原有 flex/grid item 关系仍成立；4px 仅为 block-axis padding，不额外扩大横向宽度。控件最小宽高会扩大窄小控件，但这正是绑定的 44px 目标，没有发现会遮挡或移除交互语义的源码路径。

## Verification

- `npm test -- src/App.test.tsx`: PASS，1 file / 16 tests。
- `npm test`: PASS，14 files / 58 tests。
- `npx tsc --noEmit`: PASS。
- 浏览器连接仍不可用；实现报告继续明确区分静态级联验证与未运行的真实 viewport/interaction QA，本轮不因该环境限制判失败。
