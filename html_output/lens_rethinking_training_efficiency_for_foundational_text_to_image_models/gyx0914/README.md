# Lens：重新思考基础文生图模型的训练效率 交互式教程

基于论文 *Lens: Rethinking Training Efficiency for Foundational Text-to-Image Models*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 图片来源

| 文件 | 来源与用途 |
| ---- | ---- |
| `public/images/lens-official-sample-001.png` | [Microsoft Lens 模型图库 Sample 001](https://huggingface.co/microsoft/Lens/blob/main/assets/gallery/001-1440x1440.png)，通过保留同名文件的[公开镜像](https://github.com/dxqb/Lens/blob/main/assets/gallery/001-1440x1440.png)取得；项目标注 MIT，版权及许可文本见 [ASSET_LICENSES.md](ASSET_LICENSES.md)。 |
| `public/images/cat-*.png` | 为本教程生成的教学插图；生成说明见 [ILLUSTRATIONS.md](ILLUSTRATIONS.md)。这些图片不是论文实验结果。 |

结论页仅展示一张 Lens 模型图库样图，并非本网页现场生成的结果；图片版权归原权利人。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 教学插图与来源注明的展示图 | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit 等） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
