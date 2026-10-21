# 基于提示的持续学习的分层分解 交互式教程

基于论文 *Hierarchical Decomposition of Prompt-Based Continual Learning*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 素材来源

`public/images/` 中的原图均截取自论文 **Hierarchical Decomposition of Prompt-Based Continual Learning: Rethinking Obscured Sub-optimality**（arXiv:2310.07234），对应关系如下：

| 文件 | 论文来源 |
| ---- | -------- |
| `page-04-img-01.png` | Figure 1：prompt-based continual learning 方法概览 |
| `page-04-img-02.jpg` | Figure 2：不同预训练范式下的实证分析 |
| `page-06-img-01.png` | Figure 3：HiDe-Prompt 架构概览 |
| `page-10-img-01.jpg` | Figure 4：WTP 与 TII 的详细分析 |
| `page-22-img-01.jpg` | Figure 5：无指令/有指令表示的 t-SNE 可视化（Part I） |
| `page-23-img-01.jpg` | Figure 6：无指令/有指令表示的 t-SNE 可视化（Part II） |

外部没有任何未声明的图片、字体或第三方运行时资源。
