# TextLDM 交互式中文教程

基于论文 *TextLDM: Language Modeling with Continuous Latent Diffusion* 制作的标准 paper-skill React + TypeScript + Vite 项目。

- 论文：https://arxiv.org/abs/2605.07748
- 结构：10 章、9 个交互模块
- 主题：连续潜空间、TextVAE、REPA、Flow Matching、CFG、推理与实验结果

## 论文摘要

Diffusion Transformers (DiT) trained with flow matching in a VAE latent space have unified visual generation across images and videos. TextLDM transfers this visual latent diffusion recipe to text generation with minimal architectural modification. A Transformer-based VAE maps discrete tokens to continuous latents, enhanced by Representation Alignment (REPA) with a frozen pretrained language model. A standard DiT then performs flow matching in this latent space. The paper finds that reconstruction fidelity alone is insufficient and that representation effectiveness is critical for downstream generation quality.

## 本地运行

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 论文专属章节、公式与模块数据 |
| `src/styles/paper.css` | 论文专属配色覆盖 |
| `src/modules/legacyIsland.tsx` | 在 Shadow DOM 中复用原研究控制台交互组件 |
| `src/modules/registry.tsx` | 交互组件注册表 |
| `src/components/*` | paper-skill 标准展示组件 |
| `public/images/*` | 可选论文原图 |

原研究控制台的交互效果保留在标准 scaffold 内，但通过 Shadow DOM 隔离旧样式，避免与官方模板冲突。
