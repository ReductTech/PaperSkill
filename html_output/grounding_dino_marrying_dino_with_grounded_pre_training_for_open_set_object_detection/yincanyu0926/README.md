# Grounding DINO：让文字引导目标检测

《Grounding DINO: Marrying DINO with Grounded Pre-Training for Open-Set Object Detection》（ECCV 2024）的简体中文交互教程。制作：尹灿宇，AI 辅助。

## 使用

Node.js 20+：执行 `npm ci`、`npm run dev`；生产构建为 `npm run build`。项目可按官方 PaperSkill 流程导入。本地另提供独立的单文件 HTML 离线预览。

## 阅读路线

10 章、16 个主动交互，围绕文字指定目标、图文特征增强、Eq.1 语言引导查询、混合查询的位置/内容区别、跨模态解码、子句级掩码、匹配与损失、三阶段结构和有条件的实验结论展开。

桌面端是当前验收范围。画出的鸟、边框、小矩阵、匹配成本和解码过程均为原创教学构造；未下载权重，也未运行 Grounding DINO 训练或推理。表格里的数值来自 ECCV 2024 正式论文，条件与页码详见 `EVIDENCE.md`。

## 关键边界

- 论文将零样本界定为训练时不使用被测数据集的训练划分；这不保证类别概念从未在其他数据中出现。
- Eq.1 从图像特征里选索引，初始化查询的位置锚框；混合查询的内容部分可学习。
- 52.5 是 COCO 2017val 零样本 box AP（L 配置）；60.7‡ 使用 COCO 训练数据，不是零样本。
- LVIS MiniVal 总 AP 变好不保证稀有类 APr 变好；加入 RefC 也不保证跨数据集指标同涨。
- [正式论文](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/06319.pdf) · [作者代码](https://github.com/IDEA-Research/GroundingDINO)

## 生成与验证

以 PaperSkill 1.4.0 官方模板生成项目，保留 React + TypeScript 框架文件；论文内容仅写入 `src/data/tutorial.ts`、`src/modules/` 和 `src/styles/paper.css`。已运行来源缓存校验、结构校验、生产构建及桌面离线浏览器交互检查。该本地交付不代表 PR、部署或课程网址提交已完成。

## 2026-09-26 交互与学术性修订

新增跨注意力数值实验、拖框 IoU 几何实验和 Table 7 消融对照；重写短语组合、可编辑点积矩阵、可绘制注意力掩码、一对一全局匹配。原重复类比画面改为按章节展示候选筛选、信息交换、块掩码、匹配连线与阶段结构。

公式、符号、计算反馈和论文节号就近呈现。明确教学温度、构造矩阵、非模型推理、IoU/GIoU/AP 的区别及单项消融适用范围。新版桌面离线 55 项检查通过，见 `04_过程记录/revision-checks.json`（任务根目录）；保留初版检查作为历史记录。尚未投稿。

补充修订：混合查询改为位置锚框与内容向量双视图；第 7 章新增损失分项实验与可展开的训练目标说明。构造值与论文机制分开标注。
