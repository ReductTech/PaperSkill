# Flamingo：少样本学习的视觉语言模型 · 交互式教程

基于论文 *Flamingo: a Visual Language Model for Few-Shot Learning*（Jean-Baptiste Alayrac、Jeff Donahue、Pauline Luc、Antoine Miech 等 27 人，DeepMind，NeurIPS 2022，arXiv:2204.14198v2）生成的 React + TypeScript + Vite 交互教程。

- 论文：https://arxiv.org/abs/2204.14198
- 版本目录：`flamingo_a_visual_language_model_for_few_shot_learning/putianyi1116`
- 规模：10 章、14 个主动交互模块、10 张动画类比卡、约 8,900 字中文讲解
- 讲解档位：入门（对应项目内 7 讲精讲，教程重排为 10 章）

## 本地运行

```bash
npm install
npm run dev       # 开发预览
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 十章导读

| 章 | 标题 | 要回答的问题 | 交互模块 |
| --- | --- | --- | --- |
| 1 | 为什么需要 Flamingo | 三类旧范式各自死在哪一步 | 适配谱系滑杆 |
| 2 | 骨架：只训桥 | 哪一段在训练、哪一段冻着 | 冻结开关面板 / 规模滑块 |
| 3 | 把图像压成 64 个 token | 视觉特征如何被压成定长接口 | 压缩沙盘 / 压缩器对比 |
| 4 | 门控：先归零再放行 | 新层为什么不会破坏预训练语言模型 | α 旋钮 / 插入频率权衡 |
| 5 | 用提示来适配 | 不动权重怎么学会新任务 | 拼提示 |
| 6 | 多图为什么能外推 | 训练 5 张为何能推理 32 对 | 掩码矩阵 / 信息通道开关 |
| 7 | 网页怎么变成训练序列 | 交错数据如何被构造 | 网页改写器 |
| 8 | 怎么训、怎么评 | 权重与留出集各自影响什么结论 | 加权损失 |
| 9 | 证据怎么读 | 百分号到底是分差还是相对值 | 分差换算器 |
| 10 | 边界与位置 | 它比对比模型强在哪、弱在哪 | 任务-方法匹配 |

## 证据与引用约定

1. **行号锚点**：每条事实断言标注 `§节 …（L行号）`，行号对应论文纯文本抽取件（3653 行）。例如 `L409–L410` 指 Resampler 输出 64 个视觉 token 那两句。
2. **译文口径**：中文表述取自项目内逐节译文，术语取自锁定术语表，不在页面中临时更换叫法。
3. **数字口径**：论文里所有「%」实为 Overall 分数的绝对分差（70.7 降至 53.4 为 17.3 分），页面中一律显示为「分」，并在第 9 章给出换算器。
4. **已知原文不一致**：摘要、§1、图 2 图注与 §3.1 写「6 项超过微调 SotA」，表 1 图注写「seven tasks」。教程按 6 呈现，并在第 9 章显式说明该冲突，不替作者判定笔误。

## 关键术语

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| Visual Language Model (VLM) | 视觉语言模型 | 以视觉与文本为输入、以文本为输出的生成模型 |
| few-shot learning | 少样本学习 | 本文用 4 至 32 个示例，不做权重更新 |
| in-context learning | 上下文学习 | 把示例放进提示，靠续写作答 |
| Perceiver Resampler | Perceiver Resampler | 模块名，保留原文；把可变长视觉特征压成 64 个 token |
| gated cross-attention | 门控交叉注意力 | tanh 门控，α 初始为 0 |
| frozen | 冻结的 | 权重不更新，前向计算照常 |
| Overall score | Overall 分数 | 各基准分数除以其 SotA 后取均，是相对量 |

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/fwKit.ts` | 画布生命周期与配色助手 | ✅ 论文专属 |
| `src/modules/fwCh1to4.tsx` | 第 1 至 4 章交互模块（7 个） | ✅ 论文专属 |
| `src/modules/fwCh5to10.tsx` | 第 5 至 10 章交互模块（7 个） | ✅ 论文专属 |
| `src/modules/fwAnalogies.tsx` | 10 张 560×140 动画类比卡 | ✅ 论文专属 |
| `src/modules/registry.tsx` | 组件注册表（24 个 componentId） | ✅ 注册论文组件 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero / Chapter / Module 等） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 交互模块说明

- 每个模块都由学习者的操作驱动：拖动滑杆、切换按钮、点击格子或拖入卡片，画布随即更新选中态、数值与文字反馈。
- 反馈分三级：`good` 为正确路径，`bad` 为错误路径，无样式为探索中；错误反馈一律附原文行号，便于回查。
- 类比卡尺寸为 560×140，全部为时间驱动动画，用于在进入机制之前建立直觉，不承载数据。

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
