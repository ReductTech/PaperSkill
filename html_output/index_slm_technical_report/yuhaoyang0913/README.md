# Index SLM Technical Report · PaperSkill V3

基于 PaperSkill 工作流迭代完成的交互式论文教程。V3 采用连续滚动的研究叙事：机制封面、训练生命周期、顶部阅读进度、章节状态导航与实验舞台。主线是：一个 1.9B 小模型，怎样通过数据、Tokenizer、架构、优化、后训练与评测，把能力一步步榨出来。

## 本地预览

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址，通常是 `http://localhost:5173`。

生产构建与预览：

```bash
npm run build
npm run preview
```

## v2 结构

9 个一级章节、17 个主动模块。页面不再使用初版的左侧 PPT 目录、一章一屏和底部翻页条。重点交互包括模型谱系树、Token Playground、Decoder 热点路径、深宽塑形器、Norm-Head 词表行与梯度状态、Loss/PPL 更新、数据净化、WSD 双轨时间轴与 2×2 因子实验、Pure/Boost 消融、performance surge 调查、SFT loss mask、DPO 概率质量迁移、Character RAG 流程、benchmark constellation 与 Evidence Map。

关键英文术语带悬停、键盘聚焦和轻触解释；每个主要实验旁都有 Paper Evidence，标记论文定位与解释边界。页面支持 `prefers-reduced-motion`。

Norm-Head、WSD×数据、Pure/Boost、performance surge、SFT、DPO 与 Character RAG 默认自动演示。自动状态每约 1.8–2.6 秒推进一次，均可暂停；用户点击或拖动模块后，自动演示立即让出控制权。运动减少偏好开启时不会自动推进。

## 事实边界

- 交互中标记为教学示意的概率、梯度倍率、筛选保留量与模拟曲线不是论文实测。
- 64.92 是 Table 4 的六任务均分，不包含 GSM8K 与 HumanEval。
- WSD × curated data 的 35.63 / 35.75 / 34.65 / 38.10 来自 §6.5 Figure 6，只支持该受控实验条件下的结论。
- Pure / Boost 的 7% instruction data 对照来自同一 stable-phase checkpoint 的 50K-step decay branches；Table 8 是 ablation checkpoints，不等同于发布模型的直接对照。
- 1.0T–1.2T performance surge 的原因仍未知；高质量数据与稳定大学习率只是作者给出的 plausible account。
