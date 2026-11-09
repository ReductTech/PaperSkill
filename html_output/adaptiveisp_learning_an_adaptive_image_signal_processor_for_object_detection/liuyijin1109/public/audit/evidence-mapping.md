# 网页主张 — 原文位置 — 证据 — 核查状态

所有页码以本地 NeurIPS PDF 实际页码计。VERIFIED 表示核对原文，不代表独立复现。

| ID | 网页主张 / 章节 | 原文位置 | 图表/证据 | 状态 |
|---|---|---|---|---|
| C1 | 固定处理不能满足所有输入 S1–2 | §1–3 pp.1–5 | Fig.1–2；Eq.1–3 | VERIFIED |
| C2 | 线性 RGB 输入；RAW 不属于学习动作 S3 | §3 p.4 / App.B pp.16–18 | Fig.9 | VERIFIED |
| C3 | 10 模块及参数范围 S3 | App.B pp.16–18 | Eq.12–22；Table 4 | VERIFIED |
| C4 | 动作=离散 module+连续 parameters S4–5 | §3.2 p.4–5 | Eq.3；Fig.10 | VERIFIED |
| C5 | usage(N) 与 stage 附加输入 S5 | §3.3 / App.C pp.19–20 | Fig.10/12 | VERIFIED |
| C6 | actor–critic；softmax/tanh 等模块映射 S5/9 | §3.2 / App.C.1 | Fig.2/10 | VERIFIED |
| C7 | r=D(s)-D(s′)-P S6 | §3.2–3.3 pp.4–6 | Eq.4/9–11 | VERIFIED |
| C8 | 熵、重复使用、runtime 惩罚 S6 | §3.3 | Eq.10–11；App.A.4 Table 8 | VERIFIED |
| C9 | 五组 λc 设置 S7 | §4.1 p.8 / p.10 | Table 4 | VERIFIED |
| C10 | 阶段数预算；T=5；异常亮度训练截断 S4/8 | App.C.2 pp.19–20 | Eq.23–24；Fig.11 | VERIFIED |
| C11 | 冻结 YOLOv3；梯度传至 ISP/策略 S9 | §4 p.6 / App.C.3 | Fig.2/12 | VERIFIED |
| C12 | Adam 3e-5, batch 8, 100000 iterations, RTX3090 约24h S9 | App.A.1 p.14 | 训练说明 | VERIFIED |
| C13 | baseline 类别 S10 | §2 / §4.1 | Table 1；App.A.1 | VERIFIED |
| C14 | LOD 1830/400；All OnePlus 141；synthetic COCO val 5000 S11 | §4 p.6 | 数据段落 | VERIFIED |
| C15 | Table 1 三数据集三指标 S12 | p.7 | Table 1 | VERIFIED |
| C16 | 跨检测器 YOLOX / DDQ；分割 YOLOv5 S12 | §4.1 pp.7–9 | Table 2/3 | VERIFIED |
| C17 | 阶段消融与重复惩罚 S12 | p.10 / p.15 | Table 5/8 | VERIFIED |
| C18 | 高ISO去饱和、低ISO CCM 路径偏好 S13 | §4.2 p.9 | Fig.5；仅所分析数据 | VERIFIED |
| C19 | 论文图的输入/输出/箭头 S14 | pp.2/4/7/9/17/19/20 | Fig.1/2/3/5/9/10/12 | VERIFIED |
| C20 | 主动成像课程定位 S15 | 用户课程框架 | 教学性解释，不归为作者主张 | UNVERIFIED（非论文事实） |
| C21 | 可微 ISP 依赖 S16 | §5 p.10 | 作者明确局限 | VERIFIED |
| C22 | 过曝/欠曝训练失败 S16 | App.C.2 p.19 | Fig.11 | VERIFIED |
| C23 | 场景路由/参数/损失交互 S1–9 | 原理依据 C1–12，具体值为自编 | 教学示意；不是真实模型 | UNVERIFIED（非实验数据） |

SUPPORTED: C1–19, C21–22。教学解释不作实验支持主张。AUTHOR_INPUT_NEEDED：原文 Table 4/5 与 Fig.5 文字歧义的作者定论，详见 source-audit。
