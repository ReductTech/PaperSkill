# Story architecture

Thread: fixed frames → evidence gap → choose to see → retrieve real / generate hypothetical → append frame inside CoT → continue reasoning → evaluate outcome and boundaries.

| 章 | 读者问题 | Takeaway | 主要模块 | 下一问 |
|---|---|---|---|---|
| 01 | 固定帧为什么不够？ | 缺的是适时再看 | Static vs active lab | 怎样接入推理？ |
| 02 | 视觉如何进入 CoT？ | 视觉动作与文字步骤交错 | Interleaved timeline | 证据从哪来？ |
| 03 | 检索与生成怎么选？ | 真实与假设证据有不同地位 | Dual-channel lab | 训练链条是什么？ |
| 04 | 整体路线如何串联？ | 数据构建和推理是两个阶段 | Pipeline | 轨迹如何保证质量？ |
| 05 | 好轨迹怎么来？ | 人工 CoT 是事后过滤标尺 | Trace filter | 模型学什么？ |
| 06 | SFT 学到什么？ | 学会输出工具查询而非训练出图像生成器 | Before/after sequence | 实际推理怎样进行？ |
| 07 | 边想边看怎样发生？ | 响应先停在调用，再加入帧继续 | Inference simulator | 如何验证有效？ |
| 08 | 五个 benchmark 问什么？ | 不同任务检验不同推理能力 | Benchmark explorer | 分数如何读？ |
| 09 | 结果支持到哪？ | 对基座五项均提升，范围受限 | Exact results / ablation | 图像能说明什么？ |
| 10 | 原图怎样读？ | 图 1–4 分别展示构造、组成、样例、推理 | Original figure walk | 主动性的边界？ |
| 11 | 主动到底在哪里？ | 动作由当前推理状态触发 | Active loop | 与 V* 怎样衔接？ |
| 12 | 从 V* 到 Act2See 怎样前进？ | 从图像搜索扩展到视频推理中的证据获取 | V* → Act2See 专题图 | 新的不确定性是什么？ |
| 13 | 哪些证据能信、还没解决什么？ | 生成可偏离查询；外推需谨慎 | Failure/boundary cards + rapid recap | 自己能否判断动作？ |
| Final | 是否真正理解？ | 无新增事实 | Quiz + review/reset | — |

Chapter content uses `论文报告`, `教学示意`, and `基于方法结构的分析` labels. Progressive unlock stores progress only in localStorage; each unlocked chapter remains revisitable.
