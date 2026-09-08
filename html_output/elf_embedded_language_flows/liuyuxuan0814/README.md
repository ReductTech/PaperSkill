# ELF 交互式教程（示例网页）

> **⚠️ 注意**
>
> 本教程为**示例网页**，是从单个 HTML 成品网页**迁移**而来的 React + TypeScript + Vite 项目，**不是由 paper-skill 生成的**。它仅作为"通过 skill 生成网页后的后续修改参考"使用，不代表 paper-skill 的标准产出结构。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 迁移方式

原单 HTML 成品内含 198KB 交互引擎脚本，按原始 DOM 的 id/class 直接驱动元素。因此迁移时**内容与引擎原样保留**，React 只做渲染外壳，以保证视觉与交互 100% 不变：

| 原成品内容                               | 迁移后位置                                              |
| ---------------------------------------- | ------------------------------------------------------- |
| 40KB 内联 CSS                            | `src/styles/elf.css`                                    |
| Hero / 10 章 / B 站推荐 HTML             | `src/data/_*.html`（经 `elfContent.ts` 用 `?raw` 导入） |
| 198KB 交互引擎（canvas、滑块、逐章解锁） | `src/lib/elf-engine.js`（包成 `initElfTutorial()`）     |
| 页面骨架                                 | `src/App.tsx` + `src/main.tsx`                          |
