# STARFlow2：连接语言模型与归一化流的统一多模态生成 交互式教程

基于论文 *STARFlow2: Bridging Language Models and Normalizing Flows for Unified Multimodal Generation*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 素材与来源

- 论文：*STARFlow2: Bridging Language Models and Normalizing Flows for Unified Multimodal Generation*（arXiv:2605.08029v1 [cs.CV], 2026），链接 <https://arxiv.org/abs/2605.08029>；论文正文与图表版权归原作者所有。
- 未复制论文原图，`public/images/` 为空目录：页面内所有示意图、曲线与交互均由本项目 `src/modules/*.tsx` 的 Canvas 代码按论文描述重绘。
- B 站视频为外链嵌入（未转载视频文件，封面图直链自哔哩哔哩 CDN）：
  - BV1dS4y1c7xB《50、NormalizingFlow(标准化流)论文导读与原理精讲》<https://www.bilibili.com/video/BV1dS4y1c7xB>
  - BV1tYyfYhEzc《2.2 介绍连续归一化流 CNF 的定义和性质》<https://www.bilibili.com/video/BV1tYyfYhEzc>
  - BV1QF411j7ee《53、NormalizingFlow(标准化流)的PyTorch代码逐行讲解》<https://www.bilibili.com/video/BV1QF411j7ee>
- 本教程由 paper-skill 1.3.0 生成，生成后已逐项对照论文人工核对并修改；页面内交互代码均来自本项目源码，未引入第三方素材。
