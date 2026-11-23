# 基于典型相关分析的 CLIP 类增量学习子空间对齐 · 交互式教程

基于 CVPR 2026 论文 *Subspace Alignment for CLIP-based Continual Learning via Canonical Correlation Analysis*（Huan Zhang 等），由 **paper-skill** 生成的 React + TypeScript + Vite 单页教程。

## 教程内容

主题：双色套印对版。用画版 / 字版的套准误差解释 CLIP 类增量学习中的非对称漂移，并在同一套作坊情境里演示协方差累积、白化、典型方向、能量截断、随机傅里叶投影与推理。

- 6 章 / 11 个教学页 + 封面
- 可交互：批次推移、漂移度量、白化、典型方向、统计累积、能量阈值、RFP、五阶段流程、四个基准比较、消融、适用边界
- 数值与图表取自论文表 1–4、图 3–4；示意值均在页面标注“示意”，推断内容标注“推断”

## 本地运行

```bash
npm install
npm run dev       # 开发预览（默认 http://localhost:5173）
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 目录

```text
src/data/tutorial.ts     教程数据（章节、场景、讲稿）
src/modules/*.tsx        每页的论文专属组件
src/styles/paper.css     主题色与场景样式
public/thumbnails/       12 张页面截图（目录缩略图）
outlines.json            页面大纲（由章节数据派生）
```

## 说明

- 公式符号在页面内可悬停 / 聚焦 / 点按查看中文释义。
- 页面固定 1600×900 画布，支持键盘翻页、讲稿、全屏与移动端双指缩放。
- 无需联网，无外部字体或 CDN 依赖。
