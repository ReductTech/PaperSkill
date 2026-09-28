# 事实证据与条件

- T1 将CLIP文本映射到DINOv2 patch空间；推理不需要CLIP图像编码器。定位：p3–4 §3 Eq1–3。边界：区别于ProxyCLIP的代理注意力；不是特征直接拼接。

- T2 ψ(t)=Wbᵀ tanh(Waᵀt+ba)+bb；Wa为Dt×Dv，Wb为Dv×Dv。定位：p4 Eq3。边界：仅学习映射，视觉和文本骨干冻结；列向量记号。

- T3 最后层CLS到patch的每个head产生注意力图；空间softmax后对v加权平均。定位：p4 Eq4–5。边界：softmax沿空间；得到每头一个Dv维向量，而非每头一个类别。

- T4 训练对配对文本选择余弦最高的head，得到该图的ṽ。定位：p4 Eq6。边界：本教程按Eq6先为每个正配对选ṽ，再构造批次矩阵；max不是注意力图逐像素取max。

- T5 损失是两个方向的InfoNCE均值，各含1/(2B)；正对角、batch内负样本。定位：p4 Training Procedure。边界：论文所印公式未写温度，本教程不为原式添加虚构超参数；B=1无批内负样本。

- T6 训练为COCO Captions2014约80k图，Adam，batch128，lr1e-4，100epochs。定位：p5 §4.1。边界：不使用密集分割标签；weakly-supervised不等于training-free。

- T7 推理用patch与ψ(tj)余弦，先上采样每类相似度再argmax。定位：p3 Eq1–2; p4 Inference。边界：空间和语义维度均须匹配；同维不保证可比较。

- T8 背景清理：R每类在head间softmax；按R加权attention图，再空间softmax与线性缩放。定位：p5 Eq7–8 Fig3。边界：F缩放到所有类所有位置的S全局min/max；行索引解释为类j、列为head i。

- T9 最终分数=λS+(1−λ)F；所有类分数低于阈值才作背景。定位：p5 Eq9; §4.1。边界：λ=5/6，阈值0.55；背景清理按报告仅用于VOC和COCO Objects，不在Context用。

- T10 PAMR是可选像素自适应后处理，报告用10次迭代。定位：p5 §4.1; p8 Table4。边界：与背景清理是两个机制；教学一维平滑不是PAMR复现。

- T11 主表Base无PAMR均值43.8、有PAMR46.3；Large42.8/46.1。定位：p6 Table1。边界：八列验证集平均，B/L为DINOv2含register，CLIP文本均B/16；不能声称Large必更好。

- T12 Table3 text-only非线性[87.1,39.8,28.1,36.6,21.1]，线性[85.1,37.9,26.7,35.6,20.1]。定位：p7 Table3。边界：五个无背景数据集，DINOv2-Base；非任意MLP参数都胜线性。

- T13 Table3标准平均在V20为89.6，高于max选择的87.1；其他四列较低。定位：p7 Table3。边界：不要写成选最佳头在每个数据集都优于平均。

- T14 Table2 Base无register V20=74.2，有=87.1；Small在C59无register38.3高于有35.3。定位：p7 Table2。边界：register作用依主干规模和数据集；注意力伪影不等于所有高范数token都错。

- T15 背景清理无PAMR使V21从59.9到61.5、Object37.1到41.0；加PAMR为65.8/45.1。定位：p8 Table4。边界：四格完整2×2实验；与PAMR叠加不应假定严格可加。

- T16 主评测短边448，滑窗步长224，验证集mIoU；不得预先访问目标数据。定位：p5–6 §4.1。边界：补充Table7另有336协议且只有五列均值，不能混入八列平均。

- T17 补充Table6训练CLIP最后层V20=77.9、冻结87.1；句级文本优于该表词token方案。定位：补充p2 Table6。边界：不推广为微调永远有害；不要将CLIP句级向量误作逐词定位监督。

- T18 补充Table7 Base336有PAMR五集44.4，448为44.3；无PAMR42.6/42.5。定位：补充p3 Table7。边界：五列协议，不是主表八列的46.3；按表读值，不将文中总体趋势写成每格单调。