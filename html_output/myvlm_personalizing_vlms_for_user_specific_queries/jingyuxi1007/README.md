# MyVLM PaperSkill

独立中文交互教程：**MyVLM: Personalizing VLMs for User-Specific Queries（ECCV 2024）**。

提交者：Jing Yuxi（GitHub: commoncreate）。

## 运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

React + TypeScript + Vite 项目，包含封面和 8 个主要章节。页面不运行真实 VLM；交互使用论文固定数据、原始案例或明确标注的教学示意。

## 内容与交互

问题与用户特定概念 → 方法总览 → Concept Head → Concept Embedding → Personalized Inference → Experiments → Ablation & Analysis → Failure Cases & Limitations。

支持 Generic/Personalized 教学输出、人物/物品 head 路径、Training/Inference 分步、Head/Embedding 职责、论文 caption 对比、BLIP-2/LLaVA 实验与子集、消融配置及失败案例切换。

实验数字注明任务、模型、子集、指标和来源。Concept-name recall 不等于 VQA accuracy；通用能力仅按论文有限证据表述，作者限制与实验范围边界分别标注。

## 原始来源与图片

- [ECCV / ECVA 页面](https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/2028_ECCV_2024_paper.php)
- [主论文](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028.pdf)
- [Supplementary](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/02028-supp.pdf)
- [arXiv 2403.14599v1](https://arxiv.org/abs/2403.14599v1)
- [Official Code](https://github.com/snap-research/MyVLM)
- [Project Page](https://snap-research.github.io/MyVLM/)

`public/images/` 中 9 张教学引用裁剪图来自主文 Fig.2 p.6、Fig.4 最右列 p.10、Fig.7 第二列 p.14；Supplementary Fig.5 p.12；arXiv v1 Fig.9 p.11。网页保留图注和 M/S/A 来源标签。狗 Max、模块职责和流程图由代码绘制，明确标注教学示意。
