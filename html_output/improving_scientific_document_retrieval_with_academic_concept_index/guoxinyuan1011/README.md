# 用学术概念索引改进科学文档检索 交互式教程

基于论文 *Improving Scientific Document Retrieval with Academic Concept Index*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

- 教程全部图表均由 canvas 实时绘制，**未使用论文原图、未引用任何第三方图片或视频素材**；`public/images/` 保持为空（仅 `.gitkeep`）。
- 内容与数据均取自论文 *Improving Scientific Document Retrieval with Academic Concept Index*（arXiv:2601.00567v2）。其中由表格转写的数字（如表 7 的排名）已在页面内标注「（译）」。
- 概念分类法口径即论文所述的 Microsoft Academic Fields of Study。
- 论文未提供「去掉主题头 / 去掉短语头」的对照消融数据，因此 §3 中双头互补带来的数值变化已在页面内显式标注为「机制示意」，未冒充实测结果。
