// ============================================================================
//  论文数值（arXiv:2403.06764）。所有交互模块的结果数字都从这里读取。
// ============================================================================

/** Fig.3：LLaVA-1.5-7B 在 1000 个图文样本上的平均 token 数。 */
export const TOKEN_COUNTS = { sys: 35, img: 576, ins: 135, out: 150 };

/** Fig.3：注意力分配 λ（解码输出 token 时，各类输入获得的注意力总和）。 */
export const ALLOC = {
  shallow: { sys: 0.03, img: 0.24, ins: 0.16, out: 0.57 },
  deep: { sys: 0.85, img: 0.03, ins: 0.02, out: 0.1 },
};

/** Fig.3：注意力效率 ε（以图像 token 为 1×）。 */
export const EFFICIENCY = {
  shallow: { sys: 2, img: 1, ins: 3, out: 9 },
  deep: { sys: 472, img: 1, ins: 3, out: 12.8 },
};

/** Table 1：K / R / FLOPs(B) / FLOPs 比例 / Nocaps / Flickr30k / A-OKVQA / MMMU / Avg */
export interface MainRow {
  K: number | null; // null = 基线
  R: number | null;
  flops: number;
  ratio: number;
  nocaps: number;
  flickr: number;
  aok: number;
  mmmu: number;
  avg: number;
}
export const MAIN: Record<'7B' | '13B' | 'QwenVL', MainRow[]> = {
  '7B': [
    { K: null, R: null, flops: 99.3, ratio: 1.0, nocaps: 99.8, flickr: 67.9, aok: 76.7, mmmu: 34.8, avg: 69.8 },
    { K: 2, R: 0.9, flops: 19.9, ratio: 0.2, nocaps: 72.1, flickr: 43.7, aok: 70.1, mmmu: 35, avg: 55.2 },
    { K: 2, R: 0.75, flops: 32.8, ratio: 0.33, nocaps: 94.6, flickr: 63.6, aok: 75.5, mmmu: 34.8, avg: 67.1 },
    { K: 2, R: 0.5, flops: 54.6, ratio: 0.55, nocaps: 99.7, flickr: 67.5, aok: 77, mmmu: 34.4, avg: 69.7 },
    { K: 3, R: 0.9, flops: 22.8, ratio: 0.23, nocaps: 87.2, flickr: 55.8, aok: 71.9, mmmu: 34.8, avg: 62.4 },
    { K: 3, R: 0.75, flops: 34.8, ratio: 0.35, nocaps: 98, flickr: 65, aok: 74.7, mmmu: 34.1, avg: 68.0 },
    { K: 3, R: 0.5, flops: 56.6, ratio: 0.57, nocaps: 99.7, flickr: 68.3, aok: 76.7, mmmu: 34.3, avg: 69.8 },
    { K: 5, R: 0.9, flops: 27.8, ratio: 0.28, nocaps: 88.6, flickr: 59.3, aok: 70.6, mmmu: 33.9, avg: 63.1 },
    { K: 5, R: 0.75, flops: 39.7, ratio: 0.4, nocaps: 98.5, flickr: 66.3, aok: 74.8, mmmu: 34.3, avg: 68.5 },
    { K: 5, R: 0.5, flops: 59.6, ratio: 0.6, nocaps: 99.2, flickr: 67.9, aok: 76.8, mmmu: 34.3, avg: 69.6 },
    { K: 0, R: 0.9, flops: 18.9, ratio: 0.19, nocaps: 7, flickr: 53.2, aok: 66.8, mmmu: 34.7, avg: 40.4 },
    { K: 0, R: 0.75, flops: 28.8, ratio: 0.29, nocaps: 27.2, flickr: 61.4, aok: 72.8, mmmu: 35.1, avg: 49.1 },
    { K: 0, R: 0.5, flops: 51.6, ratio: 0.52, nocaps: 100.9, flickr: 65.5, aok: 75.3, mmmu: 34.3, avg: 69.0 },
  ],
  '13B': [
    { K: null, R: null, flops: 154.6, ratio: 1.0, nocaps: 102.8, flickr: 73, aok: 82, mmmu: 36.4, avg: 73.6 },
    { K: 2, R: 0.9, flops: 29.7, ratio: 0.19, nocaps: 87.9, flickr: 62, aok: 75, mmmu: 36.3, avg: 65.3 },
    { K: 2, R: 0.75, flops: 50.2, ratio: 0.32, nocaps: 100.5, flickr: 72.5, aok: 80.9, mmmu: 38.1, avg: 73.0 },
    { K: 2, R: 0.5, flops: 84.6, ratio: 0.55, nocaps: 103.1, flickr: 73.4, aok: 81, mmmu: 36.7, avg: 73.6 },
    { K: 3, R: 0.9, flops: 33.0, ratio: 0.21, nocaps: 90.2, flickr: 63.6, aok: 75.2, mmmu: 34.9, avg: 66.0 },
    { K: 3, R: 0.75, flops: 52.9, ratio: 0.34, nocaps: 100.9, flickr: 72.1, aok: 79.5, mmmu: 36.4, avg: 72.2 },
    { K: 3, R: 0.5, flops: 86.4, ratio: 0.56, nocaps: 102.7, flickr: 73.4, aok: 81.3, mmmu: 36.4, avg: 73.5 },
    { K: 5, R: 0.9, flops: 39.6, ratio: 0.26, nocaps: 93.5, flickr: 67.4, aok: 75.8, mmmu: 35.4, avg: 68.0 },
    { K: 5, R: 0.75, flops: 58.4, ratio: 0.38, nocaps: 101.4, flickr: 72.5, aok: 80, mmmu: 36.2, avg: 72.5 },
    { K: 5, R: 0.5, flops: 90.1, ratio: 0.58, nocaps: 102.5, flickr: 73.5, aok: 81.2, mmmu: 36.6, avg: 73.5 },
  ],
  QwenVL: [
    { K: null, R: null, flops: 71.9, ratio: 1.0, nocaps: 94.9, flickr: 72.5, aok: 75.6, mmmu: 35.8, avg: 69.7 },
    { K: 2, R: 0.9, flops: 15.8, ratio: 0.22, nocaps: 81.9, flickr: 61.5, aok: 68.5, mmmu: 35.3, avg: 61.7 },
    { K: 2, R: 0.75, flops: 24.4, ratio: 0.34, nocaps: 90.5, flickr: 67.0, aok: 75.1, mmmu: 35.3, avg: 67.0 },
    { K: 2, R: 0.5, flops: 39.5, ratio: 0.55, nocaps: 94.4, flickr: 71.4, aok: 75.3, mmmu: 35.6, avg: 69.2 },
  ],
};

