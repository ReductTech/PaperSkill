# ClawGUI：训练、评测与部署 GUI 智能体的统一框架 交互式教程

基于论文 *ClawGUI: A Unified Framework for Training, Evaluating, and Deploying GUI Agents*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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
| `src/lib/*` | 静态工具（canvasKit / 渐进加载 / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 教学设计

比喻按章取材于最贴切的日常场景，不强行统一到单一主线（第 1 章与第 6 章首尾呼应）：

| 章 | 论文概念 | 生活比喻 |
| --- | --- | --- |
| 1 | 训练 / 评测 / 部署三段断裂 | 一条断了三处的路，车开不过去 |
| 2 | 稀疏结果奖励 vs PRM 稠密逐步奖励 | 盖着锅盖炖到底 vs 中途舀一勺尝咸淡 |
| 3 | 评测配置漂移导致分数不可比 | 同一个人站上两台没对齐的体重秤 |
| 4 | 跨会话持久个性化记忆 | 常去那家店，一句「老样子」就够 |
| 5 | 小模型经训练超过更大模型 | 练过的小个子跑赢没练过的大块头 |
| 6 | 三段被同一套框架打通 | 三处断口都架上了桥，一次走完 |

章节即 pipeline 的一个环节，共 **6 章 11 个主动交互模块**，面向 4 分钟口头汇报编排：

| 章 | 内容 | 模块 |
| --- | --- | ---: |
| 1 | 三道裂缝：从研究到用户的路断在哪 | 2 |
| 2 | ClawGUI-RL：训练闭环与稠密奖励 | 2 |
| 3 | ClawGUI-Eval：配置锁定与 95.8% 复现 | 2 |
| 4 | ClawGUI-Agent：混合控制与真机部署 | 2 |
| 5 | ClawGUI-2B：同规模对照 + 跨规模赛跑 | 2 |
| 6 | 整条路走完：三类证据各管一段 | 1 |

GiGPO 只在训练闭环里带过一句（它来自 Feng et al. 2025b，非本文提出），不单独展开；
容器崩溃恢复、备用服务器轮换等纯工程细节已整体移除，只保留讲得动、听得懂的主线。
页面视觉为 Tufte 式暖纸风：衬线标题、赭红点缀、细规则线，全部通过
`src/styles/paper.css` 的变量覆盖实现，未改动模板框架文件。

## 素材来源说明

- **论文原图**：`public/images/fig1-overview.png` 与 `public/images/fig2-rl.png`
  取自论文 arXiv:2604.11784v1 的 Figure 1（框架总览）与 Figure 2（ClawGUI-RL 总览），
  由 PDF 原文裁切得到，分别配在模块 1.2 与 2.1 的交互图旁作为原文对照，
  仅用于教学讲解，版权归原作者所有。
- 其余全部视觉元素均为本项目使用 HTML Canvas 原生绘制，无外部图片、字体或 CDN 依赖。
- 运行时依赖仅 `react` 与 `react-dom`。

## 数据准确性约定

页面中出现的论文数值均可追溯到原文（表 1、表 2、表 3 及 3.2–3.4 节）。
凡属机制示意、论文未公布具体数值的演示（如第 2 章逐步奖励的方向标记、
第 3 章评测配置的示例取值），均在对应模块内以醒目的 `.src-note.warn`
标注「示意演示，非论文原始数据」，不与论文原始数据混淆。
本轮改版已删除此前编造的量化数据：评测配置的分数偏移量、CLI/GUI 任务步数与覆盖率、
逐步奖励的具体分值、聊天对话轮数，均不再出现。

需要特别说明的两点：

1. **GiGPO 来自 Feng et al., 2025b，并非本论文提出**；本论文的贡献是将其集成进开源 GUI RL 基建。
2. ClawGUI-2B 的 17.1% 相对 MAI-UI-2B 的 11.1% 是 **+6.0 个绝对百分点**（相对提升约 54%）。
   论文 4.2 节的 "relative margin of 6.0%" 与摘要/引言的 "6.0 absolute points" 表述不一致，
   本教程按绝对百分点呈现。
