# CLIP：从图文匹配到零样本分类 交互式教程

基于论文 *Learning Transferable Visual Models From Natural Language Supervision*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

这份导读从“类别文字为什么能够替代固定分类头”展开，包含十章、二十八个交互模块。前置知识服务于后面的训练目标、结构和实验分析；各章保留了计算过程与符号解释。主线阅读约60分钟，全部推导与操作约100–140分钟。

内容修订记录见 [REVIEW.md](./REVIEW.md)，技术验证见 [VALIDATION.md](./VALIDATION.md)。

## 阅读路线

|阶段|章节|建议时间|读完应能回答|
|---|---|---|---|
|前置知识|1–3：模型、参数、任务、向量、配对|25–35分钟|编码器做什么？为什么用图片与文字共同学习？|
|方法与推理|4–6：softmax、温度、提示词、零样本|25–35分钟|为什么文字向量可以当分类依据？温度与候选集合有什么影响？|
|训练与边界|7–9：损失、梯度、ResNet/ViT、注意力、局限|35–50分钟|训练怎样更新参数？两种骨干如何提取信息？CLIP不能直接做什么？|
|论文理解|10：评测协议、实验、证据、复述|15–20分钟|实验支持哪些结论？条件和局限是什么？|

只有一小时可先走：1.1→1.2→2.1/2.2→3.1→4.2/4.3→6.1→7.1→8.1/8.2→10.1/10.3。每段先读定义、做一次操作、说出一个结论；其余模块可作为第二遍补充。没有微积分基础也可以先跳过复杂公式，跟着具体数字理解。

## 来源与演示边界

- 原论文：[ICML 2021 PDF](https://proceedings.mlr.press/v139/radford21a/radford21a.pdf)，[论文信息](https://proceedings.mlr.press/v139/radford21a.html)。实验图表与正文节号默认按该16页会议版。
- 第五章提示词与模板集成另引 [arXiv 完整版§3.1.4，第7–8页](https://arxiv.org/pdf/2103.00020#page=7)；两版图号与节号不同，不混用。
- 作者：Alec Radford、Jong Wook Kim、Chris Hallacy、Aditya Ramesh、Gabriel Goh、Sandhini Agarwal、Girish Sastry、Amanda Askell、Pamela Mishkin、Jack Clark、Gretchen Krueger、Ilya Sutskever。
- 网页中的二维向量、相似度、提示词方向、训练矩阵是教学设定；未加载 CLIP 权重，不是模型推理或完整训练。
- 第十章表1、图4与图7的数字是原论文报告值，页面标注模型、基线、数据集及指标，动画只是展示。图4展示差值，不是假造两方绝对准确率。
- 第八章的结构背景另参考 [ResNet](https://arxiv.org/abs/1512.03385)、[ViT](https://arxiv.org/abs/2010.11929)、[Attention Is All You Need](https://arxiv.org/abs/1706.03762)；与 CLIP 本身的改动和贡献分开说明。
- 原论文不是 GLIP；CLIP 是 Contrastive Language–Image Pre-training。原始 CLIP 用于图文匹配及相应分类/检索，不直接生成文字回答或目标框。
- 延伸视频为[跟李沐学AI的原始 CLIP 精读](https://www.bilibili.com/video/BV1SL4y1s7LQ)，网页自身内容可离线阅读，视频及外链需要联网。

## 方法讨论与阅读记录

`public/images/preview-desktop.png` 与 `public/images/preview-mobile.png` 是本教程的桌面、手机预览截图，供投稿审核使用。截图中的图示由本项目 Canvas 组件绘制；未复制论文原图。

第十章讨论分类权重如何由文字生成、历史成绩的归因限制，以及计数和空间关系上仍缺少的证据；其中提出的后续实验尚未执行。学习复盘应另外记录实际阅读范围、独立理解、完成的工作和待解决的问题。网页的制作与自动检查记录不等于阅读者已经完成这些学习活动。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
