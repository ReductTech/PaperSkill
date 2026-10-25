# VideoChat：视频侦探放映室 交互式教程

基于论文 *VideoChat: Chat-Centric Video Understanding*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 图片来源与许可

`public/images/fig1.png` 至 `fig9.png`（含 `fig2a.png`、`fig2b.png`）取自论文 *VideoChat: Chat-Centric Video Understanding*（KunChang Li、Yinan He、Yi Wang、Yizhuo Li、Wenhai Wang、Ping Luo、Yali Wang、Limin Wang、Yu Qiao）的 [arXiv v2 版本](https://arxiv.org/abs/2305.06355v2)。图片从论文 PDF 提取为 PNG，并按图号命名；Fig. 2 拆分为两个文件用于网页展示。原论文标注的许可为 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)；这些论文图片的公开使用应遵守该许可的署名、非商业和相同方式共享条件。

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
