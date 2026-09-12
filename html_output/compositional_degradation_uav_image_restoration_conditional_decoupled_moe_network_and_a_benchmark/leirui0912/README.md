# 组合退化无人机图像修复 交互式教程

基于论文 *Compositional-Degradation UAV Image Restoration*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 素材来源

- 论文原文：[Compositional-Degradation UAV Image Restoration: Conditional Decoupled MoE Network and A Benchmark](https://arxiv.org/abs/2604.09313)，arXiv:2604.09313。
- `public/images/` 中的 7 张图片均取自论文原图（arXiv e-print 源包 `imgs/*.pdf`，按 150 DPI 渲染为 PNG，纯照片图转为 JPEG），用于本交互式教程的论文讲解：

  | 文件 | 论文原图 |
  | ---- | ---- |
  | `wrong_detect.png` | Figure 1 单退化与组合退化对下游无人机目标检测的影响 |
  | `blind_restoration.png` | Figure 2 DAME-Net 动机：盲统一修复 vs 显式因子级条件 |
  | `sgdp_semantic.png` | Figure 3 FDPM 动机：标签相似性引导的软对齐 |
  | `framework.png` | Figure 4 DAME-Net 总体架构 |
  | `CDCB.png` | Figure 5 CDCB 架构 |
  | `DCMOE.png` | Figure 6 DC-MoE 架构 |
  | `qualitative_analysis.jpg` | Figure 7 单退化与组合退化下的定性对比 |

- 其余图形与交互可视化由本项目代码生成，无额外第三方图片素材。
