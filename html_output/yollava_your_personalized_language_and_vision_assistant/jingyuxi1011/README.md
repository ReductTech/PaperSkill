# Yo'LLaVA: Your Personalized Language and Vision Assistant

NeurIPS 2024 论文的简体中文交互式教程，使用 React、TypeScript 和 Vite。共 9 章，介绍少量参考图片、主体表示、latent tokens、训练与推理、文本与视觉对话、实验、消融、泛化和局限。

作者：Thao Nguyen、Haotian Liu、Yuheng Li、Mu Cai、Utkarsh Ojha、Yong Jae Lee。

- [NeurIPS 正式论文](https://proceedings.neurips.cc/paper_files/paper/2024/file/48088756ec0ce6ba362bddc7ebeb3915-Paper-Conference.pdf)
- [NeurIPS Proceedings](https://proceedings.neurips.cc/paper_files/paper/2024/hash/48088756ec0ce6ba362bddc7ebeb3915-Abstract-Conference.html)
- [arXiv 2406.09400](https://arxiv.org/abs/2406.09400)
- [官方代码](https://github.com/WisconsinAIVision/YoLLaVA)
- [官方项目页面](https://thaoshibe.github.io/YoLLaVA/)
- [数据集页面](https://huggingface.co/datasets/thaoshibe/YoLLaVA)

## 运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

生产构建使用相对资源路径，可通过 PaperSkill 集合站部署。教程不调用模型 API，不需要模型权重或数据集下载。

## 章节与交互

1. Introduction：通用类别与用户具体主体的切换对照。
2. Overview：点击探索参考图、主体表示、冻结模型与对话。
3. Learning Personalized Subjects：输入、更新与输出路径；组件点击与公式符号解释。
4. Personalization Pipeline：训练 / 推理切换和分步探索。
5. Personalized Conversation：纯文字、图片含主体与图片不含主体；判断回答证据来源。
6. Experiments：四类任务选择，指标、受控基线比较与结果反馈。
7. Ablation & Generalization：累计训练配置、参考图滑块、token 数量和原始消融曲线指标选择。
8. Failure Cases & Limitations：漏认、误认、幻觉案例切换。
9. Summary：核心机制与理解检查。

## 图像来源与署名

引用图片来自上述作者的 NeurIPS 2024 正式论文及内置附录，仅用于非商业学术教学。原图保留原内容，局部裁切处在页面标注；图像及相关权利归原作者与权利人所有。官方项目页面的 Usage and License Notices 将主体数据用于研究并标为 CC BY-NC 4.0；本教程不打包或重新发布完整数据集。

| 资源 | 论文定位 |
| --- | --- |
| `figure-1.png`、`figure-2.png` | Figure 1，p.1；Figure 2，p.4 |
| `figure-5.png`、`figure5-*.png`、`ablation-*.png` | Figure 5，p.9；完整图及局部曲线 |
| `bo-reference-*.png`、`bo-park.png` | Table 3，p.6；主体参考图与输入图局部 |
| `mam-reference.png`、`mam-desk.png`、`mam-bath.png`、`other-cats.png` | Table 12，p.17；主体与测试图局部 |
| `failure-table.png`、`failure-negative.png`、`failure-positive.png` | Table 15，p.20；失败案例与输入图局部 |

自制流程、主体表示示意和概念对照均标注“教学示意图 / 根据论文内容重绘”；真实案例回答标注中文转述或节选。Figure 5 交互仅定位原曲线横轴，不插值、不生成未报告点值。各实验使用其原始任务和评测协议。

## 贡献者

Jing Yuxi（GitHub：[commoncreate](https://github.com/commoncreate)）。版本与论文元数据由官方导入工具记录于 `paper.json`。
