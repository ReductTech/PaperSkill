# NuSA-CL：在低能量方向中持续学习

论文：**Memory-Free Continual Learning with Null Space Adaptation for Zero-Shot Vision-Language Models**。Yujin Jo、Taesup Kim，ICLR 2026。

[正式论文](https://proceedings.iclr.cc/paper_files/paper/2026/hash/ad217e0c7fecc71bdf48660ad6714b07-Abstract-Conference.html) · [arXiv](https://arxiv.org/abs/2510.21175) · [作者代码](https://github.com/ZoYujin/NuSA-CL)

## 运行

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

React 18、TypeScript、Vite；由 PaperSkill 1.4.0 模板生成。正文、公式和实验表格保存在 `src/data/tutorial.ts`，交互组件位于 `src/modules/`。图表和计算在浏览器本地运行。

## 内容

1. 固定骨干与历史存储：比较微调、回放、累积专家和 NuSA-CL。
2. 图文共享方向：拖动二维图像向量，计算余弦相似度与分类概率。
3. 谱能量：调整 ρ 和秩上限，确定主空间与最末尾的有效更新方向。
4. 更新矩阵：编辑 2×2 的 M，观察 4×4 更新矩阵及其主空间零块。
5. 持续约束：同步比较方向漂移和固定奇异基的主空间耦合。
6. 任务循环：逐步合并更新，并重新分解当前权重。
7. 训练与推导：交叉熵更新计算、Lemma 1 式（5）的矩阵实例检验。
8. 双编码器结构：选择图像或文本编码器中的 q、k、v、o 投影，查看适配路径和消融结果。
9. 超参数：比较尾部、顶部、随机子空间的秩消融和能量阈值实验。
10. 实验证据：全量与 5-shot MTIL、CIFAR-100 类增量结果、参数和训练成本。

## 数据与推导来源

| 内容 | 来源 |
|---|---|
| 主空间阈值、受限更新、合并循环 | 论文 §3.1–3.3，式（1）–（4） |
| 全量 MTIL 与训练成本 | 表 1，CLIP ViT-B/16，11 个任务 |
| 5-shot MTIL | 表 2 |
| CIFAR-100 类增量 | 表 3，10/20/50 步 |
| 冻结基、编码器、ρ 消融 | 表 4 |
| 子空间与秩消融 | 表 10 |
| 长期谱容量 | 表 11、12 与 Discussion |
| 尾部截断、冻结参数、缩放与损失 | 作者代码 src/methods/nusa.py、src/methods/lora.py、src/loralib/layers.py、src/trainer.py，提交 e2b745bfe3a6b7722fabcdc597a6b42778fab0fd |

二维特征、4×4 更新、两任务重排序和交叉熵单步计算均使用教程给出的低维输入。实测准确率与资源数值取自论文表格。

第七章的代数核验取 Σₙ=εIᵣ、M=Iᵣ：实际内积为 rε，论文式（5）右端为 ε√r。r>1 时，该例超过原式右端。Cauchy–Schwarz 给出 |Tr(ΣₙM)|≤‖Σₙ‖F‖M‖F≤√r·σmax‖M‖F；本例前一个上界等于 rε。该计算是教程中的独立推导。

## 视觉与延伸资料

画布修补动画、矩阵、向量与结果图均为本项目 Canvas 绘制，无论文截图、外部字体或运行时数学库。

延伸视频链接指向 Bilibili 原页面，封面由其公开视频元数据 URL 显示，版权归对应 UP 主及权利人。视频不复制进项目：

1. [跟李沐学 AI：CLIP 论文逐段精读](https://www.bilibili.com/video/BV1SL4y1s7LQ/)
2. [晓之车高山老师：矩阵奇异值分解](https://www.bilibili.com/video/BV1ExWxesEVf/)
3. [唐国梁 Tommy：LoRA 算法原理](https://www.bilibili.com/video/BV1cM4m1r7Fe/)

视频元数据请求失败时保留视频链接与静态标题。模板保留 1600 宽度的 viewport，手机按页面整体缩放显示。
