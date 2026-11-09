# ER-ACE / ER-AML 论文精读教程

交互式中文精读：**New Insights on Reducing Abrupt Representation Change in Online Continual Learning**，ICLR 2022。

作者：Lucas Caccia、Rahaf Aljundi、Nader Asadi、Tinne Tuytelaars、Joelle Pineau、Eugene Belilovsky。

## 运行

需要 Node.js 与 npm。首次运行：

```sh
npm install
npm run dev
```

生产构建和预览：

```sh
npm run build
npm run preview
```

## 阅读方式

10 章连续滚动，目录随阅读位置更新；跳转章节保留交互状态。手机使用侧边抽屉目录，表格在自身区域内横向滚动。操作支持键盘，拖拽模块使用统一指针事件。减少动态效果的系统设置会停用类比循环。

内容按论文逻辑展开：标题与摘要、引言、设定与相关工作、ER-AML、ER-ACE、数学与实现、理论边界、实验、消融、结论与研究延伸。最后一章提供 Problem、Background、Setting、Main Idea、Method、Mathematics、Algorithm、Experiments、Strength、Limitation、Connection、Research Extension 共 12 项研究记录。

第一遍建立问题与方法理解；第二遍精读交叉熵、监督对比损失和余弦归一化梯度；第三遍核对代码与在线更新流程；第四遍评估证据、局限与可证伪的研究问题。

## 原始资料

- [ICLR 2022 官方会议页](https://iclr.cc/virtual/2022/poster/7188)
- [OpenReview 论文与评审入口](https://openreview.net/forum?id=N8MaByOzUfb)
- [arXiv 摘要与版本](https://arxiv.org/abs/2104.05025)
- [论文 PDF](https://arxiv.org/pdf/2104.05025)
- [作者官方代码](https://github.com/pclucas14/AML)
- [本次核对的代码快照](https://github.com/pclucas14/AML/tree/24f9d271665ace195447a53c5212bdace6b1c111)

论文依据为 27 页 arXiv v3（2022 年 5 月，含附录），正文注明发表于 ICLR 2022。教程以带页码的原文链接定位关键图表，不分发论文页面截图；Canvas 与图形素材均为教程自行绘制的机制示意。视频仅为持续学习和数据漂移背景扩展，不是本篇论文的作者报告。

## 核对时重点关注

当前批次类别集合与任务类别集合不同。纯论文目标只保留本批类别；上述官方代码快照还放行从 max(seen) 开始的后缀输出，教程明确区分两者，并展示标签顺序带来的边界问题。

直接梯度消失不会冻结共享表示。线性 logits 与归一化余弦 logits 的特征梯度分别推导，后者包含归一化的投影雅可比。

常规实验报告 10 次运行的均值与标准误；模糊边界主实验使用 5 次运行。数据增强、每类名义内存预算、骨干、评价频率和独立附录消融分别标注。AAA 与最终准确率、均方漂移与欧氏距离、FLOPs 与实际延迟都应区分。

交互中的解析算例不是重新训练神经网络所得结果；实验表格摘自论文。教程没有执行完整的 CIFAR / Mini-ImageNet 训练复现，也没有将 2022 年论文中的领先表述扩展为当前最优结论。第 10 章的延伸问题是研究提案，原创性尚未经过独立文献检索确认。

运行时仅依赖 React 与 React DOM，无公式 CDN、外部字体或账户服务。可选 B 站元数据请求失败时保留静态链接与封面回退，核心内容可离线使用。
