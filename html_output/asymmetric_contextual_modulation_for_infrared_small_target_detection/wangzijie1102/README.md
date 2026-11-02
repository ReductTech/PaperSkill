# ACM：红外小目标检测交互式论文导读

论文：**Asymmetric Contextual Modulation for Infrared Small Target Detection**，Yimian Dai、Yiquan Wu、Fei Zhou、Kobus Barnard，WACV 2021。

导读整理：Zijie Wang（GitHub：mathlover0728）。

## 阅读方式

6 个章节从小目标与背景的矛盾出发，依次解释下采样、全局与逐点通道调制、FPN / ResNet 宿主配置、消融、IoU/nIoU 及方法边界。每章包含一个可操作的生活类比和两个主题交互。目录、上一章/下一章按钮与键盘方向键均可用于导航；手机使用顶部目录。

网页中的夜间巡检场景、特征热力图、门控权重及像素计数是教学示意，不是模型推理结果。论文实验表格标明表号、指标与设置；示意与论文测量值分开呈现。本项目只构建论文导读，没有运行检测模型，也不代表完成了模型复现。

## 本地运行

需要 Node.js 20 或更新版本。

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run build
npm run preview -- --host 127.0.0.1
```

如需单文件离线版，先构建，再运行 `npm run export:html`。生成的 `打开导读.html` 是本地阅读产物，不随投稿源码入库。

## 证据与实现边界

- [CVF 正式论文主页](https://openaccess.thecvf.com/content/WACV2021/html/Dai_Asymmetric_Contextual_Modulation_for_Infrared_Small_Target_Detection_WACV_2021_paper.html)
- [CVF 正式论文 PDF](https://openaccess.thecvf.com/content/WACV2021/papers/Dai_Asymmetric_Contextual_Modulation_for_Infrared_Small_Target_Detection_WACV_2021_paper.pdf)
- [arXiv 论文](https://arxiv.org/abs/2009.14530)
- [作者开源仓库](https://github.com/YimianDai/open-acm)

数值以正式论文表格为准。下载到的代码版本及其默认配置未必与论文实验完全一致，应分别记录；网页没有将源码阅读当作运行验证。ACM 并不在每个消融配置中均优于所有对照，结论需结合网络宿主、缩减率、通道宽度、指标和数据集阅读。

页面基于 React、TypeScript 和 Vite。交互为浏览器端确定性教学演示，包含六组 SVG 类比。导读结构和排版沿用此前的响应式章节阅读方式，并对小屏布局作独立适配。
