# BLIP：统一视觉语言理解与生成的自举预训练

基于论文《BLIP: Bootstrapping Language-Image Pre-training for Unified Vision-Language Understanding and Generation》的简体中文交互式教程。

论文：<https://arxiv.org/abs/2201.12086>。内容依据用户提供的 2022 年 arXiv v2 PDF。
作者：Junnan Li、Dongxu Li、Caiming Xiong、Steven Hoi（Salesforce Research）。

## 本地运行

```powershell
npm install
npm run dev
```

静态构建：`npm run build`。构建预览：`npm run preview`。

## 教学内容

共 14 页，包含同步动画封面与 5 个章节：

1. 网页文本噪声与 ITC 全局图文对齐。
2. MED 三种工作模式、ITM 细粒度匹配与 LM 自回归生成。
3. CapFilt 核采样、双路文本过滤与新模型预训练。
4. 消融实验、参数共享语境及下游评测。
5. 视频迁移的时序边界与生成噪声修复。

顶部按钮和方向键翻页，左侧目录选页；“讲稿”包含来源定位、实验条件和类比边界。“放映”进入全屏。手机保持幻灯片构图，可双指缩放、拖动查看并复位。

教学相似度、词概率、事实校验和相册数量均是标明的简化演示，浏览器不运行 BLIP 神经网络。实测结果保持论文原值、任务、拆分与单位；演示操作不会产生新的实测性能。

## 内容边界

MED 预训练时共享词嵌入、跨注意力与 FFN，自注意力参数分开；CapFilt 的描述生成器和过滤器则分别微调。两种“共享”语境不能混同。

零样本视频迁移指没有在目标视频任务上训练；论文通过抽帧特征拼接输入，未显式建模时间。生成与过滤都可能产生错误。多轮自举和每图生成多个描述在本文中属于未来方向。

本项目由 paper-skill 生成。自动构建和页面检查不能替代对照原论文的人工内容核验。
