# LADA 交互式论文学习网页

基于 ICML 2025 论文 **LADA: Scalable Label-Specific CLIP Adapter for Continual Learning**，使用 PaperSkill 的 React + TypeScript 框架制作。

论文：[PMLR 正式论文](https://proceedings.mlr.press/v267/luo25w.html)

作者代码：[MaolinLuo/LADA](https://github.com/MaolinLuo/LADA)

制作：zhenghewen（GitHub：yuzhe-428）

## 本地运行

需要 Node.js 20+。

```bash
npm install
npm run dev
```

打开终端给出的本地地址。方向键可切换章节；操作按钮、滑块时方向键作用于当前控件。

## 构建

```bash
npm run build
npm run preview
```

生产文件位于 dist/，采用相对资源路径，可部署到 PaperSkill 的论文版本目录。

## 章节

1. 任务越多，先选哪套参数：任务路由与统一候选的差别。
2. CLIP 共享空间：拖动图像向量，联动相似度与分类概率。
3. 标签专属记忆：逐次加入任务，观察参数与特征维度。
4. 类别打分：调节 β，观察记忆激活、类别求和与概率。
5. 旧新类竞争：提高新类分数，再按交叉熵梯度施加原型约束。
6. 完整推理：逐步查看已见类融合与未见类直接预测。
7. 分布保留：切换中心与 GMM 采样，调节分布尺度。
8. 训练结构：选择六个组件，追踪前向信息与梯度。
9. 容量与消融：交互读取原论文 Table 3–4。
10. 实验与指标：切换样本量、任务顺序和指标，读取真实训练阶段矩阵。

第 1–8 章的低维数值演示标为“教学示例”；第 9–10 章取自原论文 Table 1–6、Table 8 与 Appendix A。缺失实验结果保留为空值。原文定位链接随模块提供。

## 结构

`src/data/tutorial.ts`：论文解读与章节内容。

`src/modules/`：交互逻辑、图鉴场景与 Canvas 可视化。

`src/styles/paper.css`：论文专属样式。

`paper.json`：PaperSkill 论文与版本信息。

核心教程与图形采用本地 React、TypeScript 与 Canvas；延伸视频信息与链接需要网络。

## 资源来源

图鉴、动物卡片、结构示意及实验图表均由本项目代码绘制。论文公式与实验数值依据上方链接的 LADA 原文整理，各交互模块附原文页码。延伸视频以链接方式引用 Bilibili 上的“刘夏雷：基于图文预训练模型的连续学习方法研究”（BV1HiLizbEdF）。
