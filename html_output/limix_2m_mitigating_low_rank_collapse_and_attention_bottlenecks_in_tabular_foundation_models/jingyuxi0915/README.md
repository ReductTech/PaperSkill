# LimiX-2M 中文交互式教程

这是论文 *LimiX-2M: Mitigating Low-Rank Collapse and Attention Bottlenecks in Tabular Foundation Models* 的中文交互式教学网页。论文版本固定为 [arXiv:2606.04485v2](https://arxiv.org/abs/2606.04485v2)。

教程包含独立封面、10 个章节、12 个主要交互模块和“延伸学习”资源页，主线涵盖表格基础模型的上下文预测、低秩与 SVD、RBF 与 RaBEL、双轴注意力、模块顺序与读出，以及论文的消融和主要实验。

## 本地运行

需要 Node.js 20 或更高版本。

```powershell
npm ci
npm run dev
```

生产构建：

```powershell
npm run build
npm run preview
```

## 数据与适用范围

论文实验数据、公式和结论均指向固定 v2 版本。页面同时使用明确标注的数学解释和教学算例：最近邻示例不代表 TabPFN 或 LimiX-2M 的真实预测，教学矩阵的秩变化也不代表准确率变化。网站不加载模型权重，不提供后端训练或预测服务。

项目没有打包论文 PDF、视频或外部网页内容。“延伸学习”页面只保存公开资源的标题、用途和外链；访问时由对应平台提供内容。项目未使用外部图片素材。
