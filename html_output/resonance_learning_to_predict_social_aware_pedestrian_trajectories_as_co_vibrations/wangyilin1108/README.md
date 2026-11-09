# Resonance：以协同振动预测行人轨迹

王艺霖的中文交互式论文导读。选题为专题清单之外自主查找的 ICCV 2025 主会论文，共 3 章、15 页。

从 ByteTrack 产出的历史轨迹进入预测任务，用同一街景说明线性拟合、自身偏移、交互偏移，以及两类偏移如何在同一时刻叠加。后半部分连接多未来采样、best-of-K、论文主结果和消融。

- [ICCV 正式论文页](https://openaccess.thecvf.com/content/ICCV2025/html/Wong_Resonance_Learning_to_Predict_Social-Aware_Pedestrian_Trajectories_as_Co-Vibrations_ICCV_2025_paper.html)
- [作者代码仓库](https://github.com/cocoon2wong/Re)

## 证据与示例

- 网页实时重算最小二乘拟合、单层正交 Haar、逐元素乘积、角度分区、扇区均值与位置误差。
- 街景中的偏移函数、分支采样幅度和邻居特征是教学构造。论文的共振特征来自学习后的嵌入与 MLP，最终偏移来自两个学习分支。
- 论文结果分别引用表 2 和表 4，注明数据集、单位与评测口径。网页的三栏轨迹由代码绘制，配合 [ICCV 原文图 7](https://openaccess.thecvf.com/content/ICCV2025/papers/Wong_Resonance_Learning_to_Predict_Social-Aware_Pedestrian_Trajectories_as_Co-Vibrations_ICCV_2025_paper.pdf#page=7) 说明怎样对照两类偏移与合成结果。
- 历史缺失演示仅比较同一未来时刻下的线性外推。论文出处和逐页讲稿保存在源码中，网页讲稿入口隐藏。

## 本地预览

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5179
npm run build
```

页面正文采用 React 和 TypeScript。导读中的教学图形和导航缩略图均来自本项目。
