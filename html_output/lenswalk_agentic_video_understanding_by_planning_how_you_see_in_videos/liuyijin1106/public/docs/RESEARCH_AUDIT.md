# LensWalk 论文精读与设计记录

核查日期：2026-10-04。学术内容逐节核查使用作者的 [arXiv 全文 v1](https://arxiv.org/html/2603.24558)；代码事实以[官方仓库](https://github.com/likanchuan09171/LensWalk)发布版本为依据。仓库附有 arXiv PDF 和两张原图，但本次未对 PDF 逐页文本校勘。[CVPR 2026 开放获取版](https://openaccess.thecvf.com/content/CVPR2026/papers/Li_LensWalk_Agentic_Video_Understanding_by_Planning_How_You_See_in_CVPR_2026_paper.pdf)的读取返回 403，未做逐页版本差异核对，故不主张两个版本逐字一致。

## Intake

- 任务：完整中文交互式课程网页；产物：当前目录独立 React/TypeScript/Vite 项目。
- 学科：计算机视觉、长视频问答与主动感知；论文：Li 等，CVPR 2026 Highlight（Highlight 标记来自官方项目主页和仓库）。
- 可用证据：正文 §1–5、Appendix A–C、Table 1–8、Figure 1–4、官方仓库工具配置与 README。
- 无需作者补交数据才能完成教学网页；论文实验复现需要 benchmark annotations、视频、模型/API 等，仓库未附这些文件。

## 论证模型

**研究问题**：长视频问答中，一次性固定选择视觉上下文无法随推理中形成的假设调整观测范围和密度，能否让推理器按需再看原始视频？

**一句话主张 C2**：LensWalk 把视觉上下文选择变为推理过程中的多轮、参数化观察计划，让 reasoner 控制时间范围、采样密度与工具，并用新证据继续推理。证据：摘要、§1、§3.1–3.3、Figure 1–2。`VERIFIED`

**支持主张**：

1. C1：典型固定上下文会遗漏稀疏事件或引入冗余。证据：§1–2、Figure 1。`VERIFIED`
2. C3–C5：Scan Search、Segment Focus、Stitched Verify 分别用于广域线索定位、单段细查、跨不连续时刻的联合核查。证据：§3.3，官方 `tool_configs/vcs_standard.yaml`。`VERIFIED`
3. C6：时间戳锚点与 Subject Memory Table 维持跨轮证据定位与实体引用。证据：§3.4，Figure 2；代码中的 registry 为可选开关。`VERIFIED`
4. C8–C12：在论文报告的模型与基准设置下，多组配方的准确率提升，且不需要微调。证据：摘要、§4.1–4.3、Table 1–4。不能泛化为所有模型均提升：Table 3 中 Qwen3-235B-A22B + Qwen2.5-VL-72B 为 -0.6 点。`VERIFIED`
5. C13：无离线预处理的代价优势与在线时延之间存在权衡。证据：Appendix Table 6：LensWalk 68.6% / 190.35s / 0s offline；o3 57.1% / 38.9s；DVD 74.2% / 153.3s online / 2180.4s offline。`VERIFIED`

**作者明确结论**：主动编排观察可带来准确率增益，并出现 progressive zoom-in、reflective replanning、integrative verification 等行为（§5、§4.4）。

**作者明确局限 / 失败模式**：Appendix C.3 列出过早结束、证据稀释、持续歧义、静态重复；§4.3 指出较弱 planner 对强 observer 未必有效；§3.4 承认 observer 或记忆更新错误可能引入不一致。没有把这些扩大成所有部署环境必然发生的结论。

**教学性解释**：十分钟玩具时间轴、人物拿放物体、V*→Act2See→LensWalk 教学脉络、物理相机控制边界，均是帮助理解方法的示意或结构分析，不是论文数据。网页显著标“教学示意”或“专题脉络中的教学性解释”。

**不能确认**：当前公开材料不能核实网页模拟情节在真实样本中的出现频率；不能从本地静态网页推断模型表现；不能从论文得出各类硬件部署成本；CVPR PDF 与 arXiv v1 的逐字差异未核对。`UNVERIFIED`，网页不陈述这些数值或结论。

## 术语与事实边界

- 论文名称：Scan Search / Segment Focus / Stitched Verify；代码函数：`scan_observer` / `segment_observer` / `stitched_observer`。网页同时列出，避免把命名差异当作另一个模块。
- 论文：Subject Memory Table。代码 README：可选 `--subject_registry True` 与 Global Subject Registry。网页按论文解释核心角色，代码可选开关另行标注。
- “>5%”为摘要的总体概括；具体对照都报告百分点及同一基线。比如 o3 在 LVBench 从 57.1 到 68.6，是 +11.5 个百分点。
- “training-free”指 LensWalk 框架在报告设置中不需模型微调，不代表无模型、API、token 或时间开销。
- 论文表格中的跨方法比较涉及公开报告与复跑混合来源（§4.1），因此页面不把它们描述为全部同环境本地复现。

## 网页故事线

固定视觉上下文的瓶颈 → 推理状态决定下一步观察 → 参数化时间范围与密度 → 三工具执行 → 时间戳与实体记忆接回推理 → 对照实验检验收益及成本 → 主动感知定位与失败边界。每章有问题、结论、视觉/交互和下一问。真实图表与教学重绘分区展示。
