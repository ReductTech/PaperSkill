# InstaFlow 中文交互教程

基于 Xingchao Liu、Xiwen Zhang、Jianzhu Ma、Jian Peng、Qiang Liu 的 ICLR 2024 论文 *InstaFlow: One Step is Enough for High-Quality Diffusion-based Text-to-Image Generation*，核对版本为 [arXiv:2309.06380v2](https://arxiv.org/abs/2309.06380v2)（2024-03-23）。

## 本地运行

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 18476
npm run build
```

项目包含10章、11个主动交互模块，覆盖重流、耦合、条件引导、一步蒸馏、网络结构、训练成本和分协议结果。模块的原文定位写在章节中。摄影取景类比、配对点、速度向量和潜变量示意均为教学绘制，不是真实模型输出；本教程不执行图像模型推理。

## 内容复核边界

- 区分SD1.4初步实验和SD1.5最终实验；COCO 2017-5k与COCO 2014-30k分别比较。
- 摘要的23.3与主表2(a)的23.4不一致，教程采用主表23.4并说明差异。
- 计时条件为作者的A100、batch=1，包含文本编码和图像解码、排除NSFW过滤；SDXL Refiner的额外处理不包含在0.09秒中。
- 199.2 A100 GPU天是0.9B模型的增量训练开销，不包括继承的Stable Diffusion预训练。
- 重流在理想条件下保持终端分布，改变逐点耦合；不保证有限训练下每条轨迹严格直、全部中间边缘不变或求得最优传输。
- 堆叠网络的两个U-Net不是两次扩散采样；更多重流并非对所有结构都更好。

框架沿用PaperSkill React+TypeScript模板；论文内容和交互位于src/data和src/modules。窄屏沿用固定1600布局缩放。提交源码时不包含node_modules、dist、原论文PDF和临时文件。
