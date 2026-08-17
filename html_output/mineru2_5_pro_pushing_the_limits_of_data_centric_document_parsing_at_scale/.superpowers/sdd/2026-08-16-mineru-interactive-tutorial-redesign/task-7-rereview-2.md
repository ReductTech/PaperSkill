# Task 7 Fix Round 2 — Scoped Re-review

## VERDICT: PASS

本轮只复核 round 1 的 iframe 键盘可用性 Major，以及该修复可能引入的 Critical/Major 回归；未修改实现文件，也未扩大到 Task 8。实现者已报告目标测试、全量测试、构建与结构校验通过，当前源码未显示矛盾，因此未重复相同验证。

## Original finding status

### Major — embedded player removed from keyboard sequence: ADDRESSED

- `src/components/FurtherLearning.tsx:31-34` 的焦点元素选择器现已包含 iframe。
- `src/components/FurtherLearning.tsx:128-134` 为 Bilibili iframe 设置 `tabIndex={0}`，键盘用户可进入播放器并操作其控件。
- modal 的父文档焦点顺序为关闭按钮 → iframe → 原页 fallback；`src/components/FurtherLearning.tsx:107-120` 仍只在父文档边界处循环首尾焦点，没有再次排除播放器。
- `src/components/FurtherLearning.test.tsx:84-110` 验证 iframe 的 `tabindex="0"`、可聚焦 DOM 顺序以及 fallback 与关闭按钮之间的正反向循环。
- sticky 关闭按钮、短视口滚动、背景 inert、iframe 销毁与焦点返回等 round 1 修复保持不变。

## New Critical/Major regressions

无。

跨域 iframe 内部的按键事件不会冒泡到父文档属于平台边界；本轮实现没有再通过移除 iframe 键盘访问来规避该边界，并保留了始终可见、可通过正常 Tab 路径返回的关闭按钮。因此不构成新的阻断 finding。

