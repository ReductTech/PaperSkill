# Learning to Prompt for Continual Learning：中文交互教程

本教程把 L2P（CVPR 2022）的提示池、实例级查询和冻结骨干训练流程做成固定画幅的中文交互式幻灯片。

## 论文与素材

- 论文：**Learning to Prompt for Continual Learning**
- 作者：Zifeng Wang, Zizhao Zhang, Chen-Yu Lee, Han Zhang, Ruoxi Sun, Xiaoqi Ren, Guolong Su, Vincent Perot, Jennifer Dy, Tomas Pfister
- 会议：CVPR 2022
- 论文页面：https://arxiv.org/abs/2112.08654
- 官方代码：https://github.com/google-research/l2p

教程中的 Figure 2、Figure 3 和 Figure 4 数值来自论文公开 LaTeX 源码中的原始矢量图，并转换为本地 PNG。原始论文和图表仅用于教学与学术引用；中文说明、交互和页面设计由本项目制作。

## 内容结构

- 6 章、13 屏教学页（含封面）
- 12 个论文专属交互/证据页面
- 覆盖提示池、实例级查询、提示组合、联合损失、训练流程、主结果、消融、超参数和适用边界
- 封面使用同步的“回放 + 微调”与“提示池 + 实例查询”动画
- 每页都有本地缩略图和演讲者备注

主要教学主线用暗房摄影作为统一类比：相机机身对应冻结骨干，滤镜卡对应提示，滤镜盒对应提示池，当前底片从盒中选择并组合滤镜。类比只帮助建立直觉，不替代论文公式或实测结果。

## 本地运行

```bash
npm install
npm run dev
```

开发服务器默认位于 `http://localhost:5173/`。生产构建：

```bash
npm run build
```

## 页面操作

- 顶部按钮翻页、打开讲稿或进入放映。
- 左侧目录可快速跳到任意页面；窄屏下目录变为抽屉。
- 手机保持 1600×900 固定构图，可双指缩放、放大后拖动，并用缩放按钮复位。
- 封面动画由共享时钟驱动；正文模块需要点击、切换、拖动滑块或查询点。

## 相对模板的改动说明

- `src/data/tutorial.ts`、`outlines.json` 和 `src/modules/registry.tsx` 由 PaperSkill 章节组装器生成。
- 论文内容与视觉交互集中在 `src/modules/l2p-core-anchor.tsx` 和各模块包装文件；没有改写播放器框架。
- 论文专属样式与摄影场景配色位于 `src/styles/paper.css`。
- `public/images/l2p-method.png` 和 `public/images/l2p-selection.png` 是从论文公开 LaTeX 源图转换的原始示意图。
- `public/thumbnails/` 包含由最终源码在 1600×900 下逐页截取的预览图。

## 结果阅读口径

- 平均准确率（Average accuracy）越高越好。
- 遗忘率（Forgetting）越低越好。
- Split CIFAR-100、5-datasets、CORe50 和 Gaussian scheduled CIFAR-100 使用不同协议，不能把不同数据集的数字拼成一条训练曲线。
- 超参数图只展示论文 Figure 4 中已准确转录的 Lp × N 单元格；未展示无法可靠转录的池大小曲线。
