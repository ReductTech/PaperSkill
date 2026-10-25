# 去噪扩散概率模型 交互式教程

基于论文 *Denoising Diffusion Probabilistic Models*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 论文与素材来源

- 论文：*Denoising Diffusion Probabilistic Models*（Jonathan Ho, Ajay Jain, Pieter Abbeel，NeurIPS 2020），arXiv:2006.11239 — https://arxiv.org/abs/2006.11239
- 页面内嵌论文原图均截取自上述公开论文，仅用于教学说明，并在页面图注中标注对应 Figure 编号：
  - `public/images/fig1-celeba-hq.jpg`、`fig1-cifar10.jpg` — 原论文 Figure 1（CelebA-HQ / 无条件 CIFAR10 生成样本）
  - `public/images/fig2-graphical-model.png` — 原论文 Figure 2（自 PDF 第 2 页裁剪、去除页边距）
  - `public/images/fig7-share-latent.jpg` — 原论文 Figure 7（自 PDF 提取并缩放至 2000px 宽）
  - `public/images/fig6-progressive.jpg` — 原论文 Figure 14（附录，无条件 CIFAR10 渐进生成网格）
- Table 1/2/3/4 为原论文数值的逐值转写；对照模型数字来自各自论文的转引。
- 官方代码仓库：https://github.com/hojonathanho/diffusion