/** Table 4（延迟）：单张 A40，A-OKVQA（只输出一个选项字母），FastV 设置 K=0、R=50%（随机剪枝）。 */
export const LATENCY = [
  { name: 'LLaVA-1.5-7B', fast: false, total: '6:34', mem: 19, score: 76.7, lat: 0.344 },
  { name: '7B + FastV', fast: true, total: '4:23', mem: 16, score: 75.3, lat: 0.23 },
  { name: 'LLaVA-1.5-13B', fast: false, total: '10:17', mem: 38, score: 82.0, lat: 0.539 },
  { name: '13B + FastV', fast: true, total: '6:30', mem: 30, score: 80.5, lat: 0.341 },
];

/** Table（消融）：重新训练的 LLaVA-1.5-7B。null 表示 Failed（无法按指令输出有效答案）。 */
export interface AblRow {
  id: string;
  name: string;
  short: string;
  scores: (number | null)[]; // Nocaps, Flickr30k, A-OKVQA, MMMU
}
export const ABL_BASE = [100.3, 70.2, 78.5, 34.5];
export const ABLATION: AblRow[] = [
  { id: 'b', name: 'FastV（K=2，R=50%，按注意力排序）', short: '按注意力剪图像', scores: [100.1, 70, 78.4, 34.6] },
  { id: 'c', name: 'FastV（K=2，R=50%，随机丢弃）', short: '随机剪图像', scores: [99.5, 68.3, 78.2, 34.2] },
  { id: 'a', name: '训练时直接只用 50% 图像 token', short: '少 token 重训', scores: [98.5, 68.5, 76.8, 33.5] },
  { id: 'f', name: '改为剪掉用户指令 token', short: '剪指令', scores: [77.3, 50.1, 56.5, 29.5] },
  { id: 'd', name: '改为剪掉系统提示 token', short: '剪系统提示', scores: [89.2, 64.3, 69.2, 33.8] },
  { id: 'e', name: '剪掉系统提示的前一半', short: '剪提示前半', scores: [17.5, 27.8, null, null] },
  { id: 'g', name: '套用 StreamingLLM 稀疏注意力', short: 'StreamingLLM', scores: [13.2, 21.4, null, null] },
];
export const BENCH = ['Nocaps', 'Flickr30k', 'A-OKVQA', 'MMMU'];

