# SGDiff 交互式论文教程

论文：Dual-Granularity Semantic Guided Sparse Routing Diffusion Model for General Pansharpening（CVPR 2025）。

本项目使用 React、TypeScript 和 Vite，包含封面及11个中文教学页面，覆盖双粒度语义、残差扩散、3D去噪骨干、通道专家门控、共享专家、训练目标、实验与边界。

## 本地运行

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

生产构建：`npm run build`。产物位于 `dist/`。

## 使用

顶部按钮或键盘方向键翻页。讲稿包含具体来源、实验条件和类比边界。手机采用等比例幻灯片画布，可用缩放控件或双指操作查看细节。各页按钮和滑块驱动教学算例。

## 科学边界

- 这是交互式教学项目，不包含模型权重，也不执行真实GeoChat、CLIP或扩散推理，不上传用户数据。
- 门控矩阵、四维噪声与两级专家计算均为明确标注的合成教学算例，不是论文实测。
- 区域级描述经文本编码后调节通道，不将其解释成逐像素掩码。
- 实验图来自原文表2、3、4，保持各自协议和指标方向。原表±数值保留在讲稿中；没有提供的统计显著性不作推断。
- 贡献者已确认对照原论文完成人工内容核验；最终网页预览确认与仓库检查在提交前分别执行。

## 论文与代码

- [论文主页](https://openaccess.thecvf.com/content/CVPR2025/html/Xing_Dual-Granularity_Semantic_Guided_Sparse_Routing_Diffusion_Model_for_General_Pansharpening_CVPR_2025_paper.html)
- [作者代码](https://github.com/codgodtao/SGDiff)

使用 PaperSkill 的 paper-skill 生成；本版本由 hstk（GitHub: hstkwow）贡献。
