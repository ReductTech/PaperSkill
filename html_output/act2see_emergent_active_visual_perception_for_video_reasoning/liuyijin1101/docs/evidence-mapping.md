# 网页主张—原文证据映射

Status vocabulary: VERIFIED = checked against arXiv v1 primary text; UNVERIFIED = cannot independently confirm; AUTHOR_INPUT_NEEDED = author-only material. Site links use arXiv section anchors.

| ID | 网页主张 / 内容 | 论文位置 | 图表/数据 | 状态 |
|---|---|---|---|---|
| C1 | 固定初始帧可能遗漏推理后来需要的动态细节 | §1 | — | VERIFIED |
| C2 | 主动感知是在推理中决定何时、如何获取视觉信息 | §1, §2 | Algorithm 1 | VERIFIED |
| C3 | `<retrieve>` 查原视频，`<generate>` 合成假设画面 | §2.1, §3.2 | Fig. 1, Table 1 | VERIFIED |
| C4 | 生成先检索条件帧，再用 Stable Diffusion 3.5 Large 图生图 | §2.1, §3.2 | Algorithm 1 | VERIFIED |
| C5 | Gemini 2.5 Pro 两轮构建轨迹，人工 CoT 用于事后质量过滤 | §2.1, §3.2–3.3, Appendix B | Fig. 1, Tables 9–10 | VERIFIED |
| C6 | 3373 条轨迹，1608 条含视觉帧，1026 检索、582 生成 | §3.4 | Fig. 2 | VERIFIED |
| C7 | SFT 基座 Qwen3-VL-8B-Thinking，LoRA 参数 | §2.2, §4.3 | Eq. 1 | VERIFIED |
| C8 | 推理时工具调用与追加帧后继续生成 | §2.2 | Algorithm 1, Fig. 4 | VERIFIED |
| C9 | 五基准的本模型/基座准确率 | §4.1–4.4 | Table 2 | VERIFIED |
| C10 | 检索与生成双分支的 1000 样本消融 | §4.5 | Table 8 | VERIFIED |
| C11 | Chain-of-Frames 在 Video-MME 为 75.3，高于本方法 74.2 | §4.4 | Table 3 | VERIFIED |
| C12 | 生成画面可能不符合提示 | §4.4 | Fig. 4 | VERIFIED |
| C13 | V*→Act2See 是课程脉络比较 | 本教程教学分析；不是作者结论 | — | VERIFIED as teaching interpretation |
| C14 | 网页中的交互故事/画面是方法示意，无真实模型执行 | 本地网页实现 | — | VERIFIED as tutorial implementation |
| C15 | 官方代码可复现 | GitHub README 当前“Code available soon” | — | UNVERIFIED |
| C16 | CVF 与 arXiv 文本完全一致 | CVF 请求 403 | — | UNVERIFIED |
| C17 | 反事实子集上检索+生成 56.22%，仅检索 43.41% | Appendix F | Table 12 | VERIFIED |
| C18 | VCR-Bench 127 次生成中 13 次失败（10.2%） | Appendix F | failure categorization | VERIFIED |
| C19 | 0.5 fps Act2See 为 877 TFLOPs/38.7%，1 fps 基座为 1025 TFLOPs/38.2% | Appendix F | Table 11 | VERIFIED |
| C20 | ViTCoT、FrameMind 与 Act2See 的方法对照 | §5 | Tables 3–5 | VERIFIED within authors' descriptions |

All quantitative displays use the table's exact reported values. The site does not claim an independently reproduced score.
