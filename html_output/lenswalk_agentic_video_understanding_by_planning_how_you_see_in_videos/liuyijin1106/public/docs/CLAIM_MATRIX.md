# 网页主张—论文位置—图表 / 数据—核查状态

核查日期：2026-10-04；`VERIFIED` = 已检查论文或官方仓库；`UNVERIFIED` = 未获足够证据；`AUTHOR_INPUT_NEEDED` = 需作者提供，仅在确实需要时使用。

| ID | 网页主张 | 论文原文位置 | 图表 / 数据 | 来源 | 状态与边界 |
|---|---|---|---|---|---|
| C1 | 固定一次性上下文可能遗漏稀疏事件、产生冗余 | §1、§2 | Figure 1(a) | 论文 | VERIFIED；是作者对典型方法的分析 |
| C2 | Reasoner 多轮计划观察的 scope、density 和工具 | 摘要、§3.1–3.2 | Eq. a_t、Figure 2 | 论文 | VERIFIED |
| C3 | Scan Search 分片稀采样、并行找线索 | §3.3 Scan Search | Figure 2 | 论文 | VERIFIED |
| C4 | Segment Focus 单连续区间密采样 | §3.3 Segment Focus | Figure 2 | 论文 | VERIFIED |
| C5 | Stitched Verify 联合观察多个不连续区间，支持不对称采样 | §3.3 Stitched Verify | Figure 2 | 论文 | VERIFIED |
| C6 | Timestamp Anchors 和 Subject Memory Table 辅助跨轮一致性 | §3.4 | Figure 2、Table 4 | 论文 | VERIFIED；并非通用长期记忆 |
| C7 | 官方实现工具名与可选 registry 开关 | README、`tool_configs/vcs_standard.yaml` | `--subject_registry True` | 官方仓库 | VERIFIED；代码实现细节 |
| C8 | 框架无需模型微调 | 摘要、§4.1、§5 | Table 1–3 | 论文 | VERIFIED；并非零推理成本 |
| C9 | o3: LVBench 57.1→68.6；Video-MME Long 64.7→71.4 | §4.2 | Table 1 | 论文 | VERIFIED；+11.5、+6.7 个百分点 |
| C10 | GPT-4.1 baseline 63.1；o3/GPT-4.1 为 70.0 | §4.2 | Table 1 / Table 3 | 论文 | VERIFIED；Video-MME Long +6.9 点 |
| C11 | 三工具和两 grounding 模块的消融 | §4.3 | Table 4 | 论文 | VERIFIED；70.0 对应全配置，缺 Scan 为 65.4 |
| C12 | 并非所有 model recipe 都提升 | §4.3 | Table 3 | 论文 | VERIFIED；Qwen3 planner + Qwen2.5-VL-72B 为 62.5 vs 63.1，-0.6 点 |
| C13 | 无离线预处理但在线调用更慢 | Appendix C.1 | Table 6 | 论文 | VERIFIED；o3 38.9s vs LensWalk 190.35s，DVD 准确率更高 |
| C14 | 六种工具行为与四类失败模式 | §4.4、Appendix C.2–C.3 | Figure 4、Figure 13–21 | 论文 | VERIFIED；不是每次推理都会依固定顺序调用全部工具 |
| C15 | 作者公开 inference path、工具配置与 smoke tests，未公开训练代码和 annotations | — | README | 官方仓库 | VERIFIED；仅指当前公开版本 |
| T1 | 10 分钟时间轴与拿放物体模拟 | — | 无 | 教学设计 | UNVERIFIED（教学示意）；不作实验主张 |
| T2 | V*“看哪里”→Act2See“何时补证据”→LensWalk“怎么看” | — | 无 | 专题设计 | UNVERIFIED（专题脉络中的教学性解释）；非 LensWalk 作者直接比较 |
| T3 | 物理相机、机器人视点等边界 | — | 无 | 方法结构分析 | UNVERIFIED（方法结构分析）；不当作作者实验结论 |
| U1 | 浏览器模拟是否对应论文真实调用轨迹 | — | 无 | — | UNVERIFIED；网页已明确否认是原始日志 |
| U2 | CVPR PDF 与 arXiv v1 的逐字一致性 | — | — | CVF 页面读取 403 | UNVERIFIED；课程内容核查以可访问 arXiv 全文为准 |
| A1 | 独立复现实验的原视频、标注、API与算力 | — | — | 需研究者提供 | AUTHOR_INPUT_NEEDED；不影响教程使用 |

链接：[全文](https://arxiv.org/html/2603.24558) · [官方仓库](https://github.com/likanchuan09171/LensWalk)。
