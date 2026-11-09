# CLIP 类增量学习：自适应表征调整与参数融合 · 交互式教程

基于论文 **Class-Incremental Learning with CLIP: Adaptive Representation Adjustment and Parameter Fusion**
（Linlan Huang, Xusheng Cao, Haori Lu, Xialei Liu，ECCV 2024；[arXiv:2407.14143](https://arxiv.org/abs/2407.14143)）
制作的 React + TypeScript + Vite 交互式教程。

## 教程讲什么

论文的核心主张是：用 CLIP 做类增量学习时，遗忘**不是均匀发生**的，而是集中在新类与旧类"名字和样子都挨着"的地方。
教程按这条主线组织成 7 章 13 页：

1. **01 · 邻居才是遗忘的入口**：把新到的款式推向衣架，只有挨着的那件老款被大量抢走。
2. **02 · 没有旧样衣，就按尺码册造替身**：旧类只保留均值与协方差，拖动收缩强度看替身点云。
3. **03 · 用款名找出邻居对**：拖动阈值 α，看哪些类别对进入集合 P（α 默认 0.65）。
4. **04 · 把邻居推开一个 margin**：拖动样本与 margin，观察铰链损失何时归零；再看推开后错判点消失。
5. **05 · 同一张方格纸上的参数融合**：SVD 分解到共享基 B、软掩码 M 与偏置 b、整体平均与逐格替换的差别。
6. **06 · 结果与消融**：CIFAR100 / ImageNet100 / ImageNet-R 的 Last 与 Avg、Table 5 五级消融。
7. **07 · 边界与代价**：什么前提成立、什么情况下不适用的判断。

贯穿主题是"老裁缝的改衣台"：相邻款式 / 尺码册 / 方格打版纸 / 改哪取新。

## 运行

```bash
npm install
npm run dev       # 本地预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
```

页面为 1600×900 固定画布，顶部翻页、左侧选页，"讲稿"打开演讲者备注，"放映"进入全屏；
手机保持同一版式，支持双指缩放与放大后拖动。

## 内容与证据

- 实测数字全部来自原文 Table 1–6 与 Fig.4：CIFAR100、ImageNet100、ImageNet-R 的对比，CUB200 / ImageNet1K 结果，五级消融 73.80 → 74.08 → 76.04 → 79.28 → 80.23，以及 kingsnake 单类计数。
- 页面上标有「示意」的比例条、距离值、矩阵数值、布块颜色均为教学演示，**不是**论文实测；各页角标与讲稿中逐条注明。
- 类别名仅 `box turtle` / `black grouse` / `mud turtle` 出自原文 Fig.1，其余写作「旧类 A–D」「新类 A–C」占位。
- 教程不对论文未论证的结论作主张（例如"直接平均会让版型走形"），相关页面的讲稿里写明了类比边界。

## 素材

页面内所有插画（衣架、衣物剪影、方格打版纸、卷尺、布块）均由 SVG 现场绘制，未使用外部图片、外部字体或 CDN；
缩略图由页面自身截图生成，存放在 `public/thumbnails/`。

## 目录结构

```text
.
|-- index.html
|-- package.json
|-- paper.json          # 本版本的作者与论文信息
|-- outlines.json       # 由章节数据导出的页面大纲
|-- public/thumbnails/  # 目录栏缩略图
`-- src/
    |-- data/tutorial.ts    # 章节、页面、讲稿数据
    |-- modules/            # 各页独立交互组件与共享绘图件
    `-- styles/             # 主题覆盖（paper.css）与共享样式
```
