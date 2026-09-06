# Transcoders for Investigating Deception in Language Models

论文交互式中文教程，围绕“如何定位并干预语言模型内部的欺骗相关信号”组织为 10 个横向讲解页面。

## 论文来源

- 论文：*Transcoders for Investigating Deception in Language Models*
- 作者：Darius Lim、Nathan Leow、Xin Wei Chia
- 链接：https://arxiv.org/abs/2607.14791
- 本项目没有使用论文插图或第三方图片；页面图示均由 React、CSS 与内联图形绘制。

## 主要人工修改

- 将初版的纵向长页面重构为适合 4 分钟现场演示的横向 10 页故事线，从欺骗任务依次推进到 Transcoder、Feature、归因图、Steering 与最终电路结论。
- 重写 Transcoder 与 Feature 的教学表达，用输入检测方向、激活强度和输出写入方向解释一个 Feature 如何参与计算。
- 重做归因路径交互：用户选择种子路径并逐步点亮相连节点，页面只显示当前路径对应的节点和连线。
- 将候选筛选、正负向 Steering、边频率阈值和核心 Feature 对比改造成“改变变量后立即看到机制或结果变化”的有效交互。
- 重构结论页，把 Feature 发现、电路定位、干预验证和 AI 安全价值串成完整证据链。

## 核心交互

- 第 1 页切换 D / ND 回答，理解论文对“隐藏密钥”和“披露密钥”的标签定义。
- 第 2 页切换 MLP / Transcoder，并调节 Feature 激活，观察检测、激活与写入过程。
- 第 3 页选择不同种子路径，逐步追踪归因图中的候选 Feature。
- 第 4 至 9 页操作 Steering 方向、候选组合、边频率阈值和 Feature 选择，比较对应实验结果。
- 第 10 页按阶段回放从内部信号发现到安全监测与干预的完整路线。

## 本地运行

```bash
npm install
npm run dev
npm run build
```

项目为完整的 React + TypeScript + Vite 工程，正式提交时不包含 `node_modules/` 或 `dist/`。
