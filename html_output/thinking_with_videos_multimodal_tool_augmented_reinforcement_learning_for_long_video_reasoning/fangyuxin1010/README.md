# Thinking With Videos: Multimodal Tool-Augmented Reinforcement Learning for Long Video Reasoning

VITAL 中文交互教程。十章解释稀疏观察、按需回看、视频工具调用、时间定位、四阶段学习、视觉上下文、难度感知奖励，以及实验结果与适用边界。

原文：https://arxiv.org/abs/2508.04416v2

## 运行

使用已有 Node.js 环境，在项目目录执行：

```bash
npm ci
npm run dev
npm run build
npm run preview
```

## 阅读与交互

每个大章独立一页，章内各节连续展示；侧栏和章末按钮切换章节。封面使用独立的列车站台动画，正文使用车辆通过检查线等明确标注的教学示例，均不代表真实实验视频。

动画约四秒一轮，支持暂停、重播和分步查看，离开视口后暂停。时间窗、IoU 和奖励参数可调。第九章主动画与展开数值区共享输入和播放进度。实验区区分 accuracy、R@0.5、mIoU 与 IoU AUC，训练进度按第四阶段累计已用样本解释。

## 内容与代码

- `src/App.tsx`：封面、章节导航、阅读内容、展开区及视频入口。
- `src/data/lessons.ts`、`readings.ts`：章节、讲解和教学算例。
- `src/modules/`：代码绘制的 SVG 动画及交互演示。
- `src/styles/paper.css`：教程阅读与响应式样式。

保留完整源码、依赖清单和锁文件；构建产物及依赖目录不提交。

## 素材来源

教学动画均由 SVG/CSS 代码绘制，不复制论文插图，不分发原文 PDF 或视频文件。延伸视频保留 Bilibili 原版封面，直接引用原站 HTTPS 图片，不在本仓库存储封面副本；封面及视频权利属于原作者和平台。

- https://www.bilibili.com/video/BV1wFNCehERn/ ，封面：https://i1.hdslb.com/bfs/archive/e2f2ceb8603f5ddffe3aba82bd30932d3c247b98.jpg
- https://www.bilibili.com/video/BV1M9NyeVEUp/ ，封面：https://i1.hdslb.com/bfs/archive/cffafbcdb55414e7db7a2286d893de8aa9181114.jpg

## 核验说明

已对照 v2 正文和附录核对公式、实验数字与训练条件。动画为教学抽象，不运行模型；示意色块不代表真实 token 数量或特征维度。不同数据集和评测指标不应直接横向排名。
