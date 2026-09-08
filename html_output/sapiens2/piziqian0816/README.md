# Sapiens 到 Sapiens2：从像素重建走向全局语义理解

面向 4 分钟汇报的简体中文交互式课件，采用完整的 React + TypeScript + Vite 项目结构。

## 内容结构

- 独立论文封面：概括论文信息、任务范围和“人体数据 → MAE → 自蒸馏”主线，不计入正式页数。
- 正式主讲：7 页，通过左上角索引、底部学习导航和可点击页码圆点组织 4 分钟讲解。
- 备用答疑：4 组内容按主题挂载在第 5–7 页右侧抽屉，覆盖 QKV、表示坍塌、评测指标与局限性。
- 论文原图：第 1–6 页嵌入对应的 Sapiens / Sapiens2 原图，第 7 页结果抽屉提供论文定性图和原始结果表。
- 结果探索器：点击 Pose、Segmentation、Pointmap、Normal、Albedo 指标，查看原表全部模型数据与条形可视化。
- 两个核心交互：14 秒 MAE 遮挡—重建动画；17 秒 Student–Teacher 跨视图蒸馏动画。
- 其余信息图只进行自动强调或点击高亮，避免把视觉效果误当作论文方法本身。
- 公式使用 KaTeX 排版；方法动画由项目内 SVG/CSS 精确绘制，补充图片均裁自两篇论文原文，没有使用生成式科研图片。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 论文与内容依据

- 论文：[*Sapiens*](https://arxiv.org/abs/2408.12569) 与 [*Sapiens 2*](https://arxiv.org/abs/2604.21681)，Rawal Khirodkar 等。
- 讲解结构、逐页口播、交互约束和证据边界：依据项目作者提供的《学术论文阅读笔记》整理。
- 页面中的数值均以论文或阅读笔记明确列出的结果为依据；不展示无法由公开评测条件支持的泛化结论。

## 项目入口

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 7 页正式内容、4 页备用答疑、逐字口播与公式 |
| `src/App.tsx` | 封面、正式演示、论文原图和键盘翻页 |
| `src/components/PageDrawers.tsx` | 页面相关的结果对比与备用答疑侧边抽屉 |
| `src/components/ResultsDrawer.tsx` | 五类指标、全部模型数据、交互表格与条形比较 |
| `src/modules/*.tsx` | 论文专属 SVG 交互与信息图 |
| `public/paper/*` | 从两篇论文对应图表裁出的网页素材 |
| `src/lib/useTimeline.ts` | 两段核心动画的播放、暂停与重播时间线 |
| `src/styles/paper.css` | 基于指定 12 色色卡的学术演示风格与响应式布局 |

## 演示操作

- `←` / `PageUp`：上一页。
- `→` / `PageDown`：下一页。
- 每页底部可使用“返回学习 / 继续学习”翻页，并可点击圆点直接跳转。
- 第 3 页和第 5 页只保留一个播放/暂停按钮；播放完成后按钮变为重播。
