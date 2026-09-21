export type MetricDirection = 'up' | 'down'

export interface BenchmarkRow {
  metric: string
  direction: MetricDirection
  janus: number
  peers: { name: string; value: number }[]
  note: string
}

export const understandingMetrics: BenchmarkRow[] = [
  {
    metric: 'POPE',
    direction: 'up',
    janus: 87.0,
    peers: [
      { name: 'Show-o 1.3B', value: 73.8 },
      { name: 'LLaVA-v1.5 7B', value: 85.9 },
      { name: 'VILA-U 7B', value: 85.8 },
    ],
    note: '对象幻觉评测；Janus 以 1.3B LLM 参数取得 87.0。',
  },
  {
    metric: 'MMBench',
    direction: 'up',
    janus: 69.4,
    peers: [
      { name: 'LLaVA-v1.5 7B', value: 64.3 },
      { name: 'Qwen-VL-Chat 7B', value: 60.6 },
      { name: 'VILA-U', value: 0 },
    ],
    note: '论文表 2 中 Show-o 与 VILA-U 未报告此项；0 仅表示“无报告”，不参与比较。',
  },
  {
    metric: 'SEED-Bench',
    direction: 'up',
    janus: 63.7,
    peers: [
      { name: 'LLaVA-v1.5 7B', value: 58.6 },
      { name: 'Qwen-VL-Chat 7B', value: 58.2 },
      { name: 'VILA-U 7B', value: 59.0 },
    ],
    note: '综合生成式理解基准，数值越高越好。',
  },
  {
    metric: 'GQA',
    direction: 'up',
    janus: 59.1,
    peers: [
      { name: 'Show-o 1.3B', value: 48.7 },
      { name: 'LLaVA-v1.5 7B', value: 62.0 },
      { name: 'VILA-U 7B', value: 60.8 },
    ],
    note: 'Janus 显著超过同规模统一模型 Show-o，但并非每项都超过更大的专用模型。',
  },
]

export const generationMetrics: BenchmarkRow[] = [
  {
    metric: 'GenEval Overall',
    direction: 'up',
    janus: 0.61,
    peers: [
      { name: 'Show-o 1.3B', value: 0.53 },
      { name: 'SDXL 2.6B', value: 0.55 },
      { name: 'DALL·E 2', value: 0.52 },
    ],
    note: '组合提示遵循准确率，数值越高越好。',
  },
  {
    metric: 'COCO-30K FID',
    direction: 'down',
    janus: 8.53,
    peers: [
      { name: 'Show-o 1.3B', value: 9.24 },
      { name: 'SD v1.5', value: 9.62 },
      { name: 'PixArt-α', value: 7.32 },
    ],
    note: 'FID 越低越好；Janus 优于部分统一模型，但不是所有生成专用模型中的最佳值。',
  },
  {
    metric: 'MJHQ-30K FID',
    direction: 'down',
    janus: 10.10,
    peers: [
      { name: 'Show-o 1.3B', value: 15.18 },
      { name: 'LWM 7B', value: 17.77 },
      { name: 'VILA-U 7B (384)', value: 7.69 },
    ],
    note: 'Janus 超过 Show-o 与 LWM；VILA-U (384) 的 7.69 更低。',
  },
]

export interface AblationRow {
  id: string
  encoder: string
  task: string
  pope?: number
  mmb?: number
  seed?: number
  mmmu?: number
  fid?: number
}

export const ablations: AblationRow[] = [
  { id: 'A', encoder: 'VQ Tokenizer', task: '理解 + 生成', pope: 60.1, mmb: 35.0, seed: 34.9, mmmu: 24.7, fid: 8.72 },
  { id: 'B', encoder: '语义 Tokenizer', task: '理解 + 生成', pope: 82.4, mmb: 52.7, seed: 54.9, mmmu: 26.6, fid: 7.11 },
  { id: 'C', encoder: '语义 Tokenizer', task: '仅理解', pope: 83.9, mmb: 62.1, seed: 60.8, mmmu: 27.5 },
  { id: 'D', encoder: 'SigLIP + VQ（Janus）', task: '理解 + 生成', pope: 87.0, mmb: 69.4, seed: 63.7, mmmu: 30.5, fid: 8.53 },
  { id: 'E', encoder: 'SigLIP', task: '仅理解', pope: 85.9, mmb: 70.6, seed: 64.8, mmmu: 28.8 },
  { id: 'F', encoder: 'VQ Tokenizer', task: '仅生成', fid: 8.92 },
]

export const trainingStages = [
  {
    id: 1,
    name: '建立连接',
    subtitle: '训练适配器与图像预测头',
    trainable: ['理解适配器', '生成适配器', '图像预测头'],
    frozen: ['SigLIP', 'VQ Tokenizer', 'LLM'],
    ratio: '1 : 0 : 1',
    ratioLabels: '多模态理解 : 纯文本 : 视觉生成',
    steps: '10,000',
    batch: '256',
    lr: '1×10⁻³',
    description: '先把两种视觉特征接入语言模型的嵌入空间；此时不改动视觉编码器与 LLM。',
  },
  {
    id: 2,
    name: '统一预训练',
    subtitle: '让共享 Transformer 同时学习三类序列',
    trainable: ['理解适配器', '生成适配器', '图像预测头', 'LLM'],
    frozen: ['SigLIP', 'VQ Tokenizer'],
    ratio: '2 : 3 : 5',
    ratioLabels: '多模态理解 : 纯文本 : 视觉生成',
    steps: '180,000',
    batch: '512',
    lr: '1×10⁻⁴',
    description: '先用 ImageNet 学基本像素依赖，再切换到开放域文生图数据；同时混入文本与理解数据。',
  },
  {
    id: 3,
    name: '监督微调',
    subtitle: '强化指令遵循与对话',
    trainable: ['SigLIP', '理解适配器', '生成适配器', '图像预测头', 'LLM'],
    frozen: ['VQ Tokenizer（生成编码器）'],
    ratio: '7 : 3 : 10',
    ratioLabels: '多模态理解 : 纯文本 : 视觉生成',
    steps: '24,000',
    batch: '256',
    lr: '2×10⁻⁵',
    description: '混合三类指令数据，只监督 Assistant 回答并遮蔽系统与用户提示；不为任务另训模型。',
  },
]
