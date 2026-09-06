# YOLO26：重新设计一个实时检测器的四个关键环节 交互式教程

基于论文 *Ultralytics YOLO26: Unified Real-Time End-to-End Vision Models*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 论文与图片来源

- 论文：Glenn Jocher、Jing Qiu、Mengyu Liu、Shuai Lyu、Fatih Cagatay Akyon、Muhammet Esat Kalfaoglu，*Ultralytics YOLO26: Unified Real-Time End-to-End Vision Models*，[arXiv:2606.03748](https://arxiv.org/abs/2606.03748)。
- `public/images/stal-qualitative.png`：从论文 PDF 第 14 页 Figure 5 裁取，用于说明不同标签分配策略对小目标预测的影响；仅做裁剪与网页尺寸适配，没有改变图中实验内容。
- 论文及该图按照 [Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/) 使用，并在此保留作者、原文链接、许可链接及修改说明。

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
