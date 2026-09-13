# DITRON：面向并行张量程序的分布式多级分块编译器 交互式教程

基于论文 *DITRON: Distributed Multi-level Tiling Compiler for Parallel Tensor Programs*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 素材来源与可追溯性

- **论文**：[DITRON: Distributed Multi-level Tiling Compiler for Parallel Tensor Programs](https://arxiv.org/abs/2605.02953)（arXiv:2605.02953v1，2026，ByteDance Seed 等）。教程中的章节、公式、实验数字与结论均按该论文标注出处（`contents/*.tex` 的节、表、图、公式编号）。
- **论文原图**：`public/images/fig-background.png`、`fig-swizzle-flow.png`、`fig-covers.png`、`fig-mega.png` 取自作者公开的 arXiv LaTeX 源（`figures/background.pdf`、`figures/swizzling.pdf`、`figures/module.pdf`、`figures/mega-perf-small.pdf`），仅作引用与说明用途，版权归原作者所有。
- **未使用的图**：论文源中被注释掉的插图（如 `figures/intro.pdf`）没有收录，以免把未出现在论文中的图当作正文插图。
- **延伸视频**：仅以 B 站公开页面链接与封面地址形式引用，未内嵌或再分发任何视频文件。
- **无第三方素材**：页面不加载 CDN、外部字体或统计脚本；运行时唯一可选的网络请求是 B 站元数据查询。
- **隐私**：仓库与页面中不含密钥、个人隐私信息或本地绝对路径。
