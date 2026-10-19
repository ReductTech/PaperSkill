# 自持续表征扩展的非样本类增量学习 · 交互式教程

基于论文 *Self-Sustaining Representation Expansion for Non-Exemplar Class-Incremental Learning*（CVPR 2022）的单页交互式教程，React 18 + TypeScript + Vite，纯 Canvas 绘制，无 CDN、无外链字体、无 KaTeX。主题是"班主任的烦恼"：老同学 = 旧类，新转来的同学 = 新类，加座位 = 结构扩展。

## 运行

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产出 dist/，仅用于自行部署
npm run preview    # 预览构建结果
```

交付形态是**源码目录**，不含 `dist/`；`node_modules/` 已在 `.gitignore` 中。

## 页面形态

整篇长文（不是一屏一章）：封面 + 10 章顺序排在同一页，左侧目录做锚点跳转与滚动高亮，顶部有阅读进度条，右下角回顶按钮。所有画布用 `IntersectionObserver` 离屏暂停。

## 内容地图

| 章 | 标题 | 类比动画 | 交互模块 | 交互方式 |
|----|------|---------|---------|---------|
| — | 封面 | hero-old / hero-new | — | 自动循环 |
| 1 | 又来新同学了 | ana1 走进教室坐空位 | stress-test | 滑块（批次 1–10） |
| 2 | 每个同学的特点 | ana2 粉笔圈出一堆点 | feature-space | 拖拽落点 |
| 3 | 不动教室加新座位 | ana3 搬椅子加座 | compare-methods | 同步开跑 |
| 4 | 三本账一起算 | ana4 三本账叠一摞 | lambda-slider | 滑块 λ 1–30 |
| 5 | 哪几个老同学最有代表性 | ana5 贴样板牌 | threshold-select | 滑块 σ + 批次 chip |
| 6 | 新同学来了坐哪 | ana6 新生走向某一组 | inference-path | 五步分步 |
| 7 | 分阶段加人 | ana7 墙上挂学期牌 | stage-progress | 逐批推进 |
| 8 | 新座位怎么安排 | ana8 接窄桌板 | adapter-arch | 点节点 + 结构 chip |
| 9 | 拆掉临时过道 | ana9 撤走隔板 | reparam-compare | 拖融合手柄 |
| 10 | 哪个班管理得最好 | ana10 三个班赛跑 | result-race / ablation | 评比按钮 / 点条选组合 |

## 数据来源

- **论文真值**：`threshold-select`（Fig.4 阈值曲线）、`adapter-arch`（Table 2）、`result-race`（Table 3）、`ablation`（Table 1）、以及全部正文引用的数字。
- **示意值**（模块内已标注"示意"，不与论文数值混用）：`stress-test`、`compare-methods`、`lambda-slider`、`stage-progress` 四条曲线，`reparam-compare` 的输出向量。

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 唯一内容源：章节、文案、公式、模块声明 |
| `src/styles/paper.css` | 场景色 + 整篇模式/公式模块的版式覆盖 |
| `src/modules/scene.ts` | 教室绘图套件 + `useScene` 渲染循环 |
| `src/modules/analogies.tsx` | 10 个类比动画 + 封面新旧对比 |
| `src/modules/*.tsx` | 11 个交互模块，在 `registry.tsx` 注册 |
| `src/components/*`、`src/lib/*`、`App.tsx` | 框架层 |
| `public/images/` | 可选论文原图（本教程未使用） |

框架层只动过两处，均为需求驱动：`components/Formula.tsx`（修带上下标的符号无法点击）、`App.tsx`（整篇长文模式）。其余为模板原样。

## 校验

```bash
npx tsc --noEmit     # 0 error
npm run build        # 通过
node <paper-skill>/scripts/validate-output.js .   # RESULT: PASS
```

`validate-output.js` 结果：10 章 / 11 个交互模块 / 1 个双模块章节 / 23 个组件全部注册 / 无残留占位符 / 无 B 站条目（可选，未找到可确认的稿件）。
