# TextLDM Research Console

基于 `paper-skill` 对 TextLDM 论文的梳理，构建的 React + TypeScript 交互式网页骨架。

## 启动

```bash
npm install
npm run dev
```

生产构建与类型检查：

```bash
npm run typecheck
npm run build
npm run preview
```

## 模块结构

- `src/App.tsx`：页面骨架、滚动导航、研究动机、核心问题、目标边界与核验状态。`n- `src/components/ParadigmShowcase.tsx`：首页 AR、离散 mask 扩散和 TextLDM 连续潜扩散的三模式动画切换。`n- `src/components/TextLDMPipeline.tsx`：训练/推理切换的 token → TextVAE → latent → TextDiT → 并行解码流水线；训练模式区分 TextVAE+REPA 与 TextDiT Flow Matching 两阶段，推理模式仅显示 decoded target segment。
- `src/components/MethodLab.tsx`：TextVAE、REPA、TextDiT 的可切换方法模块。
- `src/components/ExperimentFlow.tsx`：可点击、前后切换和自动播放的实验流程步骤图，并展示每一步的细化说明与审阅重点。`n- `src/components/ExperimentSimulator.tsx`：基于论文 Table 1-4 相对趋势的参数化代理模拟器；真实论文锚点与编者启发式指标已分区标注。`n- `src/components/DenoisingPlayground.tsx`：严格引用 Appendix D Table 7 的去噪步数滑动示例，展示同一 prompt 从噪声到更连贯文本的过程。`n- `src/components/EvidenceMatrix.tsx`：按证据状态过滤和展开的主张-证据矩阵。
- `src/components/ResultsLab.tsx`：按评测集、指标和模型类别筛选的结果浏览器。
- `src/components/SectionHeader.tsx`：统一章节标题。
- `src/components/Icon.tsx`：无第三方依赖的 SVG 图标。
- `src/data/paper.ts`：论文结论、实验结果、证据状态和页面导航的数据源。
- `src/styles.css`：深色研究控制台视觉系统与响应式布局。

## 内容口径

页面将论文内容明确区分为 `SUPPORTED`、`PARTIAL` 和 `UNSUPPORTED`：

- 文本续写中的潜扩散迁移已有实验支持。
- REPA 对下游生成质量的提升已有消融与重建精度对照支持。
- NFE 恒定不等于总计算量、FLOPs 或墙钟时间恒定。
- 统一多模态生成与理解属于未来工作，不是当前实验结论。






