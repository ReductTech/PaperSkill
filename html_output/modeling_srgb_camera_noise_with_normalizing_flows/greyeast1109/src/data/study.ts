export const paperUrl = 'https://openaccess.thecvf.com/content/CVPR2022/papers/Kousha_Modeling_sRGB_Camera_Noise_With_Normalizing_Flows_CVPR_2022_paper.pdf';
export const projectUrl = 'https://yorkucvil.github.io/sRGBNoise/';

export const studyStages = [
  { title: '选定成像域', description: '直接学习照片里的 sRGB 噪声' },
  { title: '提取残差', description: '对齐图像，去量化后相减' },
  { title: '正向训练', description: '映到高斯空间，用似然更新条件流' },
  { title: '反向合成', description: '从高斯采样，生成带噪图并评估' },
  { title: '去噪验证', description: '用合成样本训练，用真实图像测试' },
] as const;

export const lessons = [
  {
    id: 'start', name: '封面', title: '给照片加上真实的相机噪声', label: '相机噪声实验台',
    intro: '给定干净照片、相机和 ISO，归一化流怎样生成更像真实相机的噪声？',
    contribution: '本文提出了一种条件归一化流，直接学习 sRGB 照片中的噪声如何随画面内容、相机型号和 ISO 改变。在 SIDD-Benchmark 上，用它合成的带噪图训练去噪器，效果优于论文中用基线噪声训练的版本。',
  },
  {
    id: 'isp', name: '为什么选 sRGB', title: '为什么直接在 sRGB 里建模？', label: '成像', stage: 0,
    intro: '实际要去噪的往往是已经保存的 sRGB 照片，原始 RAW 数据未必能拿到。相机把 RAW 转为 sRGB 时，色调映射等处理也会改变噪声，因此本文直接学习最终照片里的噪声。',
    action: '拖动输入亮度，观察色调曲线上的取样点和输出扰动怎样变化。',
    handoff: '既然要在 sRGB 里学习噪声，先从同一场景的带噪图与干净图中取出噪声本身。',
    source: '图 2、图 3', paperPage: 2,
  },
  {
    id: 'residual', name: '提取训练残差', title: '先取出模型要学的噪声', label: '数据', stage: 1,
    intro: '从对齐的 sRGB 图像中，用带噪值减去干净值，得到噪声残差。训练时会先对两幅图去量化再相减，把得到的残差交给流模型，同时保留干净图作为条件。',
    action: '在带噪图上选一个位置，对照同一像素的干净值、带噪值和差值。',
    handoff: '现在拿到了真实残差。下一步用可逆变换把它映到标准高斯空间，借助已知的高斯密度给残差评分。',
    source: '式 (2)、图 10', paperPage: 3,
  },
  {
    id: 'flow', name: '映射到标准高斯', title: '把真实残差映到高斯空间', label: '机制', stage: 2,
    intro: '真实残差的分布很复杂，标准高斯的密度却有现成公式。正向流把每个残差变成潜变量 z，再结合变换造成的体积变化，算出这个真实残差在当前模型下的密度。',
    action: '沿用上一页的取样点，先看正向评分，再切到反向预览训练完成后怎样采样。',
    handoff: '有了密度，就能衡量当前模型对真实残差拟合得怎样。下一步把这个评分变成训练损失，更新流的参数。',
    source: '式 (3)、图 5', paperPage: 5,
  },
  {
    id: 'likelihood', name: '用似然训练', title: '用真实残差的似然训练模型', label: '数学', stage: 2,
    intro: '在训练中，作者希望真实残差在各自的条件下得到更高的密度。每次正向计算都要计入雅可比修正，再用负对数似然作为损失更新变换参数。',
    action: '拖动尺度 a，对比区间宽度、密度峰值和阴影下的概率质量。',
    handoff: '似然告诉我们怎样训练，但变换的参数从哪里来？下一页看干净图、相机和 ISO 如何进入网络。',
    source: '式 (3)、式 (4)', paperPage: 3,
  },
  {
    id: 'architecture', name: '学习条件变换', title: '相机、ISO 和内容怎样改变这条流？', label: '架构', stage: 2,
    intro: '训练时，每个残差都带着它的干净图、相机和 ISO。条件线性层使用相机与 ISO，条件耦合层进一步使用干净图，让同一个流模型学会在不同条件下调整噪声分布。',
    action: '选择流块中的任意一层，查看它接收哪些条件、怎样变换残差。',
    handoff: '条件流训练好后，固定干净图、相机和 ISO，就能从高斯空间反着走，合成这个条件下的新噪声。',
    source: '图 5、表 2', paperPage: 5,
  },
  {
    id: 'results', name: '反向采样与评估', title: '训练好以后，怎样合成并检验噪声？', label: '生成与证据', stage: 3,
    intro: '给定干净图、相机和 ISO，从标准高斯抽样，再用逆流把样本变回噪声残差。把残差加回干净图就得到合成带噪图，论文用 NLL 衡量拟合，用边际 KL 比较生成与真实噪声的直方图。',
    action: '切换 NLL 和边际 KL，观察 Noise Flow 与加大版的排序怎样变化。',
    handoff: '合成的带噪图与原来的干净图天然成对。最后用这些图像对训练去噪器，看看它能否处理真实照片。',
    source: '表 1、图 7', paperPage: 6,
  },
  {
    id: 'denoising', name: '去噪应用与边界', title: '合成噪声能训练出怎样的去噪器？', label: '应用', stage: 4,
    intro: '上一步生成了带噪图与干净图的训练对。作者用不同噪声来源分别训练同一架构的 DnCNN，再用真实照片测试，检验合成数据在去噪中到底有多大用处。',
    action: '切换 DnCNN 的训练噪声来源，拖动分割线，比较同一处细节的恢复效果。',
    handoff: '从 sRGB 照片学到条件噪声，再用逆流合成训练对。论文在 SIDD 上验证了这种合成数据能改善去噪，也量出了它与真实噪声训练的差距。',
    source: '表 3、图 10', paperPage: 8,
  },
] as const;

