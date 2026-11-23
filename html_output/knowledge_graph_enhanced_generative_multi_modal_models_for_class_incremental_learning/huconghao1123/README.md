# KG-GMM 侦探案卷：一堂能亲手勘验的类别增量课

> 论文：[Knowledge Graph Enhanced Generative Multi-modal Models for Class-Incremental Learning](https://arxiv.org/abs/2503.18403)（CVPR 2025 投稿版，arXiv:2503.18403）
> 作者：Xusheng Cao, Haori Lu, Linlan Huang, Fei Yang, Xialei Liu, Ming-Ming Cheng（南开大学 VCIP / NKIARI）

这是一个 React + TypeScript + Vite 的交互式教程。读者不是旁观者，而是「市局物证鉴定室」的承办侦探：一件博物馆归还的青花缠枝瓶被高仿调包，你要用十卷案宗把 KG-GMM 的方法亲手走一遍，最后写结案陈词。

## 它和论文怎么对应

十卷案宗各对应论文的一处具体位置，每卷页首都夹着一张「原文」摘录（章节号 / 图号 / 表号 + 原话）：

| 卷 | 论文位置 | 这一卷要勘验的事 |
| --- | --- | --- |
| CASE-01 | §1 · 图 1(a) | 只写 "This is a photo of [CLS]"，Granny Smith 被写成 "This is a apple"，判成 Pineapple |
| CASE-02 | §3.1 · 式 (1)–(3) · 图 3 左 | GMM 的四步推理与训练回路 |
| CASE-03 | §4.4 · 表 4 | 80.72 → 加描述标签 80.95，为什么「几乎没有提升」 |
| CASE-04 | §2.2 / §3.2 · 式 (4)(5) · 图 2 | 三元组、ConceptNet、临时图 G_t |
| CASE-05 | §3.2 · 式 (7) · 算法 1 | 每类挂 r 条关系、剪枝规则 |
| CASE-06 | §3.3 · 式 (8) · 图 3 右 | 拆三元组、去头实体、在子图里数票得 ĥ |
| CASE-07 | §3.1 / §3.3 · 式 (2) | 冻结骨干、只训一层线性层、200 步 warmup / lr 3e-6 |
| CASE-08 | §3.2 Step 2 · 式 (6)(7) | G_t 剪成 G′_t，直接关系被占满时走第二跳 |
| CASE-09 | §4.4 · 表 5 · 图 5 | r = 3 的收益递减点（75 字 / 9.67 s / 0.07 MB / 0.53 ms / 84.29） |
| CASE-10 | §4.2–4.3 · 表 1–3 | 三张主表的结案数字，同一协议对照 |

数字均按论文表格录入（Tiny-ImageNet、ImageNet-R、CIFAR-100、Mini-ImageNet；表 2 的 PD 为越低越好，12.93 对 14.17）。

## 交互形态

- **卷宗板**：十卷按「待勘验 / 未启封 / 已归档」解锁，前卷归档后才开下一卷；可像抽屉一样收起。
- **每卷五段**：委托摘要 → 现场重建（类比动画）→ 勘验实验（Canvas 交互）→ 勘验结论 → 归档要点（盖章）。
- **物证簿**：盖章归档后，结论自动抄进正文下方的物证簿，可点回原卷。
- **结案陈词**：十卷归档后解锁，附论文三张主表的对照表。
- 进度存在 `localStorage`（键 `kg-gmm-case-v1`），可随时「重新开案」。

## 预览截图

`docs/preview/` 下是本版在 **1280×900** 桌面视口下的实拍（headless Chrome + `npm run dev`，无裁剪）：

| 文件 | 画面 |
| --- | --- |
| `01-briefing.png` | 案件简报：标题、承办侦探、每卷原文摘录的阅读规则，以及「旧案的认法 / 本案的认法」两栏 |
| `02-case-02-filed.png` | CASE-02 已归档状态：卷宗头夹着原文条（§3.1 · 式 (1)–(3) · 图 3 左），右上盖章，左栏第二卷解锁 |
| `03-verdict.png` | 结案陈词：十卷证据链之后的「对照论文原表」与物证簿 |

## 版本

`huconghao1123`：在 `huconghao1122` 基础上补充预览截图与本文档说明；正文、公式、数字与交互未改动（溯源记录写在 `paper.json` 的 `ancestors` 里）。

## 本地运行

```bash
npm install
npm run dev       # 开发预览
npm run build     # 产出 dist/
npm run preview   # 预览构建结果
```

## 素材与版权

- 页面中的全部插图（证物卡、线索板、档案盒、结案表等）都是 Canvas 程序绘制，不含第三方图片。
- 仓库未包含论文 PDF；论文引用见上方的 arXiv 链接。
- 教程正文为读者向的通俗讲解，公式与数字来自原文，转述处按原文语义压缩，不替代原文。
