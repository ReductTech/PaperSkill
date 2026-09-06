# Mage-Flow：高效原生分辨率图像生成与编辑基础模型 交互式教程

基于论文 *Mage-Flow: An Efficient Native-Resolution Foundation Model for Image Generation and Editing*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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
| `src/lib/*` | 静态工具（canvasKit / 渐进加载 / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 论文与图片来源

- 论文：Xinjie Zhang et al., *Mage-Flow: An Efficient Native-Resolution Foundation Model for Image Generation and Editing*, [arXiv:2607.19064](https://arxiv.org/abs/2607.19064)。
- `public/images/mage-flow-architecture.png`：论文 Figure 5，用于讲解整体架构与 Native-Resolution MMDiT。
- `public/images/mage-vae-training.png`：论文 Figure 6，用于讲解 Mage-VAE 架构与三阶段训练流程。

两张图片均截取自上述论文，仅用于本教程中的论文解读与教学展示。
