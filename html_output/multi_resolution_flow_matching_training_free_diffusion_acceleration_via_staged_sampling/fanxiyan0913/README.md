# 多分辨率流匹配：基于分阶段采样的免训练扩散加速 交互式教程

基于论文 *Multi-Resolution Flow Matching: Training-Free Diffusion Acceleration via Staged Sampling*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

- 论文原文：*Multi-Resolution Flow Matching: Training-Free Diffusion Acceleration via Staged Sampling*，arXiv:2607.01642（arXiv:2607.01642v1 [cs.CV]，2026 年 7 月 2 日）。
- `public/images/` 中的 Figure 2、Figure 3、Figure 5 与 Table 1、Table 2、Table 8 均截自论文原图，用于本交互式教程的论文讲解。
- `public/images/sr/` 中的九张图取自论文 Figure 3 的九个面板：低清原图（512×512）与四种超分方案在 SR、High Resolution Refine 两行的结果（均 1024×1024）。同样来自论文原图。
- 其余图形与交互可视化均由本项目代码生成，未使用任何第三方图片素材。
- 论文中的实验数字（加速比、Geneval、逐阶段耗时等）均按论文原表数值写入，未作任何调整。

## 本教程相对模板的改动说明

以下几处超出模板默认范围，供审核者重点确认：

- `src/data/tutorial.ts`：本论文专属内容，10 章 + 前置 + 结语，共 13 屏。
- `src/modules/mrfmModules.tsx`、`src/modules/mrfmAnalogies.tsx`、`src/modules/registry.tsx`：论文专属交互组件。
- `src/types.ts`、`src/App.tsx`：为支持「前置知识页」与「章节自测」两类内容，扩充了数据类型并接入渲染，未改变既有章节结构。
- `src/components/PrerequisiteMap.tsx`、`src/components/ChapterQuiz.tsx`：上述两类内容对应的组件。
- `src/components/AnalogyCard.tsx`、`src/components/Hero.tsx`、`src/styles/components.css`：允许类比卡片在没有配图时不渲染空画布（仅含标题与文字）。
