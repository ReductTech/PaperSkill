# LongCat-Video-Avatar 1.5 技术报告 交互式教程

基于论文 *LongCat-Video-Avatar 1.5 Technical Report*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 论文图片与素材来源

本教程使用的论文原图均裁剪自公开论文 [*LongCat-Video-Avatar 1.5 Technical Report*](https://arxiv.org/abs/2605.26486)，用于教学讲解和论文定性结果说明：

| 文件 | 原始出处 | 页面用途 |
| ---- | -------- | -------- |
| `public/images/fig6_whisper_lipsync.png` | 论文 Figure 6，第 10 页 | 在 2.1 中展示 Wav2Vec2 与 Whisper-large 对具体发音的嘴形对照 |
| `public/images/fig7_silent_condition.png` | 论文 Figure 7，第 12 页 | 在 5.1 中展示多人场景使用 Silent Condition 前后的连续时间片对照 |

图片内容与人物画面保持论文原始呈现，仅裁去页面正文及图注周围的空白区域。论文图片版权归原论文作者及相关权利方所有；本项目不将其作为独立素材重新分发。
