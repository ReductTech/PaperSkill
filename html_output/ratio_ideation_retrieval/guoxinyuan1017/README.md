# Ratio：跨越三类构思动作的科学灵感检索基准 交互式教程

基于论文 *Ratio: A Benchmark for Retrieval Across Typed Ideation Operations in Scientific Literature*（arXiv 2608.27394），由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属配色与六屏交互样式（全部收敛在 `.paper-stage` 作用域下） | ✅ 仅此 CSS |
| `src/screens/s{0..5}.html` + `s{0..5}.mount.ts` | 六个交互屏的标记与行为（从单文件原型机械移植） | ✅ 屏内容 |
| `src/modules/*.tsx` + `registry.tsx` | 屏包装组件、封面 SVG 小部件，并在 registry 注册 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具 | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（本篇专用）

- `--mv-a` 珊瑚红 = Address（应对），`--mv-b` 蓝 = Broaden（抽象），`--mv-s` 青绿 = Specify（实例）
- 红 `--danger` 只用于论文自己承认的失败模式（两个 pilot 陷阱、天花板）
- 灰阶 `--dg1..--dg4` 是共享池里的四类干扰句

## 数据可信度

屏上所有数字逐条对照原文 §4–§6 与 Table 1/2/5：3,017,476 对、4,252 词 / 809 命中、
13.8M / 361K / 404K 三段、17,579 条银标、MRR@10 46.7 / 24.5 / 27.3、HR@10 47.6 → 81.2。
pilot 实验原文只给定性结论（substantially higher / inflated scores），屏上如实标注「不替它编」。
