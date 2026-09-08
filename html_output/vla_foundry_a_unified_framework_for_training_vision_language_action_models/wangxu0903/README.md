# VLA Foundry：训练视觉-语言-动作模型的统一框架 交互式教程

基于论文 *VLA Foundry: A Unified Framework for Training Vision-Language-Action Models*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 素材来源

- 论文内容、术语、实验结论及 `public/images/paper/` 中的论文图表，来自 *VLA Foundry: A Unified Framework for Training Vision-Language-Action Models*（arXiv:2604.19728）。
- `public/videos/vla_foundry/` 中的闭环 rollout 视频，来自 VLA Foundry 官方项目页公开展示资源；为保证现场离线演示稳定性，已本地化存放。
- 页面末尾的 B 站延伸学习卡片仅链接到对应公开视频页面，封面、时长和播放量由 B 站公开接口按需加载。

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
