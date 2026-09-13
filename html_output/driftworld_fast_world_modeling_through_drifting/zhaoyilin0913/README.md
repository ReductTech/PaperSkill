# DriftWorld：交互式论文教程

本教程把论文《DriftWorld: Fast World Modeling through Drifting》重构为中文交互式学习网页。

## 运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173/。

## 构建

```bash
npm run build
```

构建产物在 `dist/`（提交仓库时不要包含 `dist/` 和 `node_modules/`）。

## 技术栈

- React + TypeScript
- Vite

## 目录结构

```
.
|-- index.html
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- public/          # 论文图片、表格等静态资源
`-- src/
    |-- App.tsx
    |-- main.tsx
    |-- index.css
    `-- data/paper.json   # 论文分析结果
```

## 提交说明（ReductTech/PaperSkill 规范）

- 论文目录名（paper-name）：`driftworld_fast_world_modeling_through_drifting`
- 版本目录名（version）：`zhaoyilin0913`
- 教程应放入 `html_output/driftworld_fast_world_modeling_through_drifting/zhaoyilin0913/`
- 不要提交 `node_modules/`、`dist/`、论文 PDF、API 密钥、个人隐私或本地绝对路径
