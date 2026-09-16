# PhyAgentOS 交互式论文教程（Agent-enhanced）

基于论文 *PhyAgentOS: A Self-Evolving Operating System for Embodied Agents with Decoupled Cognitive Planning and Physical Execution*（arXiv:2607.16636）的简体中文交互式教程。

论文原文：https://arxiv.org/abs/2607.16636

## 项目定位与版本关系

本版本是 **PaperSkill-generated + Agent-enhanced** 实现：PaperSkill 提供基础教程结构与生成规范，随后在此基础上进行了二次教学设计、交互、可访问性与视觉增强。因此本版本允许修改框架组件，并混合使用 React DOM、SVG 与少量 Canvas；它不代表未经修改的 PaperSkill canonical output。

同一论文当前保留两种实现，便于对照 PaperSkill 原生约束与后续增强效果：

| 版本 | 目录 | 定位 |
| --- | --- | --- |
| Canonical | `ganwenjie0914` | Strict PaperSkill canonical implementation；遵循 PaperSkill 原生生成边界，已通过 PR #177 合并到 `ReductTech/PaperSkill` |
| Enhanced | `ganwenjie0914_2` | PaperSkill-generated + Agent-enhanced；在 canonical 思路基础上进一步强化教学结构、交互、视觉和可访问性 |

Canonical 版本：

`https://github.com/ReductTech/PaperSkill/tree/main/html_output/phyagentos_a_self_evolving_operating_system_for_embodied_agents_with_decoupled_cognitive_planning_and_physical_execution/ganwenjie0914`

Canonical PR：

`https://github.com/ReductTech/PaperSkill/pull/177`

## 教学主线

教程保持问题驱动结构：

领域角色 → Verification Gap → Runtime 系统层 → State-as-a-File → Session → 双执行流 → SessionVerifier → 系统级自演化 → 渐进验证与安全 → 实验证据边界。

增强版本的目标不是单纯增加动画，而是让读者能够通过操作理解论文中的系统角色、状态转换、验证机制、恢复闭环与实验结论边界。

## 核心交互模块

项目包含 16 个教学实验室，以及 1 个各章复用的徒步类比场景。模块注册表位于 `src/modules/registry.tsx`。

| 组件 | 章节 | 教学作用 |
| --- | --- | --- |
| `AnalogyScene` | 各章 | 随章节变化的徒步类比场景 |
| `RoleMap` | 1.1 | 找出语义验证与经验复用的责任空缺 |
| `ReturnCodeLab` | 2.1 | 体验 Execution Success 与 Semantic Failure 的冲突 |
| `OSLayerBuilder` | 3.1 | 逐项搭建 Runtime 能力并与 ROS 对照 |
| `ArchGraph` | 3.2 | 从主链渐进展开完整系统架构 |
| `ProtocolViews` | 4.1 | 观察同一现实状态在五份协议中的不同视图 |
| `SessionLifecycle` | 5.1 | 推进状态机并尝试非法状态转移 |
| `PreflightLab` | 5.2 | 在接触机器人前完成兼容性预检 |
| `DualFlow` | 6.1 | 对比 Policy-driven 与 Agent-directed 执行流 |
| `VerifierLab` | 7.1 | 根据 G / S₀ / S_T / τ / H 自行给出 verdict |
| `ArchMap` | 8.1 | 追踪失败、子会话、复验到经验固化的完整旅程 |
| `GrandLoop` | 8.2 | 可暂停、跳转的系统级自演化闭环 |
| `TierLadder` | 9.1 | 对比 Game / Simulation / Real Robot 渐进验证 |
| `FiveLayers` | 9.2 | 注入故障并观察五层防御的责任边界 |
| `BenchmarkLab` | 10.1 | 按协议和指标阅读六个实验基准 |
| `ClaimChecker` | 10.2 | 区分论文支持、过度解读与错误主张 |
| `GrandTrail` | 10.3 | 汇总 Session 环路、First→Final 与三层验证 |

## 技术实现

- React 18 + TypeScript + Vite。
- 教学数据集中在 `src/data/tutorial.ts`。
- 交互组件位于 `src/modules/`，共享控件位于 `src/modules/kit.tsx`。
- `src/styles/tokens.css` 定义设计令牌，`components.css` 保留基础框架样式，`paper.css` 包含增强页面与实验室样式。
- 页面支持侧栏章节导航、键盘翻页、术语 Hover/Focus 解释、响应式布局和 `prefers-reduced-motion`。
- 相比 canonical 版本，本版本允许增强框架层表现，并使用 DOM、SVG 与 Canvas 组合实现更复杂的教学交互。

## 图片与素材来源

`public/images/` 中的静态论文图像来自 PhyAgentOS 原论文，并按论文 Figure 编号保留文件名，便于回溯原始出处：

- `fig3-architecture.png`
- `fig5-watchdog.png`
- `fig7-file-protocol.png`
- `fig8-session-verifier.png`

原始来源统一为论文：

`https://arxiv.org/abs/2607.16636`

除上述论文静态图像外，教程中的主要流程图、状态图与交互视觉由本项目通过 React、SVG 或 Canvas 程序化绘制，用于教学解释，不作为论文原始图表冒充引用。

## 本地运行

```bash
npm install
npm run dev
npm run build
npm run preview
```

开发预览默认位于 `http://localhost:5173`，生产构建输出到 `dist/`。

## 构建与验收

执行增强版本完整验收：

```bash
npm run check
```

该命令依次完成：

1. TypeScript 编译与 Vite 生产构建；
2. PaperSkill 官方结构 validator；
3. enhanced audit，包括模块注册、README、资源、术语、章节结构和临时文件检查。

也可以分别运行：

```bash
npm run validate:paper-skill
npm run audit:enhanced
```

导入 PaperSkill 仓库后的 `validate:paper-skill` 使用仓库内官方 validator：

```text
../../../paper-skill/scripts/validate-output.js
```

## 当前限制与证据边界

- 系统成功率提升来自验证、恢复、记忆与运行时治理，不表示底层 VLA 权重或模型能力本身提升。
- 真机实验主要验证跨硬件集成与安全机制，不等同于大规模真机任务成功率评测。
- Verifier 的误判率、不同恢复机制的独立贡献，以及恢复带来的时间与推理成本仍缺少充分量化。
- 本版本属于 enhanced 教学成果；若需要评估 PaperSkill 自身在严格生成约束下的能力，应以已合并的 `ganwenjie0914` canonical 版本作为基准。
