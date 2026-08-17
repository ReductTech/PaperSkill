# Task 7 Independent Review

## VERDICT: FAIL

- **Spec compliance verdict: PASS.** 绑定规格均由当前源码满足：`FurtherLearning` 只挂在第 6 步研究方向之后；当前数据产生恰好 3 个播放入口；首次播放先征求同意、同一挂载内后续直开且状态只存于 React 内存；iframe 在同意前不存在并在关闭或父文档收到 Escape 后卸载、焦点返回触发按钮；iframe `src` 经 `getMediaAsset(videoAssetId).src` 解析，三个 ID 均指向 `MEDIA_ASSETS` 的 `external-video`；每项视频均保留 provider、原页、边界、一个 why 和两个 watch-for；primary/foundation 条目完整；六项研究方向仍在三列两行的独立紫色研究区；实现报告中的 6 章、11 active modules、11 IDs 验证与源码未见矛盾。未发现部署或 PR 行为。
- **Task quality verdict: FAIL.** 核心功能正确，但新模态播放器存在一项 Major 级键盘/响应式缺陷；另有遗留 CSS 清理问题。
- 按要求未因浏览器连接缺失判失败，也未重复实现者已经报告通过的同一测试与构建命令。本结论基于 brief、实现报告、no-index diff 和当前源码审查。

## Critical

无。

## Major

1. **“模态”对话框没有真正限制背景交互，播放器在短视口还可能把关闭控件移出可视区。**
   - **位置：** `src/components/FurtherLearning.tsx:124-139`；`src/styles/further-learning.css:654-663, 670-674`。
   - **影响：** 两个界面都声明了 `aria-modal="true"`，但没有 focus trap，也没有给页面其余部分设置 `inert`；键盘 Tab 可以离开对话框进入背后的教程。播放器甚至没有覆盖层。与此同时，播放器仅固定居中，未设置 `max-height` 或纵向滚动；iframe 最小高度按 `54vw`（最高 460px）计算。在手机横屏或低高度桌面窗口中，播放器总高度可超过视口，使顶部标题和关闭按钮移出屏幕。焦点进入跨域 iframe 后，父文档的 Escape 监听也不能可靠接收 iframe 内的按键，因此用户可能无法方便地退出。实现测试只验证父文档焦点仍在按钮时的 Escape，未覆盖这些实际键盘路径。
   - **建议：** 将同意框和播放器统一放入全屏 modal layer/portal；打开时让背景 `inert`（并正确恢复），把 Tab/Shift+Tab 约束在模态内；为播放器设置 `max-height: calc(100dvh - ...)` 与 `overflow-y: auto`，并让 iframe 使用受视口高度约束的 aspect-ratio 容器。增加低高度视口与 Tab/Shift+Tab 的测试，至少确保关闭按钮始终可见、可达。

## Minor

1. **旧三阶段资源 UI 的 CSS 基本全部保留，并与新组件选择器发生残余叠加。**
   - **位置：** `src/styles/further-learning.css:35-629`，尤其旧 `.further-resource__glyph` 的固定 `width/height: 58px` 在 `161-169`，而新规则 `631-674` 只追加覆盖、没有重置该宽高。
   - **影响：** 已删除的 tabs、task stage、self-check、preview 等大量样式继续存在，增加维护成本和回归面；新卡片复用了 `.further-resource__glyph`，因此旧 58×58 尺寸仍生效，削弱“紧凑页尾”样式的可预测性。
   - **建议：** 删除不再有对应 DOM 的旧规则，或为新页尾组件使用独立命名空间；显式定义新 glyph 的实际 `width`/`height`，避免依赖旧规则的偶然级联。

