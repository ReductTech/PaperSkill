# 几分钟学会竞速：Mini Wheelbot 上的 Infoprop Dyna 交互式教程

基于论文 *Learning to Race in Minutes: Infoprop Dyna on the Mini Wheelbot*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 论文与图片来源

- 论文：Devdutt Subhasish, Henrik Hose, Sebastian Trimpe, *Learning to Race in Minutes: Infoprop Dyna on the Mini Wheelbot*，arXiv:2605.01096（https://arxiv.org/abs/2605.01096）。
- `public/images/fig1.png`、`fig2.png`、`fig3.png` 取自该论文原图（图 1 赛道、图 2 分布式训练示意、图 3 轨迹对比），版权归原作者所有，仅用于本教学教程的引用与讲解；如作者或维护者要求，可随时移除。
- 教程中的机制说明引用自论文及其引用的先前工作（Infoprop, ICLR 2025, arXiv:2501.16918），界面文案为教学化改写。
