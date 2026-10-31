# 图片与图形清单（替换后）

| 文件（相对项目根目录） | 页面 | 来源与处理 |
|---|---|---|
| public/images/detr-figure-2.png | 原第3页 | 原论文第7页Figure 2截图；已删除，不再随项目交付 |
| public/images/detr-architecture-original.svg | 第3页 | 本项目自绘矢量图，按§3.2结构事实重新组织双输入分支布局；非截图、非逐像素描摹，无原图照片或图形元素 |
| src/modules/cover-old.tsx | 第1页左侧 | 自绘人物与框，SVG程序动画 |
| src/modules/cover-new.tsx | 第1页右侧 | 自绘人物与框，SVG程序动画 |
| src/modules/motivation.tsx | 第2页 | 自绘合影与重复框，程序生成 |
| src/modules/architecture.tsx | 第3页 | 加载上述自绘SVG，无论文原图 |
| src/modules/queries.tsx | 第4页 | 自绘人物、边界框及程序生成100格槽位；合成教学示例 |
| src/modules/matching.tsx | 第5页 | 程序计算成本并绘制连线和矩阵；合成教学示例 |
| src/modules/objective.tsx | 第6页 | HTML公式与控件，无图片文件 |
| src/modules/boxloss.tsx | 第7页 | 程序生成矩形和损失反馈；合成教学示例 |
| src/modules/results-comparison.tsx | 第8页 | 程序绘制柱状图；数值来源原论文Table 1，不复制原表图像 |
| src/modules/loss-ablation.tsx | 第9页 | 程序绘制柱状图；数值来源原论文Table 4，不复制原表图像 |
| src/modules/limitations.tsx | 第10页 | 程序绘制训练长度图与数字说明；依据§4及Table 1 |
| public/images/.gitkeep | 无 | 空目录占位文件，不是图片 |

没有外部图片、AI生成位图或缩略图文件。生成器在多个模块文件中保留了共享组件副本，以上按注册组件的实际显示页面归类；全部副本的旧图引用均已替换。
