# AdaptiveISP：面向目标检测的自适应图像信号处理器 交互式教程

基于论文 *AdaptiveISP: Learning an Adaptive Image Signal Processor for Object Detection* 制作的完整 React + TypeScript + Vite 交互式中文教程。课程学生：刘通。

本次按要求只交互式网页，不包含视频演讲稿。网页内原创角色“小澄”、自行车场景和处理效果均由 Canvas 绘制，是帮助理解的教学示意；它们不运行论文模型，也不代表新的实验结果。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 原文与事实核对

- 论文正式版：[NeurIPS 2024 PDF](https://proceedings.neurips.cc/paper_files/paper/2024/file/cc596a803bedc7a03a87e98c77a22efe-Paper-Conference.pdf)
- 作者项目：[OpenImagingLab/AdaptiveISP](https://github.com/OpenImagingLab/AdaptiveISP)
- 论文主页：[AdaptiveISP 项目页](https://openimaginglab.github.io/AdaptiveISP/)

| 网页内容 | 原文位置 | 条件 |
| --- | --- | --- |
| 输入先转线性 RGB，重点优化 RGB 域模块 | §3，p.4 | 不声称替代完整 RAW 域处理 |
| 状态、模块类型和参数、逐步奖励 | §3.1–3.2，式 (1)、(4)、(9) | 页面算例为教学值 |
| 高 ISO 样本倾向去饱和、低 ISO 倾向 CCM | §4.2，图 5 | 论文样本趋势，不是普遍定律 |
| LOD + YOLOv3 上 71.4 mAP@0.5，对比基线 70.1 | 表 1，p.7 | 同数据集、检测器、指标 |
| 不同阶段数的精度与时间成本权衡 | 表 4–5，p.9–10 | 指标须分别比较 |
| 跨检测器 YOLOX、DDQ 结果 | 表 3，p.9 | 同为 LOD 数据集 |
| 可微 ISP 模块限制 | §5，p.10 | 作者列为后续研究方向 |

论文图表未直接复制进项目；所有画面、图表和角色均由网页代码原创绘制。项目运行不依赖远程字体、图片、视频或第三方服务。课件中的实时变化为可视化解释，标有“教学示意”。

## 配色语义

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

绿色表示本文方法或有利状态；红色表示传统失配或不利状态。橙色表示用户控制值。
