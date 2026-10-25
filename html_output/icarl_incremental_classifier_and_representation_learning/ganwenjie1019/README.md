# iCaRL 交互式论文导读

这是 iCaRL 论文的本地交互式导读，目前覆盖完整学习路径（第 1–9 页）。在此目录运行 `npm install`，再运行 `npm run dev` 可启动预览。

学习路径先在第 3 页完成一次基于已选 Exemplars 的预测；第 4 页用独立的单类 8→4 示例讲清 Herding、有序前缀与预算缩减；第 5 页回到共享运行时样本，展示旧 Exemplars 与新类完整数据如何组成 `D`，以及更新前如何快照 `Q`。原第 6–10 页现为第 5–9 页，实验图所在页面随之调整为第 8 页。

## Image provenance and sources / 图片来源与授权边界

第 8 页展示论文原始 Figure 2、Figure 3 和 Figure 4 的裁切图，文件位于 `assets/figures/figure-2.png`、`assets/figures/figure-3.png` 和 `assets/figures/figure-4.png`。各图的来源 PDF、裁切衍生文件路径、页码、图号、作者署名和使用边界记录在 `papers/icarl/design/asset-plan.md`；页面图注同时标明论文与原图位置。图像保留原始曲线或混淆矩阵，没有重新描绘，也没有从 Figure 2 或 Figure 4 反推未报告的精确数值。

原文为 Sylvestre-Alvise Rebuffi、Alexander Kolesnikov、Georg Sperl 与 Christoph H. Lampert 所著《iCaRL: Incremental Classifier and Representation Learning》，CVPR 2017。来源版本为 [arXiv:1611.07725v2](https://arxiv.org/abs/1611.07725)。图像在用户指定的本地教学原型中展示并附来源署名；此记录不构成第三方公开再分发许可。公开发布前需另行确认图片使用权。

Table 1 的精确数值取自 `papers/icarl/research/evidence-registry.yaml`，以独立整理的数据支撑第 8 页的可交互点图和差值图；页面也提供可展开的完整数值表。Table 1 原图没有被复制。图 3 的说明保留了原文 `log(1+x)` 显示变换。

## 教学数据边界

第 2、3、4、5、6、7 和 9 页中的示意坐标、教学响应值或运行轨迹用于讲解对象关系与计算步骤；它们不是训练得到的 iCaRL checkpoint，也不是论文报告的实验结果。第 4 页使用独立的单类 8→4 合成示例，通过共享 Herding 计算生成候选顺序、每轮均值与距离；它不连接 P3 的 `P_BEFORE` 或第 9 页的完整运行数据。第 8 页中带有 `[PAPER RESULT]` 的内容对应论文报告；解释、局限与教学说明以不同标签标出。第 9 页的运行时演示从一个共享的确定性计算模块得出配额、有序 exemplar 选择、均值、原型、距离和预测。
