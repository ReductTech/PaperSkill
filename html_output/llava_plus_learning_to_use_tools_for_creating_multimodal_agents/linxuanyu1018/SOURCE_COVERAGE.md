# 论文证据与教程覆盖

论文：LLaVA-Plus: Learning to Use Tools for Creating Multimodal Agents（ECCV 2024）

原文：https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/06341.pdf

PDF 共17页；15–17页为参考文献。原文提及的附录不在本文件中，未推测附录参数。

| 主题 | 原文定位 | 表述边界 |
|---|---|---|
| 图像与指令共同参与选工具和整合结果 | p4–5 §2.2, Figure 2, Eq2 | LMM planner, not text-only tool chaining |
| 用户对话与技能对话使用统一结构 | p5–6 §2.2, Table 1, Eq2 | Follow Table 1 execution example; prose on p6 has ambiguous reversed dialogue naming |
| 普通LLaVA序列与工具序列不同 | p4 Eq1; p5 Eq2 | Sequence notation, not numerical vector addition |
| girl/cart检测分割样例 | p5 Table 1 | COCO ID569536; values are source example, not new model output |
| 技能库及训练数据 | p7 Table 2; p6–8 §2.3 | Rows can contain composite skills; counts are samples, not unique-image count |
| 数据策划四变量 | p7–8 §2.3 | Language-only GPT-4 receives captions, coordinates, categories; uses generated/rephrased templates |
| 有参数与无参数技能 | p6–8 §2.3 | API_params depends on chosen tool |
| 助手输出掩码训练 | p5 Eq2 and paragraph; p8–9 §2.4 | Only green assistant subsequences and their stop tokens contribute; human/tool-result tokens are context |
| 81K与完整数据集 | p8–9 §2.4 | 81K understanding instructions for quantitative reporting; demo uses full data; mixed with LLaVA-158K |
| All Tools与Fly | p9 §2.4 | All Tools adds all understanding tools except segmentation; Fly only related results; no measured latency comparison supplied |
| Serving | p9 §2.4 | 7B and all tools can be served on one80G GPU in reported setting; not generic hardware minimum |
| COCO汇总分数反例 | p11 Table 4a | LLaVA-Bench COCO All; GPT4 relative score, not accuracy percentage |
| Wild汇总分数与thought消融 | p11 Table4a | LLaVA-Bench In-the-Wild All; GPT4 relative score |
| SEED反例 | p11 Table4b | 19K multichoice benchmark average; accuracy |
| Tool Use benchmark | p11 Table5 and text | 44 examples:10 grounding,12tagging,12caption,10OCR; GPT4 relative scores can exceed100 |
| MMVet同组比较 | p12 Table6 | Own7B runs24.1±0.0→27.5±0.3; do not mix reported23.8 baseline; 1.5 13B33.3±0.1→36.8±0.4 |
| VisIT排行榜 | p13 Table7; p12 text | Leaderboard snapshot2023-09-27; matches differ; reference included |
| 组合与图像保留 | p13 Figure3, p14 §4.3 | Example usessemantic mask+ControlNet or InstructPix2Pix+social text |
| 局限 | p14 Conclusion | Explicit limitations hallucinations and tool-use conflicts |
| 技能样本数 | p7 Table2 | Exact printed per-row counts; total is row sum not unique samples |
