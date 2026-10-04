# Visual ChatGPT 中文交互教程

对应工作：Visual ChatGPT: Talking, Drawing and Editing with Visual Foundation Models。

原文：https://arxiv.org/abs/2303.04671

## 内容与交互

十章连续阅读，包含已有模型协作、提示管理的四类职责、视觉工具选择、多步图像处理、多轮对话、提示约束对照与五类局限。保留核心机制讲解，正式公式、完整实验配置与文件命名细节未展开。

封面支持自动播放与分步查看；第 1、6、8 章直接呈现图像观察、深度条件生成、颜色和风格变化。目录与章节按钮支持跳转，离屏画布暂停，遵循系统减少动态效果设置。

## 本地运行

```sh
npm ci
npm run dev
npm run build
```

页面使用固定 1600 像素视口，手机端按整体缩放方式显示，可上下滚动阅读。

## 素材来源

正文视觉内容由 Canvas 代码绘制，未复制原文插图、未打包外部字体或视频文件。

延伸讲解：https://www.bilibili.com/video/BV1h94y157jd

视频原封面直接引用该视频的 Bilibili 图片 CDN：
https://i1.hdslb.com/bfs/archive/e865490b24d9de302dd43705e5939d4f33258f67.jpg

封面用于链接到原视频，权利归原作者及相关权利人；本项目不打包或另行授权该封面。加载依赖外部图片服务。

`docs/review/` 中的截图由本教程实际页面生成，供代码审阅使用，不在正文中展示。
