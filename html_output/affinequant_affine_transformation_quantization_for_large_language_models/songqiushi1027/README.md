# AffineQuant：大语言模型的仿射变换量化 交互式教程

基于论文 *AffineQuant: Affine Transformation Quantization for Large Language Models*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

此目录是论文专属内容的空白运行框架；请根据当前论文独立选择主题、场景和排版。

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## PPT 演示模式

每章包含多张独立幻灯片，每页固定为 1600×900。顶部翻页，左侧预览选页，
“讲稿”打开演讲者备注，“放映”进入全屏。方向键翻页时不会抢占输入控件。
手机保持原有排版，支持双指缩放、放大后拖动以及缩放复位。

首页的两种方法通过 `useCoverPlayback()` 同步播放同一生活场景，并用一句话引出
核心方法。正文可以直接点击或拖动画布里的物体，也可以用少量关联滑块组成
一个完整实验；不同页面应选择主题内不同的生活动作，而不是重复同一动画。
不同页面按教学问题安排生活场景、交互、论文公式或实验结果；同页并置的画面与
形式化表示由同一状态驱动，其他依据可放在独立页面或讲稿中。
不需要为动画添加播放、暂停、单步、重置或标签切换控件。

通过 `chapters[].scenes` 指定每页目标、讲稿和专属 `componentId`；正文通过统一组件注册表注册，版面按内容自由设计。
正文在固定画布内自由构图；生成器应按教学问题安排视觉重点，不能让每页都成为左图右卡。
新项目不再提供固定的“左图右文”引入页或“三列文字”总结页。结论应融入大幅动画、
交互结果或充分可读的论文证据图。
正文使用 `--ppt-body-text`、`--ppt-body-heading`、`--ppt-body-emphasis` 三种字号；删掉重复的小标签，给公式、机制和结果留足可读空间。生活动画用于引入和解释合适的概念，其他页面可以直接操作论文变量、结构或证据。详细出处与类比边界放入讲稿，密集内容拆成新页。
`outlines.json` 由章节组装器生成。页面截图存入 `public/thumbnails/`；
`?capture=1&slide=页面ID` 可在 1600×900 窗口中单独捕获页面。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `public/thumbnails/*` | 幻灯片截图 | ✅ 生成后截图 |
| `outlines.json` | 每页目标、交互与讲稿 | 由组装器派生 |
| `src/components/*` | 演示框架与场景展示组件 | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components,presentation}.css` | 设计令牌、组件与演示样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
