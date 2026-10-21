# LLaVA-Plus 交互式教程

对应文章：**LLaVA-Plus: Learning to Use Tools for Creating Multimodal Agents**。

- 公开链接：https://arxiv.org/abs/2311.05437
- 核对版本与方法正文：https://arxiv.org/html/2311.05437v1
- 公开署名：fangyuxin（GitHub: yx-1021）

## 运行

需要 Node.js 20 或以上版本。

```sh
npm ci
npm run dev
npm run build
npm run preview
```

项目使用 React、TypeScript 和 Vite，资源采用相对构建基址，支持教程版本子目录部署。每章为连续页面，目录与下一章按钮负责章节切换。

## 内容与交互

十章分别讲解工具能力、空间提示、视觉复核、统一输出格式、技能选择、完整对话、训练监督、服务架构、技能组合与评测边界。动画由 SVG 与 React 状态驱动；可切换任务、拖动分割点、选择对话位置、调整词元概率、暂停重播和定位动画进度。

手绘场景、检测框、区域掩码与概率均用于教学示意，网页不运行真实 LLaVA-Plus 或专家模型。事实、符号和指标按对应版本的正文及附录核对；示意动作不代表真实算法逐帧内部过程或性能保证。

## 素材来源与范围

- 场景图形和交互：项目内以 SVG/CSS 编写的教学图示；没有收录文章 PDF、文章原图、外部字体或生成照片。
- 框架：基于 PaperSkill 的 React 教程模板，并按本次教学需求调整连续阅读布局与交互。
- 延伸视频：[自定义多模态大模型 LLaVA——LLaVA系列](https://www.bilibili.com/video/BV1GS411P74b/)。保留 Bilibili 官方 API 提供的原版封面，通过原站 HTTPS 地址加载，不将第三方封面文件再分发到仓库。封面和视频的权利归原作者或相应权利人。
- 截图（如有）：本教程自身页面的运行截图，用于 PR 审阅，不参与动画运行。

## 内容边界

方法部分对应第2节与技能表；误检示例对应附录C中的负类别纠错机制；训练只监督助手目标位置，用户与工具返回仍作为条件。All Tools/Fly 保留各自配置含义，历史评测不表述为当前排行榜，定性组合案例不视为普遍成功保证。
