# Restormer 交互式论文教程

基于 **Restormer: Efficient Transformer for High-Resolution Image Restoration**（CVPR 2022）的简体中文教学网页，包含6个章节、13页幻灯片。

论文：[arXiv:2111.09881](https://arxiv.org/abs/2111.09881)。作者：Syed Waqas Zamir、Aditya Arora、Salman Khan、Munawar Hayat、Fahad Shahbaz Khan、Ming-Hsuan Yang。

## 运行

```bash
npm install
npm run dev
npm run build
npm run preview
```

顶部按钮或方向键翻页，左侧缩略图选页，“讲稿”查看出处与教学边界，“放映”进入全屏；手机支持双指缩放、放大后拖动与复位。

## 教学内容

- 分辨率与注意力矩阵：计算空间配对和通道配对的元素数。
- MDTA：局部卷积、通道关联矩阵、缩放参数和特征混合的可计算示例。
- GDFN：观察GELU分支乘积的幅度与符号，区分实数门控与概率门。
- 网络结构：四层编码器形状、头数与块数，顶层解码、refinement和残差预测。
- 渐进学习：裁块尺寸、batch和迭代阶段的对应关系。
- 证据与边界：同协议点图、跨数据集去模糊、多任务结果、消融及深宽权衡。

所有交互算例均为声明的教学示意，不运行预训练模型，不执行训练，不将合成输出标为论文实测。MDTA的通道注意力不等同于显式空间注意力；GELU门控不是0～1概率。实验分数保留任务、数据集和评测条件，不跨任务排序。

## 来源与素材

论文事实、公式与数字依据上述论文；各页讲稿和`outlines.json`记录页码、公式号、图表号、协议和简化条件。实验主要使用表1、2、3、6、7–10。表7(d)的σ=50单元格与正文存在不一致，本教程未采用该数值。

照片工作台、房屋、分色片、放大镜和修补笔均为本教程代码绘制的矢量示意；缩略图为本教程截图。没有分发论文PDF、论文原图、外部照片、视频或字体。React + TypeScript演示框架来自本仓库paper-skill模板。

## 工程结构

`src/data/tutorial.ts`保存章节与出处，`src/modules/`实现交互，`src/styles/paper.css`保存教程样式，`public/thumbnails/`保存截图。`outlines.json`是章节数据派生的提纲。
