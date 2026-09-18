# 世界-语言-动作模型：统一世界建模、语言推理与动作合成 交互式教程

基于论文 *World-Language-Action Model for Unified World Modeling, Language Reasoning, and Action Synthesis*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 素材来源与授权

- 论文原图 `public/images/fig2.png`、`public/images/fig3.png`、`public/images/fig10.png` 取自论文 *World-Language-Action Model for Unified World Modeling, Language Reasoning, and Action Synthesis*（arXiv:2606.05979v1）的 Figure 2 / Figure 3 / Figure 10，仅用于本教程的教学讲解与引用，版权归论文作者所有。
- 延伸视频区的封面缩略图与播放量来自 B 站公开接口（`view` API），页面只展示视频链接、封面与播放量，版权归对应 UP 主所有。
- 教程中的论文数字与结论均标注出处（页码、公式号、表号、图号），可由读者对照原文核验；页面上少数示意动画已在模块描述与反馈中注明为示意，不代表论文实测。
