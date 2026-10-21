# QVHighlights / Moment-DETR 中文交互导读

以“看懂视频为什么还找不到准确时间”为线索，通过标注、边界、集合预测、匹配与训练信号，解释文本条件视频时刻定位。

## 运行

需要 Node.js 20 或更新版本。

```bash
npm install
npm run build
npm run preview -- --host 127.0.0.1 --port 5185
```

开发时可使用 `npm run dev`。完整项目需要保留源码、配置与依赖锁文件。

## 论文与来源

- Jie Lei, Tamara L. Berg, Mohit Bansal. **QVHighlights: Detecting Moments and Highlights in Videos via Natural Language Queries**. NeurIPS 2021.
- [论文 v2](https://arxiv.org/abs/2107.09609v2)；[作者代码](https://github.com/jayleicn/moment_detr)。
- 架构依据 §4、Figure 3；匹配及损失依据 Eq.1—4；指标依据 §5.1。
- 测试集比较来自 Table 3，Moment-DETR 数值是五个种子的均值；图中省略标准差，原文保留。验证集消融和预训练对比来自 Table 4、5，分别标注划分。
- 片段、厨房图标、剪辑类比、时间轴和结构示意均为本项目原创绘制；不包含论文 PDF、原视频或论文整页截图。页面的原文入口用于核对论文证据。
- 扩展视频 BV1Zo4y1A7FB 是 DETR 背景讲解，非本文专门讲解；通过 Bilibili 官方入口观看。

## 学习内容

8 章、9 个主要交互：任务判断、不连续片段标注、IoU 边界实验、结构追踪、一对一匹配、排序损失、公式展开、训练阶段切换、实验读表与自测。

练习数值均标为“教学示意”。配对练习省略真实匹配代价中的 gIoU 与权重，不构成论文实验复现。网页没有运行模型训练或推理；原理重绘与论文实测数字有明确区别。

默认使用预提取特征的论文配置，不把“端到端集合预测”解释为原始像素联合训练。10 个时刻查询槽是容量，非每次必定存在 10 个正确片段。没有把 2021 年结论表述为当前最强方法。

## 项目结构

论文数据位于 `src/data/tutorial.ts`，交互位于 `src/modules/`。模板展示组件与绘图工具保持独立，运行时仅依赖 React 与 React DOM；中文文字和本地绘图可离线呈现，论文链接和延伸视频需要联网。
