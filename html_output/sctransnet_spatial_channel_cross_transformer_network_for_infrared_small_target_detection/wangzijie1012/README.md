# SCTransNet 交互式论文导读

基于 *SCTransNet: Spatial-channel Cross Transformer Network for Infrared Small Target Detection*（Yuan et al.，IEEE TGRS 2024，arXiv:2401.15583v3）的中文交互式导读，使用 PaperSkill 的 React + TypeScript + Vite 模板。

本目录包含完整 React + TypeScript 源项目。按下方命令启动或构建后阅读；论文原图保存在 `public/images/`，B 站链接需要联网。

## 内容结构

| 章 | 主题 | 交互模块 | 主要依据 |
| --- | --- | --- | --- |
| 1 | 任务：在杂波中找出几个像素 | 局部对比检测器的阈值两难 | §I，§IV-A 式 (18)–(22) |
| 2 | 四层编码特征如何对齐 | 编码层形状与 patch 嵌入 | §III-A，§IV-B |
| 3 | 跳连的鸿沟与全层交互 | 原文图 1 逐列对照；Q / J 连接矩阵 | §I，图 1，图 8，式 (1) |
| 4 | SSCA：在通道维做交叉注意力 | 逐步计算 SSCA；注意力矩阵规模 | §III-B1，式 (8)–(14)，§II-B |
| 5 | SSCA 的三处取舍 | 变体与表 VI；位置编码插值 | §III-B1，§IV-E2，表 VI，图 9 |
| 6 | CFN：两种互补的特征增强 | CFN 数据流（LSGC / GSLC）；六种前馈网络 | §III-B2，式 (15)–(17)，图 4，表 VII，图 10–11 |
| 7 | 训练：多尺度深监督 | 六项损失；训练配置与学习率 | §III-A 式 (2)–(7)，§IV-B |
| 8 | 整体结构 | 可点击的完整结构（据图 2 重绘） | 图 2，§III-A，式 (8)–(11)，表 VIII、X |
| 9 | 消融：部件与超参数 | 逐项加入模块；超参数性能与代价 | 表 IV、V、VIII、IX、X |
| 10 | 结果、代价与证据边界 | 表 I / II / III 交互读法；图 6 / 图 12 逐例对照 | §IV-C、D、G，表 I–III，图 5、6、12 |

全篇类比统一为“夜海瞭望”：远处小艇的灯与浪尖反光在局部都是亮点，需要结合整片海面的连续结构才能分辨。

## 关于准确性

- 所有实验数字均为作者在论文中报告的值，以字符串形式保存在 `src/modules/paper-data.ts`，没有复现或推算任何实验结果。
- 第 1 章的合成红外帧与局部对比检测器、第 4 章的矩阵规模计算、第 5 章的位置编码插值、第 7 章的学习率曲线是本导读自建的示意或形状计算，页面上逐一标注。
- 论文没有写明、但页面用到的实现细节（如 CFN 每支通道数、解码器通道数）来自作者公开代码，页面上标注“按作者代码”。
- 原文内部不一致之处（表 II 的“平均”、表 V 的 F 值、表 IX/X 的代价列名、图 8 的数据集标签等）只做标注，不代为修正。详见 [证据与实验条件](证据与实验条件.md)。

## 本地运行

```bash
npm install
npm run dev       # 开发预览
npm run build     # 产出 dist/ 静态站点
```

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 章节文字、公式与小结 |
| `src/modules/*.tsx` | 交互模块与类比动画（在 `registry.tsx` 注册） |
| `src/modules/paper-data.ts` | 论文表格数据（作者报告值） |
| `src/modules/ir-scene.ts` | 第 1 章合成红外帧与评估口径 |
| `src/styles/paper.css` | 论文专属的视觉层（在框架样式之后层叠） |
| `public/images/*` | 原文图片裁剪（图 1–6、8–12） |
| `src/components/*`、`src/lib/*`、`src/styles/{tokens,components}.css`、`App.tsx` | 沿用 PaperSkill 模板框架，未更改运行逻辑 |

## 链接

- 论文：<https://arxiv.org/abs/2401.15583v3>
- 作者代码：<https://github.com/xdFai/SCTransNet>

## 图表来源与制作说明

原图裁剪来自论文 arXiv:2401.15583v3 的图 1–6、8–12（https://arxiv.org/pdf/2401.15583v3），用于讲解对应机制和实验，版权归论文作者。教学合成图、形状计算和派生比较另作标注。网页由 AI 辅助制作并经逐项来源核对；作者报告的实验数值不代表贡献者的模型复现。
