# 伪装目标检测：特征分解与边缘重建

基于 Chunming He、Kai Li、Yachao Zhang、Longxiang Tang、Yulun Zhang、Zhenhua Guo 和 Xiu Li 的论文 *Camouflaged Object Detection with Feature Decomposition and Edge Reconstruction*，发表于 CVPR 2023。

论文页面：[CVF Open Access](https://openaccess.thecvf.com/content/CVPR2023/html/He_Camouflaged_Object_Detection_With_Feature_Decomposition_and_Edge_Reconstruction_CVPR_2023_paper.html)。

## 教程内容

交互式讲解伪装目标检测中的前景背景相似与边界模糊问题，并展示 FEDER 的深度小波式分解、频率注意力、引导式特征聚合、ODE 启发式边缘重建、联合损失及实验消融。概念示意和玩具数值均在页面讲稿中与论文测量结果区分。

## 本地运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

生成的页面位于 `dist/`。项目源码、章节结构和页面缩略图分别位于 `src/`、`outlines.json` 和 `public/thumbnails/`。

## 素材来源

论文事实与引用以 CVF Open Access 页面及其公开论文为准。目录缩略图由本教程页面渲染生成；项目未附带论文 PDF 或从论文提取的图像。
