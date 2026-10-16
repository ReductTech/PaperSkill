# PersonaVLM: Long-Term Personalized Multimodal LLMs

CVPR 2026 · 9 章简体中文交互教程 · 6 类教学交互。

## 运行

- 安装依赖：`npm ci`
- 开发预览：`npm run dev`
- TypeScript 与生产构建：`npm run build`
- 生产预览：`npm run preview`

请通过 HTTP 预览，不要直接通过 file:// 打开源码入口。

## 论文与素材来源

- [正式论文](https://openaccess.thecvf.com/content/CVPR2026/papers/Nie_PersonaVLM_Long-Term_Personalized_Multimodal_LLMs_CVPR_2026_paper.pdf)
- [arXiv](https://arxiv.org/abs/2604.13074)
- [Supplementary](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Nie_PersonaVLM_Long-Term_Personalized_CVPR_2026_supplemental.pdf)
- [官方项目页](https://personavlm.github.io/)
- [官方代码](https://github.com/MiG-NJU/PersonaVLM)

作者：Chang Nie、Chaoyou Fu、Yifan Zhang、Haihua Yang、Caifeng Shan。

public/images/fig1.png、fig2.png、fig6.png 分别为正式论文 Fig.1、Fig.2、Fig.6 的原图裁剪，仅用于带来源标注的论文教学和评论；著作权归原作者，不主张素材所有权。其余图示为自制教学图。教学示意与原论文图、原表实验数字在网页中明确区分。

## 内容

保留已核验的九章结构，涵盖问题定义、资料组织、人格状态更新、带时间条件的并行检索、训练、推理、实验、消融与局限。六类主要交互：conditions、memory-map、persona-timeline、process、results、ablation。

机制轨迹为“教学示意”，不运行真实模型。M/S 分别为正式论文与 supplementary 的 PDF 页序号。源码不依赖外部 CDN 或在线字体。

公开贡献者：Jing Yuxi（GitHub: commoncreate）。
