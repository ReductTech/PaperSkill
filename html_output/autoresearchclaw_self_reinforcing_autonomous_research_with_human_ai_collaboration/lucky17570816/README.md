# AutoResearchClaw V2：4 分钟动画论文汇报

独立于 `autoresearchclaw_output` 的 V2 动画版 React + TypeScript + Vite 单页演示，基于论文 [AutoResearchClaw: Self-Reinforcing Autonomous Research with Human-AI Collaboration](https://arxiv.org/abs/2605.20025v2)。原版项目保持不变。

它不把论文按目录翻译成网页，而是用唯一主线解释：为什么线性自动科研不够、系统如何让失败和证据回到研究过程、实验如何支持这一设计。

## 运行与构建

```powershell
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
```

`vite.config.ts` 使用 `base: './'`，生成的 `dist/` 可部署在 GitHub Pages 的仓库子路径下，无须假定站点位于根路径。

## 六段主线

1. Motivation：运行线性 AI Scientist，观察实验失败如何中止 pipeline。
2. Challenges：假设质量、执行鲁棒性、跨运行经验积累。
3. AutoResearchClaw：三项核心能力与两项科学护栏。
4. How It Works：可操作的 Research Simulator，包含四个 V2 动画场景：实验失败 Canvas、Self-Healing 回路、证据验证闸门、跨运行经验流。
5. Experiments：ARC-Bench 设置、主结果、消融、HITL 研究与批判性阅读。
6. Takeaway：从 Idea→Paper 到 self-reinforcing scientific feedback loop。

## Presenter Mode

右上角点击 **Presenter Mode**，或进入后使用：

- `ArrowRight` / `Space`：下一个站点
- `ArrowLeft`：上一个站点
- `Esc`：退出 Presenter Mode

固定的 12 个站点按约 4 分钟安排：Motivation、Challenges、Architecture、Hypothesis Debate、Experiment Failure、Repair/Refine/Pivot、Result Debate、Verification、Cross-Run Evolution、Experiments、HITL、Takeaway。进入模拟器站点时，Presenter Mode 会自动切换到对应教学场景。

## V2 动画原则

- 动画只表达科研含义：运行中断、失败诊断、路径回流、证据闸门和经验注入。
- 四个核心场景均可在自由浏览模式下点击和重播；`prefers-reduced-motion` 下自动退化为静态状态。
- 视觉采用白色纸张感、深蓝文字、克制边框与语义色彩，不使用外部视频或动画库。

## 论文数据口径

- Table 2：25-topic experiment-stage，CD/CE/RA 权重为 25/25/50；`+54.7%` 是 CoPilot `0.648` 相对 AI Scientist v2 `0.419` 的 Overall 提升。
- Result Analysis：CoPilot `0.523`、AI Scientist v2 `0.261`，相对提升 `+100.4%`。
- Table 3：10-topic end-to-end HITL ablation；Table 5：10-topic Full-Auto best-of-3 component ablation。这两类结果不与 Table 2 混比。
- Cross-Run Evolution 通过 lesson retrieval 和 prompt injection 工作，不是重新训练 LLM。
