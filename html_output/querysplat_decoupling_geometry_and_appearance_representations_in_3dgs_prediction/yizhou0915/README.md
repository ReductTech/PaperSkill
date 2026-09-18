# QuerySplat 中文交互教程

基于论文 *QuerySplat: Decoupling Geometry and Appearance Representations in 3DGS Prediction*，由 **paper-skill** 生成的 React + TypeScript + Vite 网页项目。含 10 章、13 个主动交互模块，覆盖表示解耦、VGM、训练、实验与局限。

这是教学可视化，不运行 QuerySplat 模型。房屋、射线、高斯投影与颜色变化为原创概念示意，不是论文重建结果。界面中“关闭分支”不等同于重新训练的消融实验。

来源、原图许可、公式与数据边界见 [SOURCES.md](SOURCES.md)。使用者已确认完成人工论文准确性核验及最终桌面、手机网页预览。验证记录与辅助截图见 [VALIDATION.md](VALIDATION.md)。

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
