# THE ADAPTIVE ENGINE — 设计与修订记录

副标题：有限的预算，如何做出最重要的改变？

当前默认版已按机器人故事重新组织 ACT 0–9。最新呈现、记录规则和逐章五问验收见 [Robot-Revision.md](Robot-Revision.md)。下面的早期方案及 ACT*-Review 是历史记录，不能当作新版交互的逐项说明。

| 交付要求 | 文件与位置 |
| --- | --- |
| 1. 完整 Storyboard | Storyboard.md 第 1–2 节，ACT 0–9 |
| 2. 每幕论文知识对应 | Storyboard.md 第 2 节各幕证据、修正与发现 |
| 3. 用户决策分支流程 | Storyboard.md 第 3 节及各幕分支反馈 |
| 4. 每幕交互原型 | Storyboard.md 第 2 节：文字低保真布局、控件、状态与反馈 |
| 5. 三个高潮动画 | Storyboard.md 第 4 节 |
| 6. 全局状态设计 | Engineering-Spec.md 第 6 节 |
| 7. 组件架构 | Engineering-Spec.md 第 7 节 |
| 8. 论文数据结构 | Engineering-Spec.md 第 8 节 + paper-evidence.json |
| 9. 视觉与交互规范 | Engineering-Spec.md 第 9 节 |

## 阅读顺序

1. [Storyboard.md](Storyboard.md)：先看故事、玩家操作和每幕学习结果。
2. [Engineering-Spec.md](Engineering-Spec.md)：再看状态、架构、视觉、可访问性和十三个知识补给条目。
3. [paper-evidence.json](paper-evidence.json)：检查真实实验、来源、缺失值与例外。

## 核对记录

- 以用户上传的 17 页 PDF 为数值来源；公开 arXiv 页面核对题名和版本入口。
- Figure 1、Table 1–5、Figure 3 的关键数值已核对；原始数据保留实验条件与来源。
- Figure 3 共 72 个标注格，格值为 0–12；总和 576 是教程校验量，不能当额外论文实验。
- Table 5 未报告的四格保存为 null。
- 记录 Table 1 实际参数差异、Table 3/4 的结果例外、Figure 3 非单调分布和 Appendix H 的任务标签冲突。
- 三种来源分别为论文证据、教学模拟、假设情境。模拟没有训练效果指标。
- 视觉规范指定高对比文本、键盘替代操作、减弱动画、默认关闭音乐和本地进度。

当前 ACT 0–9 均可预览与评阅，十幕逐章实现完成。最终审查与学习报告见 ACT9-Review.md。
