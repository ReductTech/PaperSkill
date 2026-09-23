# Chameleon：把图像写进句子

基于论文 **Chameleon: Mixed-Modal Early-Fusion Foundation Models** 的中文交互教程。

- 论文：https://arxiv.org/abs/2405.09818
- 官方代码：https://github.com/facebookresearch/chameleon
- 新芽专题：https://grokcv.site/sprouts/umm/

## 本地运行

```bash
npm install
npm run dev
```

正式构建：`npm run build`。

## 教学设计

十章围绕一个主问题展开：图像与文字都变成 token 后，为什么仍然难以训练？教程依次解释早期融合、图像离散化、共享词表、任意交错序列、模态竞争导致的数值失稳、QK-Norm 与 z-loss、9.2T token 训练、对齐、人工评测和可信边界。

主要交互包括混合序列编排器、图像 tokenizer 显微镜、共享词表探针、稳定性控制台、训练数据混合器、7B/34B 架构切换、人工评测票数还原、结论审计和五题测验。教学模拟均明确标注，不冒充论文实验。

## 事实来源

| 内容 | 论文位置 |
|---|---|
| 512×512 图像压缩为 1,024 token，图像 codebook 8,192 | §2.1 |
| 统一 BPE 词表 65,536 | §2.1 |
| 混合模态预训练数据与 2.9T 文本 token | §2.2 |
| QK-Norm、norm reordering、z-loss | §2.3、Fig. 5–6 |
| 9.2T token、批大小与优化器 | §2.3、Table 1–2 |
| SFT 六类数据与对齐策略 | §3 |
| 混合模态人工评测 | §4、Fig. 9 |
| 文本、图像到文本、图像生成结果 | §5、Table 6–9 |
| OCR 上界、评测覆盖和发布能力限制 | §2.1、§4.5、官方代码说明 |

教程整理：何熹淳（XichunHe），AI 辅助制作。
