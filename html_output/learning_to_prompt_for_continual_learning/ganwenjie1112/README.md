# Paper Tutorial Source

This is an independent React, TypeScript, and Vite project for the paper tutorial. Its source can be built without a shared runtime from another paper.

## Local commands

- `npm ci` installs the exact dependencies recorded in `package-lock.json`.
- `npm run dev` starts the local development server.
- `npm run build` checks TypeScript and creates the production build in `dist/`.

## Image sources and asset provenance

The initial scaffold contains no paper-derived or third-party image assets. When an image is added, record its source, figure or page, attribution, and permitted use in this section.

## 基础样式

W0 自动装配 DER 基准的暖白画布、字体、MathML、基础图文布局与 Reference 抽屉；首次正式页面前检查样式预览，在现有 Design Handoff 记录必要局部修订。W5 从 W2/W4 独立设计教学对象和场景。 `paper.py new` 安装本地 `src/shared/` 固定闭包。运行 `npm run dev` 并访问 `?style-preview=1`；生产构建不会加载测试页。Reference API 由本地 `shared/core/reference/ReferenceHub` 提供。