/**
 * Fig. 6（ECCV 版消融图，读图近似值）：LLaVA-1.5-13B 在 OCR-VQA 上的 Rouge-L，横轴 R。
 * 无 FastV 时为 0.55。
 */
export const OCR_R = [0.875, 0.75, 0.5, 0.25];
export const OCR_CURVES: Record<number, number[]> = {
  1: [0.34, 0.49, 0.54, 0.55],
  2: [0.47, 0.53, 0.55, 0.55],
  5: [0.49, 0.53, 0.55, 0.55],
  10: [0.5, 0.54, 0.55, 0.55],
  15: [0.54, 0.55, 0.55, 0.55],
  20: [0.55, 0.55, 0.55, 0.55],
};

/** Table（视频 QA，GPT 评测）：Video-LLaVA。 */
export const VIDEO = [
  { name: 'Video-LLaVA（100% FLOPs）', tgif: 0.18, msvd: 0.7, msrvtt: 0.56, avg: 0.48 },
  { name: '+FastV K=2 R=50%（52.3%）', tgif: 0.21, msvd: 0.71, msrvtt: 0.55, avg: 0.49 },
  { name: '+FastV K=5 R=50%（57.1%）', tgif: 0.2, msvd: 0.71, msrvtt: 0.57, avg: 0.49 },
];

/** 通用分组柱状图数据：每组若干类别 × 若干系列。 */
export interface BenchGroup {
  id: string;
  name: string;
  model: string;
  cats: string[];
  series: { name: string; vals: number[]; fast?: boolean }[];
  note: string;
}

/** Table（更多基准 / MME 细项 / PCA-Bench / 视频 QA）汇总，供第 8 章浏览。 */
export const BENCH_GROUPS: BenchGroup[] = [
  {
    id: 'video',
    name: '视频问答',
    model: 'Video-LLaVA（GPT 评测，准确率）',
    cats: ['TGIF', 'MSVD', 'MSRVTT'],
    series: [
      { name: '完整（100% FLOPs）', vals: [0.18, 0.7, 0.56] },
      { name: 'K=2 R=50%（52.3%）', vals: [0.21, 0.71, 0.55], fast: true },
      { name: 'K=5 R=50%（57.1%）', vals: [0.2, 0.71, 0.57], fast: true },
    ],
    note: 'Table 6：每个数据集取前 1000 条、GPT 评测、单次运行。TGIF 0.18→0.21、平均 0.48→0.49 是小幅变化，不应解读为剪枝提升了能力。',
  },
  {
    id: 'more',
    name: '更多基准',
    model: 'LLaVA-1.5-13B（K=2，R=50%）',
    cats: ['AI2D', 'SciQA-IMG', 'SeedBench', 'MMVet', 'MME'],
    series: [
      { name: '完整模型', vals: [59.45, 72.99, 68.23, 30.55, 1827.75] },
      { name: '+FastV', vals: [58.96, 73.23, 68.03, 31.25, 1849.68], fast: true },
    ],
    note: 'Table 2：五个综合基准有升有降、差距都很小；MME 总分 1827.75 → 1849.68 的上升同样不代表能力提升。',
  },
  {
    id: 'mme',
    name: 'MME 细项',
    model: 'LLaVA-1.5-13B（K=2，R=50%）',
    cats: ['存在', '计数', '位置', '颜色', 'OCR', '海报', '名人', '场景', '地标', '艺术', '常识', '数值', '文本翻译', '代码'],
    series: [
      { name: '完整模型', vals: [185, 155, 133.33, 170, 125, 160.72, 152.54, 161.25, 170.5, 118.5, 128.41, 42.5, 77.5, 47.5] },
      { name: '+FastV', vals: [185, 155, 133.33, 175, 132.5, 159.77, 153.15, 161.75, 168.25, 117, 126.43, 42.5, 82.5, 57.5], fast: true },
    ],
    note: 'Table 3：14 个 MME 子项中 10 项持平或上升（如 OCR 125 → 132.5、代码推理 47.5 → 57.5），其余 4 项小幅下降。MME 每题是“是 / 否”判断，单个子项题量小，几分的波动很常见。',
  },
  {
    id: 'blip',
    name: 'Q-Former 模型',
    model: 'InstructBLIP-Vicuna-13B',
    cats: ['AI2D', 'SciQA-IMG', 'SeedBench', 'MMVet', 'MME'],
    series: [
      { name: '完整模型', vals: [45.46, 61.15, 52.11, 24.19, 1143.5] },
      { name: 'K=2 R=50%', vals: [43.12, 61.23, 50.41, 22.15, 1129.8], fast: true },
      { name: 'K=5 R=50%', vals: [44.39, 62.33, 51.69, 23.51, 1140.5], fast: true },
    ],
    note: 'Table 2：Q-Former 已先压缩过视觉 token，K=2 时掉分比 LLaVA 多；把 K 调到 5，差距明显缩小。',
  },
  {
    id: 'pca',
    name: '具身决策 PCA',
    model: 'LLaVA-1.5-13B（PCA-Bench 开放测试集）',
    cats: ['感知 P', '认知 C', '行动 A', 'G-PCA'],
    series: [
      { name: '完整（154.6B）', vals: [0.53, 0.46, 0.503, 0.333] },
      { name: 'K=0 R=50%（78.9B）', vals: [0.49, 0.395, 0.443, 0.292], fast: true },
      { name: 'K=2 R=50%（84.6B）', vals: [0.533, 0.423, 0.513, 0.34], fast: true },
      { name: 'K=2 R=75%（50.2B）', vals: [0.513, 0.417, 0.483, 0.32], fast: true },
    ],
    note: 'Table 5：K=2、R=50% 的感知、行动与 G-PCA 与完整模型相当（略高，差异很小）；K=0 则全面下降。',
  },
];

