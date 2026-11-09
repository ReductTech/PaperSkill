# AdaptiveISP 来源审计

核查日期：2026-10-07。状态：READY_WITH_WARNINGS。任务是中文交互教程，不是实验复现。

## Intake / 权威顺序
计算成像、目标检测、强化学习；NeurIPS 2024 正式论文优先，其次附录（已包含在同一 26 页 PDF 中），其次官方仓库实现。当前目录独立构建 React/TypeScript 项目。原有项目只读。

- R1 VERIFIED：[NeurIPS 正式页面](https://papers.neurips.cc/paper_files/paper/2024/hash/cc596a803bedc7a03a87e98c77a22efe-Abstract-Conference.html)。标题、五位作者、会议已核实。
- R2 VERIFIED：[正式 PDF](https://papers.neurips.cc/paper_files/paper/2024/file/cc596a803bedc7a03a87e98c77a22efe-Paper-Conference.pdf)。制作阶段核对了包含附录 A–C 的正式 PDF；提交版本通过远程链接提供，不附带 PDF 文件。
- R3 VERIFIED：[官方项目页](https://openimaginglab.github.io/AdaptiveISP/)。作者机构：Shanghai AI Laboratory、Peking University、The Chinese University of Hong Kong。网页 BibTeX 不完整，不直接复制。
- R4 VERIFIED：[官方代码](https://github.com/OpenImagingLab/AdaptiveISP)。从作者项目页链接确认；网络克隆失败，使用 GitHub 文件页面静态核查 config.py、agent.py、train.py。
- R5 视觉参考：InSpatio 公开页面首次抓取失败；本机 V* 与 Vista4D 公共样式已读取。复制 V* 的 paper-tokens / components / base / shell / paper-skill-frame 到本项目，无跨项目运行依赖。

## 研究论证（先于页面实现建立）
问题：如何针对输入图像，同时选择 ISP 模块、顺序和连续参数，使固定检测器更好地识别，并约束 ISP 成本？

核心主张 C1：把线性 RGB 的后续 ISP 配置建模为序贯决策，以检测损失下降和惩罚训练 actor–critic，逐图生成处理路线。

支撑：C2 离散模块与连续参数联合预测（§3 / Fig.2）；C3 场景间存在不同路径偏好（Fig.5）；C4 成本惩罚与推理阶段预算提供两种权衡机制（Table 4–5）；C5 LOD 和跨数据/检测器实验支持所测设置内的效果（Table 1–3）。

作者明确结论：动态模块与参数有助于检测；任务导向图像与视觉质量导向图像可以不同；少量阶段已获得大部分收益；当前研究依赖可微 ISP（§5）。

教学解释：专题中的主动成像定位、SVG 街景、预设路线与参数、虚构损失及成本滑块。它们不是作者执行轨迹、模型输出或本地复现。

## 关键纠偏与矛盾账本
| 位置 | 原文/预设风险 | 教程处理 | 证据 |
|---|---|---|---|
| 输入 | 将 RAW/Bayer 直接送策略 | 静态 RAW 预处理后得到线性 RGB | §3, App.B Fig.9 |
| 停止 | 学习独立 Stop/skip 动作 | 10 种模块中选一；按配置 T 截止，论文 T=5 | App.C.2；agent.py submitted=is_last_step |
| Reward | 把 mAP 或美观度写成 reward | 检测误差下降减惩罚；mAP 为评测指标 | Eq.4/9–11 |
| 反馈 | 推理实时依赖 GT reward | 训练反馈、推理逐步策略执行分别展示 | §4, App.C.3 |
| Table 1 | “所有数据集所有指标都最好” | OnePlus mAP@0.5 为 70.1，小于 Attention-aware 的 70.9 | p.7 Table 1 |
| Table 5 | 表题 two stages；正文 3 stages best | 保留 1–5 步数值；4/5 步最高 71.4（@0.5） | p.10 Table 5 |
| Table 4 | 表题 λc=0.1，正文 λc=0.01 指向效率设置 | 展示五个独立设置，不静默归一 | p.8 / p.10 |
| Fig.5 | “每个匹配路径所有指标最优” | Subset 3 的 @0.5 最优为 Pipeline 2；@0.75 为 Pipeline 3 | p.9 Fig.5 |
| 延迟 | 1.2 ms 当作整条 pipeline 延迟 | 仅为 GTX1660Ti 每阶段策略推理；Table 4 单独列 ISP 总时间 | §4.1 |
| 预算 | λc 改动当作现成策略实时重训练 | 训练成本权重与无需重训的推理阶段数分别说明 | §4.1–4.2 |

## Repo 核查
- config.py：10 个 filter；runtime 成本数组；成本惩罚开关默认 False，λ=0.01 不能写成所有论文实验统一开启。
- agent.py：训练采样、推理 argmax；维护 usage 和 stage；submitted 由 test_steps 决定；代码额外有越界图像惩罚。
- train.py：检测 loss 的裁剪/缩放后差值、惩罚、TD advantage、actor 和 value loss；推理循环按 test_steps 执行。
- 以上是 main 页面在访问时的静态实现核查，没有运行官方模型；没有锁定 commit SHA。仓库默认 discount_factor=1.0（注释 0.98），不推断唯一论文超参数。

## 不确定性
- UNVERIFIED：官方权重、数据下载、训练/评测复现、真实端侧功耗与本机延迟；未对所有仓库文件做逐行审计。
- AUTHOR_INPUT_NEEDED：如未来要求严格复现，需要实验目标、硬件与数据访问；当前教程无需作者额外输入。论文内部表述矛盾若要定论需原作者澄清。
- 课程对 V* / Act2See / LensWalk / AVP 的对照是用户提供的教学框架，不是 AdaptiveISP 作者的相关工作结论。

原图保留作者权利和出处。未将作者论文或图片重新授权为项目代码许可。
