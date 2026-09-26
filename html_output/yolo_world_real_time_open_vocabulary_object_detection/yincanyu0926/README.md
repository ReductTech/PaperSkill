# YOLO-World 中文交互教程

制作：尹灿宇，AI辅助。基于 CVPR2024 正式论文，10章18个主动模块。围绕离线词表、归一化相似度、RepVL-PAN、重参数化、监督来源和条件化实验比较。

Node.js20+，执行 npm ci、npm run dev；生产构建 npm run build。桌面端为本次验收范围。

Canvas与矩阵均为教学构造，未运行检测权重。表中数值按论文原始协议引用：Table2不使用TensorRT，Table6使用TensorRT；Table8为Mask AP。不能把模拟毫秒、二维向量或人工伪标签当成复现结果。具体出处见 EVIDENCE.md。

正式论文：https://openaccess.thecvf.com/content/CVPR2024/papers/Cheng_YOLO-World_Real-Time_Open-Vocabulary_Object_Detection_CVPR_2024_paper.pdf

本次补充：第1章训练词表正负名词练习，第2章仿射分数与阈值实验，第9章速度/参数约束下的配置筛选。均附条件解释、错误分支和重置。
