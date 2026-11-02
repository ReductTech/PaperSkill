# 低秩适配与全参数微调：等价的错觉

基于 Reece Shuttleworth、Jacob Andreas、Antonio Torralba、Pratyusha Sharma 的论文 *LoRA vs Full Fine-tuning: An Illusion of Equivalence*（NeurIPS 2025）的交互式教程。工程使用 PaperSkill 1.5.0 的 React + TypeScript + Vite 模板。

## 运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

入口为 `index.html`。静态构建结果位于 `dist/`，资源使用相对路径。浏览器支持目录选页、方向键翻页、演讲者备注及全屏放映；窄屏可使用画布缩放与拖动。

## 学习内容

| 章节 | 页面 | 交互 |
| --- | --- | --- |
| 比较的起点 | 参数预算、任务分数 | 改变适配秩，计算参数量；切换六项分类任务 |
| 看见权重方向 | 谱分解、入侵检测、高维方向 | 调整方向和奇异值；联动阈值与检查范围；比较不同维数 |
| 更新规则与缩放设置 | 首步梯度、缩放规则 | 旋转适配器方向，比较更新矩阵；联动秩、缩放与学习率 |
| 定向干预 | 奇异项干预 | 重建干预后的四维权重和输出 |
| 核对实验证据 | 实测结果、持续学习 | 选择论文报告的缩放档位；查看六任务协议及原始曲线 |
| 综合判断 | 证据与研究问题、选参挑战 | 切换证据；在准确率容忍范围内选择缩放强度 |

封面采用同步调音台动画。正文中的二维和四维计算使用明确给出的教学矩阵；六任务准确率及干预结果来自论文表2–4，持续学习图来自图17。

## 核心计算

可训练参数量为 `r(m+n)`。入侵检测使用微调后左奇异向量与全部原始参考左奇异向量的最大绝对内积，对前 `k` 项使用严格小于 `ε` 的条件计数。

首步梯度页面采用普通梯度下降、初始 `B=0`，计算 `−η(α/r)²GAᵀA`。干预页面重建 `Wλ = Wt + (λ−1)σᵢuᵢvᵢᵀ`，只调整选定的一项。实验页面保留作者报告的离散档位和准确率相对变化、微调诱发遗忘变化两项指标。

## 文件

`src/data/tutorial.ts` 保存章节、页面目标及讲稿。`src/modules/` 保存交互组件和样式。`src/components/` 与 `src/lib/` 是演示框架。`outlines.json` 保存页面结构。`public/thumbnails/` 是页面实拍缩略图。

## 参考与素材

论文：[arXiv:2410.21228](https://arxiv.org/abs/2410.21228)，[NeurIPS 2025 会议版本](https://openreview.net/pdf?id=xp7B8rkh7L)。检测实现：[作者公开代码](https://github.com/reeceshuttle/intruder-dimensions)。

`public/images/continual-full.png` 为论文图17的裁剪；`continual-pair.png` 为同图前两个子图的裁剪。作者为 Reece Shuttleworth、Jacob Andreas、Antonio Torralba、Pratyusha Sharma。来源论文采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可。裁剪保留曲线、坐标和任务标签，局部图的图例在网页中重绘。

调音台、磁带、旋钮、音箱和耳机均由本项目的 SVG 图形代码绘制。缩略图来自本项目在浏览器中的实际渲染。