/** 第 10 章：按论文实测给出的配置建议（解读）。 */
export interface Advice {
  K: number;
  R: number;
  flopsText: string;
  flopsRatio: number; // 0..1，用于仪表；-1 表示论文未报告
  perfText: string;
  perfRatio: number; // 相对完整模型的得分比例
  why: string;
}
export const ADVICE: Record<string, Record<'safe' | 'fast', Advice>> = {
  caption: {
    safe: { K: 2, R: 0.5, flopsText: '55%', flopsRatio: 0.55, perfText: '平均 73.6 / 73.6', perfRatio: 1, why: 'Table 1：LLaVA-1.5-13B 在 K=2、R=50% 时四项平均分与完整模型相同。' },
    fast: { K: 2, R: 0.75, flopsText: '32%', flopsRatio: 0.32, perfText: '平均 73.0 / 73.6', perfRatio: 73.0 / 73.6, why: 'Table 1：13B 在 K=2、R=75% 时平均只降 0.6 分。K=0 时 7B（R=75%）Nocaps 只剩 27.2——但 K=0 同时改变了剪枝位置和排序依据。' },
  },
  ocr: {
    safe: { K: 2, R: 0.5, flopsText: '84.6B（55%）', flopsRatio: 0.55, perfText: 'Rouge-L 0.55 / 0.55', perfRatio: 1, why: 'Table 5：13B 在 K=2、R=50% 时 OCR-VQA 与完整模型持平。' },
    fast: { K: 2, R: 0.75, flopsText: '50.2B（32%）', flopsRatio: 0.32, perfText: 'Rouge-L 0.54 / 0.55', perfRatio: 0.54 / 0.55, why: 'Table 5：R=75% 仅降 0.01；Fig. 6 显示 K=1 时加大 R 会明显掉分，别把 K 设得太小。' },
  },
  video: {
    safe: { K: 5, R: 0.5, flopsText: '57.1%', flopsRatio: 0.571, perfText: '平均准确率 0.49 / 0.48', perfRatio: 0.49 / 0.48, why: 'Table 6：Video-LLaVA 在 K=5、R=50% 时三项平均准确率 0.49（完整 0.48），差异很小。' },
    fast: { K: 2, R: 0.5, flopsText: '52.3%', flopsRatio: 0.523, perfText: '平均准确率 0.49 / 0.48', perfRatio: 0.49 / 0.48, why: 'Table 6：K=2、R=50% 平均准确率同为 0.49。论文的视频实验只测了 R=50%，更大的 R 没有证据。' },
  },
  qformer: {
    safe: { K: 5, R: 0.5, flopsText: '论文未报告', flopsRatio: -1, perfText: 'MME 1140.5 / 1143.5', perfRatio: 1140.5 / 1143.5, why: 'Table 2：InstructBLIP 在 K=5 时基本追平；论文未给出该模型的 FLOPs 数值。' },
    fast: { K: 2, R: 0.5, flopsText: '论文未报告', flopsRatio: -1, perfText: 'MME 1129.8 / 1143.5', perfRatio: 1129.8 / 1143.5, why: 'Table 2：K=2 时 AI2D 45.46 → 43.12、MMVet 24.19 → 22.15，掉分比 LLaVA 明显。' },
  },
};
