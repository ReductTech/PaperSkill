# Restormer 交互式论文教程

基于 **Restormer: Efficient Transformer for High-Resolution Image Restoration**（CVPR 2022）的简体中文教学网页，包含6个章节、14页幻灯片。

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

- 问题：先比较空间注意力与通道注意力的矩阵规模。
- 整体网络：定位四层结构、同尺度跳接、Refinement和末端图像残差。
- 基本块：先确定LayerNorm、MDTA、GDFN与两次特征残差的位置。
- MDTA内部：局部Q/K/V投影、通道权重、六个位置的V混合，以及缩放参数。
- GDFN内部：三张4×4特征图同步选择位置，编辑两路特征并查看逐元素门控。
- 回到整网：图像残差输出与渐进训练；区分特征残差和图像残差。
- 证据与边界：同协议结果、消融、深宽权衡，讨论质量与速度的取舍。

所有交互算例均为声明的教学示意，不运行预训练模型，不执行训练，不将合成输出标为论文实测。MDTA的通道注意力不等同于显式空间注意力；GDFN通过逐元素乘法调节特征的幅度与符号。实验分数保留任务、数据集和评测条件，不跨任务排序。

## 来源与素材

论文事实、公式与数字依据上述论文；各页讲稿和`outlines.json`记录页码、公式号、图表号、协议和简化条件。实验主要使用表1、2、3、6、7–10。表7(d)的σ=50单元格与正文存在不一致，本教程未采用该数值。

照片工作台、房屋、分色片、放大镜和修补笔均为本教程代码绘制的矢量示意；缩略图为本教程截图。没有分发论文PDF、论文原图、外部照片、视频或字体。React + TypeScript演示框架来自本仓库paper-skill模板。

## 工程结构

`src/data/tutorial.ts`保存章节与出处，`src/modules/`实现交互，`src/styles/paper.css`保存教程样式，`public/thumbnails/`保存截图。`outlines.json`是章节数据派生的提纲。

## 交互与实现

教程采用以下设计：统一照片修复工作台视觉；使用共享绘图组件与独立可验证的数值模块；局部卷积、MDTA列权重、GELU门控和残差重建直接由同一状态驱动。模块消融与质量—延迟权衡分为独立页面。

矩阵算例采用单位范数通道特征与按列归一化的Softmax，遵循论文的N×C值矩阵记法。图像残差页使用固定的合成输入与残差，直接演示I+R；没有强度滑杆、目标或误差评价，不代表模型推理。GELU曲线为tanh近似。各图以代码绘制，不依赖外部素材或服务。

数值回归检查：

```bash
node --test tests/mechanisms.test.cjs
```

检查包括Softmax列归一、远处特征改变本地混合、α极值、局部零填充、带符号门控、残差重建与编码器形状。
