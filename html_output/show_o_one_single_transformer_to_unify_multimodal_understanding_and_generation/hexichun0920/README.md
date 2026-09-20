# Show-o：同一舞台，两种节拍

基于 ICLR 2025 论文 **Show-o: One Single Transformer to Unify Multimodal Understanding and Generation** 的中文交互教程。

- 论文：https://arxiv.org/abs/2408.12528
- 官方代码：https://github.com/showlab/Show-o
- 新芽专题：https://grokcv.site/sprouts/umm/

## 本地运行

```bash
npm install
npm run dev
```

正式构建：`npm run build`。

## 教学设计

十章依次解释研究问题、统一提示格式、Omni-Attention、NTP/MTP 双目标、三阶段训练、真实指标、视觉表征消融、下游能力、失败边界和理解验收。主要交互包括三任务序列切换、注意力掩码矩阵、离散扩散步骤、训练阶段控制台、理解基准浏览器、Table 4 消融对照和五题测验。

页面区分论文真实指标、依据论文结论的解释和明确标注的教学模拟。不会把采样步数等同于端到端延迟，也不把“竞争力”表述为全面领先。

## 事实来源

| 内容 | 论文位置 |
|---|---|
| 统一提示、任务与边界 token | Fig. 3、§3.2 |
| 8192 图像词表、256×256→16×16 | §3.1 |
| Omni-Attention | Fig. 5、§3.2 |
| NTP + MTP | Eq. 1–3 |
| 三阶段训练 | §3.3 |
| 48 A100、35M 图文对、1.5M 步 | §4.1 |
| 理解与生成指标 | Table 1–3 |
| 连续/离散表征消融 | Table 4、§4.5 |
| OCR、文字生成、计数失败 | §4.6 |

教程整理：何熹淳（XichunHe），AI 辅助制作。
