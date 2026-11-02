# FEDER：在相似纹理中找出目标边界 交互式教程

基于论文 *Camouflaged Object Detection with Feature Decomposition and Edge Reconstruction*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5183   # 第二篇独立预览
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

## 论文与读法

Chunming He 等，*Camouflaged Object Detection with Feature Decomposition and Edge Reconstruction*，CVPR 2023，第 22046–22055 页。[论文与补充材料](https://openaccess.thecvf.com/content/CVPR2023/html/He_Camouflaged_Object_Detection_With_Feature_Decomposition_and_Edge_Reconstruction_CVPR_2023_paper.html) · [作者代码](https://github.com/ChunmingHe/FEDER)。

从第 1 章区分“找不到位置”和“勾不出边界”。第 2–6 章沿编码、频带分解、聚合与解码路径跟踪线索；第 7–8 章分别解释边缘更新和多级监督；第 9–10 章可切换表 1 的比较条件和表 2 的消融行。图 1、2、3、4、7 均截自论文；拓印动画、Haar 手算、门控数字与 RK2 向量都用于教学。页面不运行训练权重。
