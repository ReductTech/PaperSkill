# PhysForge：为可交互虚拟世界生成符合物理规律的 3D 资产 交互式教程

基于论文 *PhysForge: Generating Physics-Grounded 3D Assets for Interactive Virtual World*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

- `public/images/fig1-teaser.png`、`public/images/fig2-pipeline.png`：取自原论文 *PhysForge: Generating Physics-Grounded 3D Assets for Interactive Virtual World*（arXiv:2605.05163），仅用于学习展示。
- `public/cat4/f00.png`~`f15.png`：导览猫动画帧，提取自 B 站公开视频（BV1FyuGz5Eh8）中的猫咪梗素材，经抠图去背景处理，仅用于课堂教学演示；版权归原作者所有，如有异议请联系删除。
- 其余图形均为 Canvas 代码实时绘制，无外部素材。
