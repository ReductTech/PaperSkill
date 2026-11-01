# Act2See · 中文交互式论文教程

独立的 React + TypeScript + Vite 本地网页。逐章讲解 [Act2See: Emergent Active Visual Perception for Video Reasoning](https://arxiv.org/abs/2605.01657)；所有模拟交互均为**教学示意**，不会调用真实模型或复现论文实验。

## 启动

```bash
npm install
npm run dev
```

打开终端输出的本地 URL。`npm run build` 会先运行 TypeScript 检查再构建；也可单独运行 `npm run typecheck`。生产产物位于 `dist/`。

## 阅读路径

首页 → 固定帧的证据缺口 → 交错 CoT → Retrieval / Generation → 两阶段流程 → 轨迹筛选 → SFT → 推理模拟器 → 五项 benchmark → 主结果与附录分析 → Figure 1–4 → 主动性的边界 → V* 专题脉络 → 局限与复习 → Final。

首次访问只显示首页；点击“开始学习”展开第一章。之后按参考站的连续章节卡片逐章展开，已展开的章节留在页面上，可直接滚动回看。解锁进度存在浏览器 `localStorage`；最终页可复习或重新开始。

## 视觉来源

页面外壳使用本地下载的 InSpatio World 教程源码：`E:\PaperSkill_staged_test\html_output\inspatio_world_a_real_time_4d_world_simulator_via_spatiotemporal_autoregressive_modeling\lyaqiqi0816`。其 `tokens.css` 与 `components.css` 已复制到 `src/styles/reference-*.css`；Act2See 的论文内容和专属互动保存在 `src/ChapterBodies.tsx`、`src/Interactions.tsx`。适配样式位于 `src/styles/migration.css`。

## 学术边界

- 论文事实取自 arXiv 2605.01657v1 正文及附录；报告的数值不是本地复现。
- Figure 1–4 是从该论文 arXiv HTML 获取的原图。其余流程画面均为 CSS/HTML 教学重绘。
- [官方代码仓库](https://github.com/martinmamql/act2see) 截至 2026-10-04 仅显示“Code available soon”。
- CVF 页面在核查时返回 403，本站采用可访问的 arXiv v1 正文。论文 §4.4 的 VideoEspresso 帧数叙述与 Table 2 不一致；页面采用表格值并显式标注该矛盾。

证据记录见 [source audit](docs/source-audit.md)、[evidence mapping](docs/evidence-mapping.md)、[story architecture](docs/story-architecture.md) 和 [QA report](docs/qa-report.md)。
