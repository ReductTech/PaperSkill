# ProxyCLIP 证据和边界

正式版：https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/08490.pdf

补充：https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/08490-supp.pdf

- E1 CLIP 图像级语义强，但密集预测的局部一致性不足；VFM 对应关系用于改进局部聚合。定位：p4–6 §3.1 Fig1–2。条件：论文动机与定性分析，不是所有 VFM 都优于所有 CLIP 特征。

- E2 两个冻结图像编码器；VFM 特征 x 提供代理权重，CLIP 最后一层的 v 提供被聚合的语义。定位：p6–8 §3.2 Fig3 Eq4–5。条件：不是拼接两个特征，不是把 DINO 特征直接当 CLIP 文本空间。

- E3 x 先做逐行 L2 归一化；S=xxᵀ；代理权重矩阵尺寸 L×L。定位：p7 Eq4–5。条件：L 是对齐后局部 token 数；后续去除全局 class token。

- E4 A=γ(S−βμ)，μ 为全部 L² 个相似度的均值；A<0 的位置加 −∞，再逐行 softmax。定位：p8 Eq6–8。条件：包括对角线；先对齐 Lv=Lx。不是逐行标准差归一化；不是负数改成0后照常softmax。

- E5 默认 β=1.2，γ=3；β 控制筛选，γ 控制保留集合内的尖锐度。定位：p8 §3.2；补充p1 §B。条件：γ>0时支持集阈值为S≥βμ；单独统一平移在无掩码softmax中抵消，为公式推论。

- E6 对 CLIP 的 v 空间插值，使其分辨率与 VFM 的 x 一致；PAM 输出接原投影并进入对齐的图文空间。定位：p7–8 Eq5 §Different resolution。条件：不能沿通道硬拼；插值不等于恢复真实缺失细节。

- E7 文本编码后与局部图像表征取余弦，按最相似标签分类，再恢复空间分辨率。定位：p8 §Open-vocabulary segmentation。条件：§3.2单模板例子；§4.1评测实际用ImageNet标准提示集合，不混成单prompt评测。

- E8 验证集直接评估，不重训练、不微调、不后处理；短边336或448，滑窗336×336、步长112。定位：p9 §4.1。条件：PASCAL/COCO短边336，Cityscapes/ADE20K短边448；training-free不等于预训练免费。

- E9 Table1 Proxy B/16、L/14、H/14 平均 mIoU 分别42.3、43.0、44.4；CLIP-DINOiser40.3。定位：p10 Table1。条件：八数据集平均百分点；B/L为CLIP，H为OpenCLIP；均配DINO-B/8；不能误记L为42.9。

- E10 VOC20：SCLIP B/16 80.4、Proxy B/16 80.3；VOC：Proxy B/16 61.3、L/14 60.6。定位：p10 Table1。条件：反例：平均提升不代表每个数据集单调提升；不同主干比较不是纯尺寸因果实验。

- E11 Table2 B/16搭配MAE36.7、SAM40.8、SD41.8、DINOv2 41.1、DINO-B/16 41.1。定位：p12 Table2。条件：所列平均mIoU；VFM patch分别16/16/UNet/14/16，不是等算力比较。

- E12 Table3固定CLIP-B/16，DINO S/16=40.9、S/8=41.7、B/16=41.1、B/8=42.3。定位：p13 Table3。条件：更小patch平均更高；S/8 VOC20 79.6反低于S/16 79.8。

- E13 Table4 不归一化不mask25.0，只归一化29.5，两者都用42.3。定位：p14 Table4。条件：固定CLIP-B/16+DINO-B/8，八数据集平均；mask-only未在该表报告。

- E14 补充效率：B/16代理52.9 IPS、3640MiB、81.1GFLOPs；B/8代理26.9、3926、253.3。定位：补充p2 §C Table1。条件：CLIP-B/16、RTX3090、batch1、336²、fp16；额外编码器带来成本，不冒充端到端大图延迟。

- E15 补充固定阈值0/0.2/0.4/0.6/0.8的最佳值因VFM变化。定位：补充p3 §D Table2。条件：COCOStuff；自适应并非逐行都胜过最佳手调阈值，例如SAM25.0<25.2。

- E16 补充PAM使用CLIP q-k均值26.1，q-q或k-k38.2，Proxy42.3。定位：补充p3 §E Table3。条件：此处PAM的q-k不是原始CLIP最后残差块完整输出。

- E17 补充ADE847/PC459：Proxy11.1/9.9，CLIP-DINOiser7.1/8.4，SCLIP4.9/6.3。定位：补充p4 §F Table4。条件：类别规模847/459；不得与主表ADE20K混合平均；有监督方法训练条件不同。

- E18 IoU=TP/(TP+FP+FN)，mIoU按有效类别平均。定位：p9 §4.1 使用mIoU；定义为标准指标。条件：教学网格自定义背景计入与空并集排除策略，不冒称实际数据集评测器。
