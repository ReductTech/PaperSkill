# 相机噪声实验台

CVPR 2022 论文 *Modeling sRGB Camera Noise with Normalizing Flows* 的 8 页中文交互教程。七个实验沿着成像域、训练残差、正向训练、反向合成和去噪验证展开。公式推导、完整实验表、术语与视频在各自页面中直接显示。

## 本地打开

在项目目录运行：

```powershell
npm.cmd install
npm.cmd run dev
```

浏览器打开终端显示的 `Local` 地址。生产构建使用 `npm.cmd run build`。

## 实验与素材

- 封面、残差、可逆流与去噪页共享照片样本。残差页选定的像素会带到后续页面。
- 三组照片来自原文图 10 的第 2、5、6 行，保留 256×256 图块。干净图、真实带噪图和四种 DnCNN 输出从原始图形对象中提取。残差由显示图块逐像素相减得到。
- 色调曲线、雅可比和实时反向采样是教学计算。实时采样使用内容相关的一维仿射例子，反向采样与评估页另附原文图 8 的生成样例。
- 论文图 2、7、8 的图像取自下方 CVPR 原文。
- 噪声建模和去噪数值来自原文表 1–3。图 10 照片来自 SIDD-Validation，表 3 汇总分数来自 SIDD-Benchmark。

[CVPR 论文原文](https://openaccess.thecvf.com/content/CVPR2022/papers/Kousha_Modeling_sRGB_Camera_Noise_With_Normalizing_Flows_CVPR_2022_paper.pdf) · [作者项目页](https://yorkucvil.github.io/sRGBNoise/)
