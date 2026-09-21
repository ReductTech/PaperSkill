# Janus：一颗大脑，两双眼睛

基于 **Janus: Decoupling Visual Encoding for Unified Multimodal Understanding and Generation** 的中文交互式论文教程，使用 React + TypeScript + Vite 构建。

- [论文原文](https://arxiv.org/abs/2410.13848)
- [官方代码与模型](https://github.com/deepseek-ai/Janus)
- [新芽专题：生成和理解统一模型](https://grokcv.site/sprouts/umm/)
- [PaperSkill](https://github.com/ReductTech/PaperSkill)

## 本地运行

需要 Node.js 20.19+ 或 22.12+ 及 npm（也可使用 pnpm）。

```bash
npm install
npm run dev
```

正式构建：

```bash
npm run build
npm run preview
```

教程整理：何熹淳（XichunHe），AI 辅助制作。目录拼音：hexichun。

## 教学设计

十章依次解释视觉表征冲突、双路径编码架构、统一自回归序列、三阶段训练、CFG 推理、基准证据、消融因果、成本与边界、研究脉络和理解验收。

主要交互包括：

1. 单编码器表征冲突模拟；
2. 三类任务的动态架构路由；
3. 图文 token 序列逐步预测；
4. 三阶段训练控制台；
5. 理解/生成的损失掩码；
6. CFG 引导尺度实验；
7. 理解与生成基准浏览器；
8. Exp-A 至 Exp-F 消融对比；
9. 训练资源换算；
10. 五题事实边界验收。

所有教学模拟均在页面中标注；真实指标来自论文表 1–5。由模型配置计算出的 576 个图像位置和 21,504 GPU·小时也明确标为推导结果。

## 事实与证据

| 内容 | 论文位置 | 表述边界 |
|---|---|---|
| 理解与生成需要不同粒度的视觉表示 | §1、§3.1 | 论文核心动机，不等于两个完全独立模型 |
| SigLIP 与 VQ 双路径，共享 AR Transformer | 图 2、§3.1 | 解耦的是视觉编码入口 |
| 三阶段训练及冻结策略 | 图 3、§3.2、表 1 | 页面按论文顺序展示 |
| 统一交叉熵目标 | §3.3、式 1 | 不同任务在不同输出 token 上计算 loss |
| CFG、10% 条件丢弃与默认 s=5 | §3.4 | 百分比效果曲线仅作教学示意 |
| 1.3B、4096、384×384、16,384 codebook | §4.1 | 576 个位置由 384/16 推导 |
| 理解与生成基准 | 表 2–4 | 不宣称所有指标均为全局最佳 |
| Exp-A 至 Exp-F 消融 | 表 5、§4.5 | B↔C 检验单表征权衡，D↔E/F 检验统一训练 |
| 128 张 A100、7 天 | §4.1 | GPU·小时是理论占用换算，不是成本报价 |
| Janus-Pro | 官方项目 README | 后续工作，未混入 Janus 原论文实验 |

## 工程结构

- `src/App.tsx`：十章叙事结构与来源链接。
- `src/data.ts`：训练阶段、基准和消融数据。
- `src/components/Interactions.tsx`：全部交互实验。
- `src/styles.css`：响应式视觉系统与移动端布局。

运行时仅依赖 React 与 React DOM；无需模型服务、CDN、外部图片或字体。

## 提交前

本目录是教程源项目，不代表已经由 PaperSkill 维护者审核或合并。公开署名、目录版本和论文元数据记录在 `paper.json` 中。不要提交 `node_modules`、`dist`、个人学号或登录信息。
