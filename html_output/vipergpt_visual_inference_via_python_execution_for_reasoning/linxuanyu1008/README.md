# ViperGPT 交互式中文教程

基于 Dídac Surís、Sachit Menon、Carl Vondrick 的 ICCV 2023 论文 *ViperGPT: Visual Inference via Python Execution for Reasoning*。

[论文原文](https://openaccess.thecvf.com/content/ICCV2023/papers/Suris_ViperGPT_Visual_Inference_via_Python_Execution_for_Reasoning_ICCV_2023_paper.pdf)

## 本地运行

```sh
npm install
npm run dev
npm run build
npm run preview
```

## 内容与交互

十章依次介绍松饼计数、程序生成、十种API、感知与Python逻辑、披萨执行、外部知识、视频时间推理、系统架构、上下文与干预、同协议实验比较。共14个内容模块，13个可主动操作；训练边界模块为说明图。

操作会同步改变当前代码行、区域列表、变量或结果。高级教学输入和完整代码默认折叠，窄窗口的架构图支持内部横向滚动。

## 来源与边界

- 所有交互重放预设教学状态，不调用真实Codex、视觉或知识模型，浏览器不执行Python。
- 论文图像用于介绍相应案例，原文位置及裁剪记录见`public/images/sources.json`；逐章证据见`SOURCE_COVERAGE.md`。
- Figure 7横条按原图矢量柱和刻度近似换算，使用≈标识；来源记录见`public/images/intervention-provenance.json`。这些数字不是作者提供的精确数据表，教学开关不重跑评测。
- 距离教学坐标、漏检、OR、反向排序、缺失事件的合成4帧均明确标为教学构造；相对深度不是米数。
- 38条评测记录来自原文表1–4，区分协议与监督／零样本。NExT-QA完整集60.0低于HiTeA63.1，不能把困难子集领先概括成总体第一。论文中的2023结果不代表当前排名。
- 视频仅保留已核对的ViperGPT讲解；播放量为2026-10-08快照。

## 核验记录

使用者于2026-10-12明确确认已对照论文核验、网页信息一致。项目已导入本版本目录，以`review`状态提交；合并与发布由仓库维护者审核。

展示代码的替身语义检查见`tests/semantic-check.py`；历史及本轮自动检查见`VERIFICATION.md`。替身测试不能证明真实模型准确率。

关键页面截图见`docs/screenshots/`：系统架构、干预图和窄窗口漏检反馈。架构与干预截图来自10月8日内容修改完成后的预览；移动截图来自10月12日导入版检查。截图为辅助记录，不能替代实际打开网页操作。