export const scenes = [
  { id: 'lettering', title: '印刷字样', row: 5 },
  { id: 'blue', title: '蓝色纹理', row: 2 },
  { id: 'shadow', title: '暗部边缘', row: 6 },
] as const;

export type Scene = (typeof scenes)[number];
export type PhotoKind = 'clean' | 'noisy' | 'paper' | 'real' | 'noise-flow' | 'gaussian';
export type Point = { x: number; y: number };
export const imageSize = 256;
export const imageUrl = (name: string) => `${import.meta.env.BASE_URL}images/${name}.png`;
export const photoUrl = (scene: Scene, kind: PhotoKind) => imageUrl(`${scene.id}-${kind}`);

export const densityRows = [
  { name: '各向同性高斯', nll: 3.703, kl: .091, params: 50 },
  { name: '对角协方差高斯', nll: 3.678, kl: .079, params: 150 },
  { name: '全协方差高斯', nll: 3.608, kl: .085, params: 525 },
  { name: '异方差高斯（NLF）', nll: 3.642, kl: .088, params: 72 },
  { name: 'Noise Flow', nll: 3.311, kl: .198, params: 2330 },
  { name: 'Noise Flow-Large', nll: 3.288, kl: .227, params: 6618 },
  { name: '本文模型', nll: 3.072, kl: .044, params: 6160 },
];

export const ablationRows = [
  ['仅 CL', '3.678', '0.079'],
  ['CCS × 2，仅 ISO', '3.726', '0.154'],
  ['CCS × 2，仅相机', '3.609', '0.216'],
  ['CCS × 2，仅干净图', '3.882', '0.295'],
  ['CCS × 2，全部条件', '3.530', '0.104'],
  ['CL + CCS × 2', '3.398', '0.075'],
  ['两个流块', '3.254', '0.067'],
  ['四个流块，本文默认', '3.072', '0.044'],
];

export const denoiseRows = [
  ['各向同性高斯', '32.48', '0.855'],
  ['对角协方差高斯', '33.34', '0.867'],
  ['全协方差高斯', '32.72', '0.873'],
  ['异方差高斯', '32.24', '0.849'],
  ['Noise Flow', '33.81', '0.894'],
  ['C2N（原文引述）', '33.76', '0.901'],
  ['本文模型合成', '34.74', '0.912'],
  ['真实噪声训练', '36.51', '0.922'],
];
