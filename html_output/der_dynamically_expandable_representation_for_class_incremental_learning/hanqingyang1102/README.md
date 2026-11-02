# DER：类增量学习的动态可扩展表示 · 交互式教程

基于论文 **DER: Dynamically Expandable Representation for Class Incremental Learning**（Shipeng Yan、Jiangwei Xie、Xuming He，CVPR 2021 Oral，[arXiv:2103.16788](https://arxiv.org/abs/2103.16788)）制作的 React + TypeScript 交互式教程。

教程用「中药百子柜」这一组生活场景承载论文机制：抽屉对应特征提取器，封条对应冻结，并排摊药对应特征拼接，药师对应分类器，格内插板对应通道掩码。

## 内容结构

共 7 章、14 个教学页：

1. **01 混装表示的极限**：灾难性遗忘；正则化 / 蒸馏 / 结构化三条既有路线及其代价（DER 属结构化一族）。
2. **02 冻结旧提取器，增开新提取器**：冻结范围与 BN 统计量；超特征的逐段拼接。
3. **03 辅助损失**：`|Yt|+1` 的辅助分类器（旧类合并为一类）与 λa 的取值。
4. **04 按新类难度动态扩张**：通道掩码、epoch 内退火与梯度补偿、剪枝前后的参数量与准确率。
5. **05 第二阶段**：重置分类器、类别平衡采样与温度 δ。
6. **06 实验设置与基准结果**：骨干与可比性（ResNet-18 vs 改版 ResNet-32）、CIFAR-100 两个协议、ImageNet-100/1000。
7. **07 迁移、代价与适用边界**：BWT/FWT、平均推理参数量与推理延迟。

数值均取自论文 Table 1/2/3/5/6/7 与附录；示意图、定性归纳与可推出的边界在讲稿中逐页注明出处与限度。

## 本地运行

```bash
npm install
npm run dev       # 开发预览
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 交互方式

- 顶部翻页；左侧为页面预览；「讲稿」打开演讲者备注；「放映」进入全屏。
- 方向键翻页不会抢占滑块、按钮等输入控件。
- 手机保持 1600×900 的排版比例，支持双指缩放、放大后拖动与缩放复位。

## 目录说明

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 章节、页面、元信息 |
| `src/modules/*.tsx` + `registry.tsx` | 各页交互组件与注册表 |
| `src/styles/paper.css` | 配色覆盖 |
| `public/thumbnails/*` | 页面截图（左侧预览用） |
| `outlines.json` | 每页目标、交互与讲稿摘要 |
| `src/components/*`、`src/lib/*` | 演示框架（一般无需改动） |

## 页面截图

在 1600×900 窗口打开 `?capture=1&slide=<页面ID>` 可单独捕获某一页，例如
`index.html?capture=1&slide=s5-aux-loss`。
