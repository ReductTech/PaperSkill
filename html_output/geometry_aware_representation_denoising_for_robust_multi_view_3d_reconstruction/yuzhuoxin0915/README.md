# 面向鲁棒多视角三维重建的几何感知表示去噪 交互式教程

基于论文 *Geometry-Aware Representation Denoising for Robust Multi-View 3D Reconstruction*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 图片与素材来源

- **论文原图与实验图表**：`public/images/` 下以 `fig`、`table` 开头的图片（fig1–fig13、table1–table9 等）取自论文原文
  *Geometry-Aware Representation Denoising for Robust Multi-view 3D Reconstruction*（arXiv:2605.26230），仅用于教学说明。
- **教学类比图与示意图**：`analogy_*`、`develop_*`、`enlarger_*`、`final_prints_compare.png`、`hero_*`、`teaser_*` 等为配合讲解重新绘制或生成，
  用于建立直觉，**不是论文原图**，页面中已用文字标注区分，不替代原文图表。
- **论文链接**：https://arxiv.org/abs/2605.26230 （公开可访问）
- 全部资源随项目本地打包，不依赖外部 CDN；未使用来源不明或未获授权的素材。

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
