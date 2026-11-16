# Flamingo：面向少样本学习的视觉语言模型

基于用户提供的 NeurIPS 2022 论文 PDF 制作的简体中文 React + TypeScript 交互教程，共13页（封面及12个教学场景），11个主动交互模块。

## 本地运行

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

生产构建：`npm run build`。源码页面数据在 `src/data/tutorial.ts`，内容组件在 `src/modules/`，样式在 `src/styles/paper.css`。

教学范围：上下文少样本学习、冻结骨干、Perceiver Resampler、交叉注意力、tanh门控、最近前置图像掩码、视频抽帧、混合训练目标、条件生成、VQAv2结果、消融与局限。页面讲稿保留论文页码与图表定位。教学向量、损失、概率和图画不是Flamingo实测输出；论文结果与玩具计算分开展示。

本项目已经通过语法、结构、TypeScript和Vite构建，以及桌面和手机尺寸的基础浏览器检查。使用者已于 2026-11-16 对照原论文完成人工准确性核验并确认。


## 来源与素材

论文来源：https://arxiv.org/abs/2204.14198（Alayrac、Donahue 等，NeurIPS 2022）。页面鸟类、观察手账与机制插图由本项目以 SVG 绘制；缩略图来自本项目页面截图，未嵌入论文原图或第三方媒体。实测数字以页面讲稿标注的论文表格为依据；向量、权重、概率与梯度演示均为教学设定。
