# LensWalk · 中文交互式论文教程

一套可本地运行的 React + TypeScript 论文精读课程。网页中的时间轴、策略操作台与推理模拟器均为**教学示意**，不调用 LensWalk 模型，也不代表论文实验的原始运行日志。

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址。验证构建：`npm run build`；单独检查类型：`npm run typecheck`。

## 资料与核查

- [研究与主张溯源](docs/RESEARCH_AUDIT.md)
- [网页主张—论文位置矩阵](docs/CLAIM_MATRIX.md)
- [本地 QA 记录](docs/QA.md)
- [论文全文 HTML](https://arxiv.org/html/2603.24558)
- [CVPR 开放获取 PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Li_LensWalk_Agentic_Video_Understanding_by_Planning_How_You_See_in_CVPR_2026_paper.pdf)
- [官方代码](https://github.com/likanchuan09171/LensWalk)

论文原图来自作者官方仓库 `assets/intro.png` 与 `assets/method_illustration.png`，仅用于课程中的论文图解读，并在网页标注来源。课程可离线浏览；外部论文和代码链接需要网络。

学习进度保存在浏览器 `localStorage`，可用侧边栏“重新开始”清除。
