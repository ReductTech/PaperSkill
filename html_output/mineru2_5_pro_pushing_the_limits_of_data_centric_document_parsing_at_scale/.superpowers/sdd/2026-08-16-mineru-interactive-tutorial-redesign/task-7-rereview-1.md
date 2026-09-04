# Task 7 Fix Round 1 — Scoped Re-review

## VERDICT: FAIL

本轮严格限定在原 Task 7 findings 及其修复引入的 Critical/Major 回归；未扩展审查 Task 8，也未因缺少浏览器连接判失败。实现者已报告相关测试、全量测试、构建与结构校验通过，源码与报告未见需要重复运行同一验证的矛盾。

## Original finding status

### Major — modal focus containment / short viewport: ADDRESSED

- `src/components/FurtherLearning.tsx:48-75` 为独立 body portal host 隔离其余 body children，并在关闭/卸载时恢复原 `inert` 与 `aria-hidden`。
- `src/components/FurtherLearning.tsx:84-120, 125-145` 将同意框与播放器统一置入全屏 modal layer，设置初始焦点并实现 Tab/Shift+Tab 循环。
- `src/styles/further-learning.css:37-45, 54-60` 增加全屏遮罩、`max-height: calc(100dvh - 24px)`、纵向滚动、受视口高度约束的 iframe 与 sticky header；关闭按钮不再因短视口被推出可达区域。
- 对应测试位于 `src/components/FurtherLearning.test.tsx:64-104`，覆盖背景 inert、双向焦点循环、恢复背景以及 portal/player close control。

### Minor — legacy CSS residue/cascade: ADDRESSED

- `src/styles/further-learning.css` 当前仅 61 行，旧 tabs、三阶段 task/self-check/preview 选择器已删除。
- `src/styles/further-learning.css:33-35` 使用独立 `.further-footer-glyph` 并显式定义 38×30 尺寸，不再继承旧 `.further-resource__glyph` 的 58×58 固定尺寸。

## Critical

无。

## Major

1. **修复把实际 Bilibili 播放器移出键盘顺序，导致键盘用户无法操作嵌入式播放。**
   - **位置：** `src/components/FurtherLearning.tsx:31-34, 128-134`；该行为还被 `src/components/FurtherLearning.test.tsx:98` 固化。
   - **影响：** iframe 被设置为 `tabIndex={-1}`，焦点查找器也明确排除 `iframe[tabindex="-1"]`。键盘用户从“播放视频”进入播放器对话框后，只能在关闭按钮和原页链接之间循环，无法 Tab 进 iframe 使用播放、暂停、音量、字幕或全屏等控件；嵌入式播放因此成为鼠标/触控专用功能。可访问的原页链接是 fallback，不能替代当前页面已经提供的播放器功能。原 modal/短视口问题虽然解决，但该规避方式引入了新的 Major 可访问性回归。
   - **建议：** 移除 iframe 的 `tabIndex={-1}`，把 iframe 视为 modal 内的合法焦点节点，并将循环顺序测试改为“关闭按钮 → iframe → 原页链接 → 关闭按钮”（反向同理）。保留 sticky close、视口滚动和背景 inert；对于焦点位于跨域 iframe 内时父页面无法捕获 Escape 的平台限制，不应以彻底禁止键盘进入播放器来换取 Escape，而应保证用户能通过正常 Tab/Shift+Tab 回到始终可见的关闭按钮。

## Minor

无新增 Minor；本轮 verdict 仅由上述新 Major 决定。

