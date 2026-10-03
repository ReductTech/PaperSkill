# ReAct：推理与行动

基于 **ReAct: Synergizing Reasoning and Acting in Language Models** 的中文交互式教程。十章连续阅读，通过 Canvas 动画与交互讲解思考、行动、环境观察、工具使用、自一致性、实验结果及局限。

- 原文：https://arxiv.org/abs/2210.03629
- 核对版本：https://arxiv.org/html/2210.03629v3
- 贡献者：fangyuxin（GitHub：yx-1021）

## 运行

使用 Node.js 20 或更高版本：

```bash
npm ci
npm run dev
npm run build
npm run preview
```

提交的是完整 React + TypeScript + Vite 项目。依赖目录、构建输出及本机启动器不纳入版本控制。所有站内静态资源通过相对路径或 Vite 的 base 设置加载。

## 内容与交互

- 封面和第一章用取放杯子的生活场景展示内部推理与环境交互的区别。
- 知识查询示例围绕《小王子》作者及出生地展开，可逐步观察查询、修正和回答。
- 公式符号可点击解释；工具面板区分 search、lookup 与 finish。
- 少样本提示与轨迹微调分别展示上下文变化和参数更新。
- 自一致性展示不同推理路径的答案聚合、共同偏差、21 次采样的回退阈值及组合方法的结果。
- 四种任务的实验指标可切换；失败类型和输入长度、示例覆盖等局限以动画呈现。

教学场景与动画不是实验录像，也不表示真实模型运行耗时。微调结果限定于 HotpotQA；ALFWorld 的平均结果、最佳结果及不同解码设置分别说明。动画中的格子数不代表模型实际上下文容量。

## 素材与来源

正文中的场景、流程、图表由项目代码绘制。未打包论文 PDF、正文截图、实验原图或视频文件。

延伸视频保留对应视频的原始封面，用于识别和链接视频；封面及视频的权利归原发布者所有，不属于本项目的原创素材，也不授予额外复用许可：

- `public/video-covers/BV16u411b7bq.jpg`：https://www.bilibili.com/video/BV16u411b7bq/
- `public/video-covers/BV1WC411b7VM.jpg`：https://www.bilibili.com/video/BV1WC411b7VM/

其他参考：

- 自一致性：https://arxiv.org/abs/2203.11171
- 《小王子》官方介绍：https://www.lepetitprince.com/en/the-book/

## 核验说明

事实、公式、设置和结果对照 ReAct 原文的第 2、3、4、6 节、表 1/3/4 及附录 B。数据图保留比较口径与结论边界；错误分析不把抽样中的零幻觉解释为普遍可靠。

提交前运行全源码语法门禁、仓库及 PR 范围校验、索引生成检查、单篇构建和浏览器交互检查。审阅截图存放于 `public/review/`，只用于 PR 说明，不作为正文插图。