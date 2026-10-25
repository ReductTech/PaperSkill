# VideoRoPE：什么样的视频旋转位置编码才是好的？ 交互式教程

基于论文 *VideoRoPE: What Makes for Good Video Rotary Position Embedding?*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

论文来源：[ICML 2025 / PMLR 正式发表页面](https://proceedings.mlr.press/v267/wei25h.html)；本项目图示中的论文截图取自所提供的论文 PDF，图注标明了 Figure 或 Table 编号。Canvas 交互图是教学示意，不能当作论文实验曲线。实验数值按论文 Table 2、Table 5 和引言录入，跨基准不直接比较绝对分数。

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
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、元信息） | 已修改 |
| `src/styles/paper.css` | 论文专属配色与交互样式 | 已修改 |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | 已修改 |
| `public/images/*` | 论文 Figure / Table 截图 | 已添加 |
| `src/App.tsx`、`src/components/*` | 导航、公式交互、论文来源入口等 | 已按需要修改 |
| `src/lib/*` | Canvas 工具 | 模板框架 |
| `src/styles/{tokens,components}.css` | 设计令牌与组件样式 | 模板框架 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
