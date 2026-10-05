# LoRA：大型语言模型的低秩适配

基于 Hu 等人的 [LoRA: Low-Rank Adaptation of Large Language Models（arXiv:2106.09685v2）](https://arxiv.org/abs/2106.09685v2) 制作的简体中文交互教程。项目使用 React、TypeScript 和 Vite，包含封面与 10 章。

## 本地运行

```bash
npm ci
npm run dev
npm run build
npm run preview
```

项目源码在 `src/`，自制交互图使用 Canvas 绘制。网页中的论文实验数字标有表号；单矩阵参数算例和摄影类比是教学示意，不代表论文实验结果。

论文来源：[固定 v2 版本](https://arxiv.org/abs/2106.09685v2)；实现参考：[作者公开代码](https://github.com/microsoft/LoRA)。项目不打包论文 PDF 或原论文图片。

若导入 PaperSkill 官方仓库，应以导入后目录中的 `paper.json`、依赖锁文件和最终源码运行官方校验；不要提交 `node_modules/`、`dist/`、工作笔记或本地资料。
