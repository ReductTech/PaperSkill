# 来源、许可与事实边界

## 一手来源

- 论文 v1：[arXiv 摘要](https://arxiv.org/abs/2608.01186)；[完整 HTML](https://arxiv.org/html/2608.01186v1)。教程固定依据此版本。
- 作者项目页：[QuerySplat](https://inspatio.github.io/querysplat/)。
- 作者：Yinglong Li、Donghui Shen、Xiaoyu Zhang、Zhichao Ye、Hongyu Wu、Aimin Hao、Guofeng Zhang、Haomin Liu。
- 核验日期：2026-09-15。

## 内容定位

| 教程内容 | 论文依据 |
| --- | --- |
| 前馈重建、pixel-aligned 与 query-based 表示 | 摘要、引言、相关工作 |
| 五类 Gaussian 属性 | 式 (1) |
| 几何分支与外观分支 | 方法部分，式 (2)、(3) |
| VGM、VGGT-Ω、输入相机、深度、Sim(3) | 方法部分与附录实现细节 |
| 联合目标、图像损失、Chamfer、opacity 下限 | 式 (4)–(7) 及训练实现细节 |
| 主实验与可选 TTO | 表 1 |
| 双分支、早期正则、骨干消融 | 表 2、3、4 |
| 训练阶段、查询扩展、模型规模 | 方法与附录实现细节 |
| 推理时间与峰值显存 | 表 14 |
| 局限、定性应用和训练日程变化 | 讨论及附录 |

实验图表逐项录入论文表格，未报告项使用空值，不插值为零。指标保留原表精度。TTO 不参与纯前馈方法的最佳值排名。不同消融表只在各自协议内比较，不与完整训练的表 1 混用。

## 图像授权

唯一复用的作者图片为第 8 章的 overview：

- 本地文件：`public/images/overview.png`。
- [项目页中的原始图片](https://inspatio.github.io/querysplat/static/images/overview.png)。
- [作者 GitHub 仓库中的同一文件](https://github.com/inspatio/inspatio.github.io/blob/main/querysplat/static/images/overview.png)。
- 项目页页脚明确将网站内容按 [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) 许可提供；核验时未见该图单独的排除声明。因此依该公开许可复用，并非仅因能公开访问便认为可以使用。
- 原图未改内容，仅按容器等比显示；界面图注包含作者、项目来源和许可链接。不暗示作者认可本教程。
- 未凭 arXiv 的非独占分发许可重新使用其他论文图片、视频或外部媒体。

本教程新写的中文教学文字及自绘教学图形同样按 CC BY-SA 4.0 提供；框架及第三方依赖保留各自原有许可。本声明不改变作者原图、论文或第三方软件的权利归属。

## 非论文结论与教学简化

- Canvas 场景是二维教学投影，不是 3DGS 渲染器、真实训练曲线或重建效果。
- 几何/外观开关仅切换可视层，不能用来估算真实消融的指标变化。
- SH 颜色示意没有执行球谐展开；一阶 SH 每通道 4 项、RGB 共 12 项，以及查询数乘 64 得到 Gaussian 数，是明确标注的维度推导。
- 训练时间轴只展示论文规定的阶段和权重，不虚构 20K 内精确衰减曲线或 LPIPS 逐步引入的连续函数。
- Opacity 下限交互展示单个样本的对数惩罚；论文没有给出 ε 的数值，演示的滑块范围避免要求该数值。
- 共享查询并非数学上不能同时表达几何与外观；教程讨论的是论文研究设置下的表示冲突与实验证据。
- 没有定量验证的单图、野外视频和修复应用只作为定性例子说明，不声称新的泛化指标。
