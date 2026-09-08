# 视频世界模型的潜空间三维记忆：交互式教程

基于论文 *Latent Spatial Memory for Video World Models*，由 **PaperSkill** 生成的 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览，默认 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `src/data/tutorial.ts` | 论文专属内容：章节、模块、公式、元信息 |
| `src/styles/paper.css` | 论文专属配色与 Canvas 样式 |
| `src/modules/*.tsx`、`registry.tsx` | 论文专属 Canvas 交互组件 |
| `public/images/*` | 论文原图 |
| `src/components/*` | PaperSkill 模板的静态展示组件 |
| `src/lib/*` | Canvas、渐进加载等模板工具 |
| `src/styles/{tokens,components}.css` | 模板设计 Token 与组件样式 |

## 配色语义

- `--blue`：引导或当前状态
- `--green`：成功或本文方法
- `--red`：失败或传统方法
- `--orange`：用户强调
- `--purple`：辅助机制

## 论文与素材来源

- Weijie Wang 等，*Latent Spatial Memory for Video World Models*，arXiv:2606.09828v1（2026）：<https://arxiv.org/abs/2606.09828>
- 论文项目页：<https://aka.ms/latent-spatial-memory>
- `public/images/figure-2-latent-vs-rgb.png`：原论文 Figure 2
- `public/images/figure-3-mirage-overview.png`：原论文 Figure 3
- `public/images/figure-5-efficiency.png`：原论文 Figure 5
- `public/images/gen3c.mp4`：论文官方项目页 Results 中的 Gen3C 对比视频
- `public/images/ours.mp4`：论文官方项目页 Results 中的 Mirage（Ours）结果视频
- 视频来源：<https://microsoft.github.io/LatentSpatialMemory/#results>

论文图片和官方结果视频仅用于本论文教学与学术汇报，公开提交时请保留来源说明。
