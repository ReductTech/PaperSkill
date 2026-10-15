# Dark-ISP 交互式 PaperSkill

论文：Jiasheng Guo 等，*Dark-ISP: Enhancing RAW Image Processing for Low-Light Object Detection*，ICCV 2025，pp. 9583–9593。[CVF 官方论文页](https://openaccess.thecvf.com/content/ICCV2025/html/Guo_Dark-ISP_Enhancing_RAW_Image_Processing_for_Low-Light_Object_Detection_ICCV_2025_paper.html)。

这是十章中文交互导读，不是实时运行的目标检测模型。夜间寻猫的光束、色调曲线与余弦向量均为教学示意；第九、十章标出的 mAP 才是论文报告的数据。

## 打开网页

在 Windows 上双击本文件夹中的 `打开网页.cmd`。它会启动本地 Vite 服务并打开 `http://127.0.0.1:5178/`。预览时保持弹出的服务窗口运行；看完可关闭。不要直接双击 `dist/index.html` 或把 JavaScript 粘到 `.html` 文件中。

如果没有 Node.js，先安装 Node.js，然后在本文件夹运行 `npm install`。也可手动运行 `npm run dev -- --host 127.0.0.1 --port 5178 --strictPort`。

## 相比上次作业的针对性改进

| 点评指出的问题 | 本次对应内容 |
| --- | --- |
| 模块名称与设计细节不够具体 | 第三至八章分别拆解 W/B/C、局部与全局注意力、多项式基、Self-Boost 余弦约束和完整结构。 |
| 缺少带条件的定量结果 | 第九章保留 LOD 消融，末章按 LOD、NOD Sony、NOD Nikon、SynCOCO 分开展示指标和对照。 |
| 与主动视觉感知智能体的关联不够直接 | 下方“个人分析”说明感知前端与行动闭环的区别。 |
| 批判性思考不足 | 末章加入 RAW 可用性、跨相机零样本、端侧能耗、伪目标偏差四个可点击问题。 |
| 制作过程描述不足 | 下方记录了实际遇到的资料与实现决策，不虚构实验。 |

## 数据与边界

- 论文表 1：LOD，430 张测试图像、8 类，ResNet-50，VOC-style mAP。Dark-ISP 70.4；默认 Bayer RAW ISP 67.3；FeatEnHancer 67.0。
- 论文表 2：NOD，Sony 321 张、Nikon 400 张测试图像，3 类，COCO-style mAP。Dark-ISP 分别为 31.5、29.9；FeatEnHancer 分别为 30.3、28.8。
- 论文表 3：合成 SynCOCO，COCO-style mAP。Dark-ISP 23.1；FeatEnHancer 22.4。
- 论文表 4：LOD 消融，VOC-style mAP。仅线性 66.6、仅非线性 67.1、两者结合 68.7、再加入 Self-Boost 70.4。
- 不把 LOD 的 VOC-style mAP 与 NOD/SynCOCO 的 COCO-style mAP 直接相减。网页没有声称实现论文的真实检测器。

## 个人分析：与主动视觉感知智能体的关系

Dark-ISP 更像主动视觉系统的“可学习感知前端”：它根据图像内容调节处理，目标是让后续检测更可靠。但是这篇论文没有让智能体主动控制相机曝光、视点或下一步行动，也没有验证闭环决策。因此，不能把它直接称为完整的主动感知智能体。一个可检验的拓展是让智能体在 RAW 处理与下一步曝光/视点之间联合决策，同时考察检测收益、时延与能耗。

我的主要疑问是：Self-Boost 的伪目标来自模型自己的非线性输出，若该输出在极暗、强噪声或新相机上产生系统性偏差，方向一致约束会不会放大错误？后续可以做跨相机零样本测试、不同照度分层测试和伪目标置信度消融。上述是个人推论，不是论文已经验证的结论。

## 制作记录

1. 核对 CVF 官方 PDF 的方法式 (1)–(12)、图 1–3 和表 1–5，特别区分 Bayer RAW 与量化 RAW-RGB。
2. 选择“夜间寻物”贯穿动画，使直觉与论文结构分开呈现，避免把简单示意图冒充网络输出。
3. 发现 LOD 和 NOD/SynCOCO 的 mAP 协议不同，因此把结果交互按数据集拆开。
4. 将上一轮曾出现的“直接打开 HTML 只看到代码”的问题改为本地服务启动方式，并完成 TypeScript 构建和结构检查。

## 技术说明

项目使用 React 18、TypeScript、Vite。章节内容在 `src/data/tutorial.ts`，交互组件在 `src/modules/dark-widget.tsx`。不依赖外部图片、视频或在线字体。构建命令：`npm run build`。
