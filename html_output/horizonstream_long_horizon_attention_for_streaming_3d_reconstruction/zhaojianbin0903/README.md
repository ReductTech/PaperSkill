# HorizonStream：面向流式三维重建的长时域注意力 交互式教程

基于论文 *HorizonStream: Long-Horizon Attention for Streaming 3D Reconstruction*，由官方 **PaperSkill** 生成初始 React + TypeScript + Vite 框架，并经过人工核查、叙事重组和交互改写。

## 论文与素材来源

- 论文正文：https://arxiv.org/abs/2605.23889
- 项目主页（官方图、视频与定性结果）：https://3dagentworld.github.io/horizonstream/
- 官方代码仓库：https://github.com/3DAgentWorld/HorizonStream
- `public/images/` 中的 Figure、Table 和 KITTI 07 媒体均来自上述论文/项目公开材料；页面中的 Canvas 动画只作机制示意，不冒充论文测量结果。

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
| `src/lib/*` | 静态工具（canvasKit / 渐进加载 / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
