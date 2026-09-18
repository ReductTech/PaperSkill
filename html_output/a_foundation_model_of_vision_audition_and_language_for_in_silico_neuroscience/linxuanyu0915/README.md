# TRIBE v2 交互式论文教程

基于论文 A foundation model of vision, audition, and language for in-silico neuroscience 的简体中文交互教程。

## 论文来源

- 作者：Stéphane d’Ascoli、Jérémy Rapin、Yohann Benchetrit、Teon Brooks、Katelyn Begany、Joséphine Raugel、Hubert Banville、Jean-Rémi King。
- 论文：[arXiv:2605.04326v1](https://arxiv.org/abs/2605.04326v1)。
- 本教程为学习者制作的解释性网页；交互动画是教学示意，不执行真实 TRIBE 模型推理。

## 本地运行

```sh
npm install
npm run dev
npm run build
```

## 内容与交互

封面、十章教程及延伸视频。包含模态特征对齐、长时间上下文、血流延迟配对、模态丢弃、被试适配和完整模型流程。演示支持播放、暂停、单步和进度调节。

## 目录

- `src/data/tutorial.ts`：章节、公式、说明和小结。
- `src/modules/`：交互组件与播放逻辑。
- `src/components/`：通用页面组件。
- `src/styles/`：网页样式和响应式布局。
- `public/images/`：论文图表节选和带标注的图表。

## 素材来源

论文图表节选来自上述论文，版权属于相应权利人；截取、排版和标注用于对应章节的论文分析。贡献者 linxuanyu 已确认具有公开使用这些图表的依据；此确认不改变原始素材的版权归属，也不将 arXiv 分发许可解释为通用再授权。

Bilibili 条目提供背景知识链接，不等同于本论文的作者讲解。界面流程动画为教学示意，不能作为实验结果引用。

## 验证

TypeScript/Vite 构建及仓库单篇构建通过。论文图片使用相对路径，兼容本地预览和发布子目录。浏览器检查覆盖桌面与手机共 12 页、14 项主要交互；论文内容与图片公开使用依据已由贡献者确认。
