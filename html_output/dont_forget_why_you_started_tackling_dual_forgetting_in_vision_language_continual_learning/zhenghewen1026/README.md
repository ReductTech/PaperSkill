# 视觉语言持续学习中的双重遗忘

《Don’t Forget Why You Started: Tackling Dual Forgetting in Vision-Language Continual Learning》的中文交互教程。

论文：Borui Kang、Jinrui Gu、Tao Feng、Qi Fan、Yinghuan Shi、Lei Wang、Wenbin Li、Yang Gao，ICML 2026，PMLR 306: 55376–55395。

[正式论文](https://proceedings.mlr.press/v306/kang26c.html) · [作者代码](https://github.com/RL-MIND/DFA-MoE)

## 学习内容

教程采用相机、照片、题注和胶片的视觉场景，共13页，包含封面和6个章节。

1. 两种遗忘：比较历史类别与陌生领域的参考点；选择增量训练数据集并推进任务。
2. 评价方法：改变类别原型角度，切换距离方向；调节语义距离，计算相似度校准保持率。
3. 对齐目标：改变正配对相似度和历史负样本；逐次更新128对特征的历史队列。
4. 专家分工：切换两个训练阶段，查看更新对象；调节两层路由并计算残差输出。
5. 实验结果：逐项加入方法组件；按数据集、指标比较论文结果；检查参数量与每迭代耗时。
6. 指标敏感性：改变校准系数，比较两组模型记录的分数，并处理权重和为零的状态。

左侧目录支持逐页定位，顶部提供翻页、讲稿和放映；页面支持画布缩放、触屏拖动和双指缩放。公式符号可点击查看含义。切换到另一页再返回可恢复该页的初始状态。

## 本地运行

需要 Node.js 20 或更高版本。

```sh
npm ci
npm run dev
```

生产构建和预览：

```sh
npm run build
npm run preview
```

Vite 使用相对资源路径，支持子目录部署。项目基于 PaperSkill 1.5.0 的 React + TypeScript 演示页面框架。运行依赖为 React 与 React DOM，图形使用内联SVG和网页元素，无远程字体或运行时接口依赖。

## 内容来源

研究动机与双重遗忘定义来自论文第1–2节；评价协议和校准指标来自第3节、公式(1)–(5)；专家分工、两层路由和对比目标来自第4节、公式(6)–(10)；结果与消融来自表1–3；任务划分、模型配置和队列参数来自附录A–B。

语义距离、对比概率、二维路由和任务变化页面使用明确标注的教学数值。实验页采用论文报告值。可训练参数量和每迭代时间来自表2，消融使用EuroSAT设置；不同实验的指标和条件保留在页面讲稿中。

相机、相册、照片题材、胶片及所有图表均以代码绘制，未复制论文图像；缩略图由本项目实际页面截图生成。系统字体由浏览设备提供。框架来源为 [ReductTech/PaperSkill](https://github.com/ReductTech/PaperSkill)，沿用上游项目许可。
