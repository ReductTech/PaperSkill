# CLIP：从自然语言监督学习可迁移视觉模型

基于 Alec Radford 等人的 ICML 2021 论文 **Learning Transferable Visual Models From Natural Language Supervision**，由 paper-skill 生成的简体中文 React + TypeScript 交互教程。

共 16 页：封面、13 个机制实验与 2 页实验结果。统一使用“策划图文摄影展”的视觉主题，以原创 SVG 插画、可操作的照片和展签呈现图文配对、共享表示、对比学习与零样本迁移。图形与依赖均在本项目中，无运行时外部 CDN。

## 运行

    npm install
    npm run dev
    npm run build
    npm run preview

开发预览默认使用 http://localhost:5173；构建产物位于 dist/。Vite 使用相对资源路径，可部署于子目录。交付与导入时保留完整源项目；不要仅复制 index.html。node_modules/ 与 dist/ 不提交。

## 教学实验

- 挂上新类别展签，比较固定分类器与文字定义的类别集合。
- 为照片配对描述，分别更换两个编码器的输入。
- 拖动角度并改变原始长度，观察归一化后的余弦相似度。
- 改变批大小与描述的宽泛程度，比较行、列 softmax 和对称交叉熵。
- 调整温度，观察概率集中，包括“更自信地犯错”的情况。
- 用实际有限差分梯度更新六个角度，观察图文方向和损失共同变化。
- 更换零样本候选，消解 crane 的歧义，平均多个提示的文本表示。
- 加入正确或无关候选，观察分母与概率改变；比较有无数量信息的计数示例。

**数值边界：**机制实验使用教学向量与小规模计算，不调用真实 CLIP 模型，也不是论文测得的预测概率。论文实验结果单独呈现于迁移和分布偏移两页，并注明基线、指标和来源。计数维度的开关是解释性对照，不是论文提出的模型改进。

## 操作

每页为固定的 1600×900 画布，随窗口等比缩放。目录提供真实页面缩略图；顶部按钮或方向键翻页，“讲稿”展示来源与类比边界，“放映”进入全屏。输入控件获得焦点时方向键控制输入。

手机保留版式，支持双指缩放、放大后拖动以及恢复适应窗口。公式符号支持悬停、键盘聚焦与触屏点击查看解释；Escape 或点击外部关闭。角度拖动有等价滑块。支持系统减少动态效果偏好。

## 内容位置

- src/data/tutorial.ts：标题、章节、讲稿与证据定位。
- src/modules/：照片插画、计算和交互组件。
- src/styles/paper.css：论文主题与封面排版。
- public/thumbnails/：16 张实际页面截图。
- outlines.json：页面目标、交互与讲稿。

## 工程检查

2026-10-26：完成 TypeScript 语法门禁、结构检查与生产构建；浏览器检查覆盖全部页面、关键交互极值、公式提示、目录、讲稿、全屏以及 1366×768、1920×1080、390×844、844×390 四种视口。触控检查使用 Edge 移动端仿真，覆盖双指缩放、平移和复位；不等同于实体手机测试。

上述为功能 2 的工程和基础页面检查，论文内容仍需在功能 3 由使用者人工核验。


## 素材与论文来源

论文原文：Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, Gabriel Goh, Sandhini Agarwal, Girish Sastry, Amanda Askell, Pamela Mishkin, Jack Clark, Gretchen Krueger, Ilya Sutskever. Learning Transferable Visual Models From Natural Language Supervision. Proceedings of the 38th International Conference on Machine Learning, PMLR 139:8748–8763, 2021.

- 正式论文页面：https://proceedings.mlr.press/v139/radford21a.html
- 论文预印本：https://arxiv.org/abs/2103.00020
- PMLR 出版许可声明：https://proceedings.mlr.press/pmlr-license-agreement.html
- 许可：Creative Commons Attribution 4.0 International，https://creativecommons.org/licenses/by/4.0/

教学插画为本项目原创 SVG 示意图，缩略图来自教程实际截图。结果图依据原论文 Figure 5、Figure 13 绘制，页面与讲稿注明评价条件和出处。

public/images/clip-figure1.png 是原论文 Figure 1 的裁剪、缩放参考图，作者及来源同上，按 PMLR 的 CC BY 4.0 许可附带；当前页面未引用此备用图片。此项目未打包论文 PDF。
