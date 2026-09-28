# SciNCL：基于引文嵌入的邻域对比学习科学文献表示 交互式教程

基于论文 *SciNCL: Neighborhood Contrastive Learning for Scientific Document Representations*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

- **论文**：*SciNCL: Neighborhood Contrastive Learning for Scientific Document Representations*（arXiv:2202.06671）。教程中的研究问题、方法描述、公式、超参数与全部实验数字均取自该论文原文；文中引用的图号（如图 2 / 图 3 / 图 4）指该论文中的图。
- **扩展视频**：Bilibili《对比学习论文综述【论文精读】》（BVID `BV19S4y1M7hm`）。教程仅在「扩展阅读」区以绝对地址引用其公开封面（`i1.hdslb.com`）与播放量，版权归原作者所有，作背景知识推荐，不构成本教程正文内容。
- **其他素材**：无。全部示意图、类比动画与交互图形均由 Canvas 在运行时绘制，未使用第三方图片、字体或数据集文件。

