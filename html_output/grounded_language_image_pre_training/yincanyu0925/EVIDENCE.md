# 来源与边界

正式论文PDF SHA-256：`d8fcb3e82ed94c7e2e3dc5f47211d2e2d1e31dc8cc46ff9d49d682fde6f304da`。所有页码为PDF页码。

## 检测改写成区域与提示词对齐

出处：PDF p3–4 §3.1 Eq.1–3。

条件：用语言特征替换分类器权重；仍保留定位损失。

指标：不适用。

区域特征 O∈R^(N×d)，词特征 P∈R^(M×d)，S=OPᵀ∈R^(N×M)。点积不是概率。

## 词级监督与短语聚合

出处：PDF p4 §3.1 与脚注4。

条件：正文实验使用 sigmoid focal；多类 CE 分支不同。

指标：概率均值；不是 logits 均值。

正短语的所有子词作为正匹配，附加 token 为负；推理对短语内 token 概率取平均。

## 双向跨模态深度融合

出处：PDF p4 §3.2 Eq.4–6。

条件：DyHead 与 BERT 实例；投影、残差、多头。

指标：不适用。

跨模态注意力在后部编码层反复交换上下文，再做各模态更新；不是仅末端点积。

## 预训练与伪标注

出处：PDF p5 §3.3–4 与 p6 Table1。

条件：teacher 先用人工框数据；student 使用人工+伪框。

指标：数据配置非独立控制变量。

GLIP-T(A)无融合仅O365；B增加融合；C增加GoldG；T增加Cap4M；L换骨干及扩大数据。

## COCO 零样本比较

出处：PDF p6 Table2。

条件：COCO2017 val，zero-shot domain transfer；GLIP预训练排除COCO图片。

指标：box AP，越高越好。

A/B/C/T(Cap4M)/L：42.9/44.9/46.7/46.3/49.8；A→B为+2.0，C→T并未提升。

## LVIS 消融比较

出处：PDF p6 Table3。

条件：LVIS v1.0 full val，zero-shot transfer。

指标：box AP，越高越好。

A/B/C/T/L：12.3/11.3/16.5/17.2/26.9；深度融合单独并非在所有数据集均提升。

## 稀有类别收益

出处：PDF p6 Table3 与 p7 Table5。

条件：LVIS MiniVal，Swin-T；不同数据组合。

指标：APr，越高越好。

B/C/T：13.5/17.7/20.8；FourODs-only：15.0；不可把这些数写成 full-val AP。

## 微调协议区别

出处：PDF p6 Table2 与 §4.1。

条件：常规L排除COCO预训练：val60.8/test-dev61.0；特殊L用GoldG+及COCO。

指标：box AP，越高越好。

61.5只报告特殊配置test-dev；GoldG+含部分val图，故不报告该配置val。

## Flickr30K定位迁移

出处：PDF p6 Table4 与 §4.3。

条件：any-box protocol，Flickr30K已在GoldG中；不能称该数据集零样本。

指标：Test R@1，越高越好。

MDETR-ENB5 84.3，GLIP-T O365+GoldG 85.5，加Cap4M 85.7，L 87.1。

## 跨域数据效率

出处：PDF p7–8 §5.1 Fig.3。

条件：13个ODinW数据集平均；X-shot每类至少X例。

指标：平均AP；不虚构图中精确数字。

1-shot GLIP-L与全监督DyHead-T相当是跨13集聚合观察，不是每一集保证。

## 提示适配

出处：PDF p8 §5.2 Fig.4–5。

条件：Aquarium stingray类别；手动描述和学习P0是不同策略。

指标：stingray AP50 4.6→9.7；不与COCO AP混比。

manual prompt不更新权重；prompt tuning用标注优化P0并冻结grounding模型；full tuning更新模型。

## 零样本语义边界

出处：PDF p3 §2 与 p6 §4.1。

条件：论文不主动排除所有预训练类别；O365覆盖COCO80类。

指标：不适用。

零样本跨数据集迁移不等于从未见过类别；网页为教学计算，未运行GLIP权重。

## 新增互动的证据边界

- 第 6.2 节：IoU = 交集面积 / 并集面积；参考框 160×140，预测框可平移、等比例缩放。重合时为 1，中心对齐且边长放大两倍时为 0.25。所有坐标及 0.5 练习门槛均为人工设定，不能代替 COCO AP。
- 第 7.2 节：教师伪标注的背景来自 §3.3。四候选分数 [0.92, 0.78, 0.96, 0.42]、真值 [1, 1, 0, 1] 为人工构造，用来演示高分错误与低分真目标；人工审校不是论文实际数据处理流程。
- 第 10.2 节：四题分别引用表 2 的 49.8 AP、表 2 的特殊 61.5 test-dev 配置、表 4 与 GoldG 数据说明、表 1/2 的 Cap4M 指标变化。计分仅为阅读自检，不是模型实验。
