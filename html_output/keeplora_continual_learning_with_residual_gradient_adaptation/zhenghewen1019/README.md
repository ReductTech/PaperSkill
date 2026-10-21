# KeepLoRA：通过残差梯度适配进行持续学习

基于论文 **KeepLoRA: Continual Learning with Residual Gradient Adaptation** 的中文交互教程，使用 PaperSkill 1.4.0 和 React + TypeScript + Vite。

论文：Mao-Lin Luo、Zi-Hao Zhou、Yi-Lin Zhang、Yuanyu Wan、Min-Ling Zhang、Tong Wei，ICLR 2026。

[论文原文](https://arxiv.org/abs/2601.19659v1) · [作者原版代码](https://github.com/MaolinLuo/KeepLoRA/tree/v1)

## 运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

构建使用相对资源路径。页面沿用 PaperSkill 的固定桌面画布布局，窄屏按视口缩放；交互动画在离开视口后暂停，并响应系统减少动态效果的设置。

## 内容

1. 新任务、旧任务和未见任务的三个目标。
2. 权重奇异方向与保护能量阈值。
3. 旧任务特征记忆和统一正交基。
4. 梯度拖动与矩阵分步投影。
5. 更新秩、方向角度和梯度捕获能量。
6. 非零低秩初始化的补偿与最终合并。
7. 冻结方向、学习系数的逐步训练。
8. 图文编码器、适配支路及类别原型。
9. 方向容量和六组消融结果。
10. 四组实验、三项指标及逐任务证据。

主实验来自论文表2–4、表6；消融来自表5；逐任务数据来自表7；指标定义对应附录B.2。小矩阵、损失轨迹与示意图为教程教学计算。作者代码对应论文的v1分支。

## 文件

`src/data/tutorial.ts` 保存章节内容、符号和来源；`src/modules/` 保存交互逻辑；`src/styles/paper.css` 保存场景配色。其余界面框架来自 PaperSkill 模板。

## 素材

素描、铅笔、遮罩、导轨和数据图均由项目 Canvas 代码绘制。字体使用系统字体。相关视频使用 Bilibili 公开条目 BV1SL4y1s7LQ 的官方嵌入与封面链接，署名为“跟李沐学AI”；项目不分发该视频文件。论文内容以概述和公式重组呈现，项目不包含论文全文文件。
