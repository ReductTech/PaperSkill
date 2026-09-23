# Emu3：世界是一条 Token 流

基于论文 **Emu3: Next-Token Prediction is All You Need** 的中文交互教程。

- 论文：https://arxiv.org/abs/2409.18869
- 官方代码：https://github.com/baaivision/Emu3
- 新芽专题：https://grokcv.site/sprouts/umm/

## 本地运行

```bash
npm install
npm run dev
```

正式构建：`npm run build`。

## 教学设计

十章以“一个目标是否足够”为主线，解释 Emu3 如何把文本、图像和视频离散成一条因果 token 流，并仅靠 next-token prediction 完成理解、图像生成、视频生成和未来预测。页面重点呈现视觉 tokenizer、二维图像序列化、视频时空压缩、131K 上下文、受约束解码、DPO 后训练、真实指标与评测口径。

交互包括系统栈删减器、视觉 tokenizer 计算器、图像扫描顺序、视频时间轴、架构仪表盘、解码约束控制台、指标浏览器、DPO 取舍、四篇论文路线串联和五题测验。教学模拟均明确标注。

## 事实来源

| 内容 | 论文位置 |
|---|---|
| Vision tokenizer：32,768 codebook，4×8×8 压缩 | Table 1–2 |
| 8B、32 层、4096 hidden、131,072 context | Table 3 |
| 统一 next-token objective | §2.3 |
| 图像/视频理解与生成后训练 | §2.5 |
| GenEval 0.66、DPG-Bench 80.60/81.60 | Table 4 |
| 5 秒 24 FPS 视频与未来预测 | §3.2–3.3 |
| Prompt rewriting 与 CFG 的评测设置 | §3.1、Appendix B |
| 官方开源模型与推理代码 | 官方 GitHub |

教程整理：何熹淳（XichunHe），AI 辅助制作。
