# Talk2DINO 中文交互教程

制作：尹灿宇（AI辅助）。固定ICCV2025正式版和补充材料，DINOv2系列，不混入后续DINOv3更新。10章25个主要互动模块；桌面端交付。

运行：Node.js20+，npm ci、npm run dev；构建npm run build。仅React/ReactDOM运行时依赖，无CDN、模型权重、在线推理或运行时外部字体。

主要交互：拖动坐标标定、映射接口与参数量、非线性网格形变、空间权重编辑、head选择、双向InfoNCE矩阵、拖放字幕、单参数训练、缓存账本、词表分类、分数插值、背景清理、阈值掩码、架构路径、平滑边界、真实消融、两因素实验和结果协议比较。

所有小向量、损失训练和分割图均为教学构造，非模型推理或论文复现。真实实验使用表号及原始协议；主表八列均值与补充五列均值分开。梯度演示为差分+SGD，不冒称Adam；局部平滑不是PAMR实现。

正式论文：https://openaccess.thecvf.com/content/ICCV2025/papers/Barsellotti_Talking_to_DINO_Bridging_Self-Supervised_Vision_Backbones_with_Language_for_ICCV_2025_paper.pdf

补充材料：https://openaccess.thecvf.com/content/ICCV2025/supplemental/Barsellotti_Talking_to_DINO_ICCV_2025_supplemental.pdf

主要事实见EVIDENCE.md。本地教程完成不代表课程复现题目获批或真实训练已执行。后续投稿paper.json须填写已授权jianlunId并核对远端。

增强版新增：汇聚动画、head切换曲线、损失地形轨迹、二维标注画布、PAMR配对哑铃图。三个过程支持播放、暂停、单步、拖动及重置，默认不自动播放。
