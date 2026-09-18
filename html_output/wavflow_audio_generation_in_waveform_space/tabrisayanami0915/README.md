# WavFlow：波形空间中的音频生成

基于 [WavFlow: Audio Generation in Waveform Space, v1](https://arxiv.org/abs/2605.18749v1) 的中文交互教程，包含十章及完整 React + TypeScript / Vite 源码。

## 运行与构建

```bash
npm ci
npm run dev
npm run build
npm run preview
```

在 PaperSkill 仓库根目录可运行：

```bash
npm run build:paper -- wavflow_audio_generation_in_waveform_space/tabrisayanami0915
```

## 内容与交互

- 波形分块、振幅预处理、训练插值、预测目标和速度损失。
- 双层条件、MMDiT 模型规格、RoPE、数据清洗与训练混合。
- CFG 与步数分别按论文单变量实验切换。
- VGGSound、AudioCaps、MovieGen-Audio-Bench 表格逐列比较并注明来源。

所有实验数值均来自指定 v1 论文。波形与结构图是教学示意，不运行真实 WavFlow 训练或音频推理；振幅直方图由示例波形实际计算。修订依据及工程验证见 [REVIEW_NOTES.md](REVIEW_NOTES.md)。

## 素材与边界

图形为项目内 SVG、HTML 与 CSS 自绘，未打包论文 PDF、论文原图、外部音视频或外部字体。论文通过公开链接引用，展示注明章节、页码、公式及表号。当前教程保留论文关于有意义语音和显式歌唱合成的局限。

## 维护位置

章节文案：`src/data/tutorial.ts`；交互模块：`src/modules/`；表格和波形辅助：`src/components/Evidence.tsx`、`WavePlot.tsx`；样式：`src/styles/paper.css`。
