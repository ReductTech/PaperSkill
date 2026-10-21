# Video-LaVIT 交互式论文教程

基于 *Video-LaVIT: Unified Video-Language Pre-training with Decoupled Visual-Motional Tokenization*（arXiv:2402.03161v3）的简体中文 React + TypeScript / Vite 教程。项目按修改后的 11 章方案制作，保留 44 个章节交互入口与 22 道小测。

## 运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173/`。生产构建使用 `npm run build`。

## 主要内容

- 核心实验：MPEG-4 视频拆解、Eq.1 宏块搜索、135 个 motion tokens 压缩、Eq.2 最近码本量化、成组多模态序列、EMC 条件路径、DDIM 跨 clip 衔接、Benchmark Arena 和消融实验。
- 页面顶部可切换“论文原图 / 交互重构”，以及 `PAPER / DEMO / EXTENSION` 证据标签；Figure 1/2 的重构视图包含原图区域联动标注。
- 右上角的 Token Counter 使用论文报告的平均约 90 visual tokens 和 135 motion tokens，长视频章节按 clip 累积。这是内容 token 的教学计数，不含文本、边界标记和完整上下文开销。
- 22 道本章小测的选择仅保存在本地浏览器；页面不会收集投票或运行论文模型。

## 证据边界

论文数字与图像来自工作目录中的 `2402.03161v3.pdf`。主要定位：

| 内容 | 论文位置 |
| --- | --- |
| 视频冗余、解耦动机 | Figure 1, Introduction |
| I-frame、motion vector、16×16 宏块 | Section 3.1, Eq.1 |
| Motion Tokenizer 与最近邻量化 | Figure 2, Eq.2, Appendix A.1 |
| Detokenizer 与 EMC | Figure 3, Eq.3, Appendix Figure 10 |
| 长视频与 DDIM 反演 | Figure 3(b), Eq.4, Figure 5 |
| 自回归目标与训练阶段 | Eq.5, Section 3.3, Appendix A.2 |
| 理解、生成、长视频结果 | Tables 1–5 |
| 运动分支及 token 数量消融 | Tables 6–7 |
| 三个模块的训练配置 | Table 8 |
| 局限与风险 | Appendix C, Impact Statement |

交互中简化的场景、二维 codebook 点、候选宏块误差、动画过渡和线性 token 推算都标注为教学模拟。Benchmark Arena 只展示同一表格、同一指标下的论文原始结果，不生成连续性能曲线。

## 项目结构

- `src/data/tutorial.ts`：11 章文字、公式、模块与论文图引用。
- `src/modules/coreLabs.tsx`：视频表示、Tokenizer、序列的交互。
- `src/modules/resultsLabs.tsx`：Detokenizer、长视频、训练、基准和消融交互。
- `src/modules/chapterQuiz.tsx`：22 道章节小测。
- `public/images/`：从提供的论文 PDF 裁出的原图以及页图。

项目为静态前端，不需要后端或账号。
