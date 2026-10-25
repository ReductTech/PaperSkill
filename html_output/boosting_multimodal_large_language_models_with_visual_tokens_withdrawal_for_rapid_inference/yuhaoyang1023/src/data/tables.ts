// 论文表格数字（逐项抄自 AAAI 2025 正式版；arXiv v3 附录单独标注）。
// 只放原始数字，不放解读。页面上的差值、比例都由这些数字现场计算。

export const BENCH = ['AI2D', 'SQA_Img', 'MMMU_Val', 'MMB_EN', 'POPE', 'MME'] as const;
export type Bench = (typeof BENCH)[number];

export interface T2Row {
  key: 'base' | 'fastv' | 'rand' | 'vtwr' | 'vtw';
  label: string;
  tflops: string;
  values: number[]; // 与 BENCH 顺序一致
}
export interface T2Block {
  model: string;
  id: '7b' | '13b' | 'next';
  K: number;
  rows: T2Row[];
}

/** AAAI 表 2（第 6 页 / 页码 5339） */
export const TABLE2: T2Block[] = [
  {
    model: 'LLaVA-1.5-7B',
    id: '7b',
    K: 16,
    rows: [
      { key: 'base', label: '原模型', tflops: '8.48 (100.00%)', values: [55.21, 69.61, 35.6, 64.09, 85.83, 1866.1] },
      { key: 'fastv', label: '+ FastV', tflops: '4.91 (57.90%)', values: [55.14, 68.96, 35.8, 64.26, 82.49, 1864.35] },
      { key: 'rand', label: '+ Rand (K=16)', tflops: '4.68 (55.19%)', values: [4.4, 9.07, 29.3, 0.52, 82.22, 139.42] },
      { key: 'vtwr', label: '+ VTW† (K∈[8,24])', tflops: '≈4.68 (≈55.19%)', values: [55.36, 69.21, 36.1, 55.61, 76.05, 1741.34] },
      { key: 'vtw', label: '+ VTW (K=16)', tflops: '4.68 (55.19%)', values: [55.44, 69.66, 36.3, 64.0, 85.96, 1872.43] },
    ],
  },
  {
    model: 'LLaVA-1.5-13B',
    id: '13b',
    K: 20,
    rows: [
      { key: 'base', label: '原模型', tflops: '16.50 (100.00%)', values: [59.26, 72.83, 34.9, 68.73, 86.02, 1827.26] },
      { key: 'fastv', label: '+ FastV', tflops: '9.56 (57.94%)', values: [58.87, 73.03, 34.6, 68.3, 85.15, 1855.11] },
      { key: 'rand', label: '+ Rand (K=20)', tflops: '9.10 (55.15%)', values: [2.49, 7.93, 25.8, 0.94, 83.78, 41.74] },
      { key: 'vtwr', label: '+ VTW† (K∈[12,28])', tflops: '≈9.10 (≈55.15%)', values: [58.35, 71.99, 34.2, 62.02, 75.06, 1661.36] },
      { key: 'vtw', label: '+ VTW (K=20)', tflops: '9.10 (55.15%)', values: [59.39, 72.88, 34.9, 68.81, 85.93, 1828.79] },
    ],
  },
  {
    model: 'LLaVA-NeXT-7B',
    id: 'next',
    K: 16,
    rows: [
      { key: 'base', label: '原模型', tflops: '28.73 (100.00%)', values: [65.31, 70.15, 35.3, 67.18, 86.44, 1846.33] },
      { key: 'fastv', label: '+ FastV', tflops: '15.67 (54.54%)', values: [64.86, 68.96, 35.7, 66.84, 85.98, 1786.17] },
      { key: 'rand', label: '+ Rand (K=16)', tflops: '14.80 (51.51%)', values: [0.84, 3.37, 24.3, 0.17, 80.0, 18.97] },
      { key: 'vtwr', label: '+ VTW† (K∈[8,24])', tflops: '≈14.80 (≈51.51%)', values: [64.54, 69.86, 35.4, 59.28, 75.73, 1723.65] },
      { key: 'vtw', label: '+ VTW (K=16)', tflops: '14.80 (51.51%)', values: [65.35, 70.0, 35.7, 67.18, 86.33, 1857.35] },
    ],
  },
];

/** AAAI 表 1：LLaVA-1.5-7B，MME 总分 */
export const TABLE1 = [
  { key: 'base', label: '原模型', short: '原模型', score: 1866.1 },
  { key: 'a', label: '(a) 不给图', short: '(a) 无图', score: 970.89 },
  { key: 'b', label: '(b) 第 1–16 层给“无内容”白图', short: '(b) 白图', score: 845.39 },
  { key: 'c', label: '(c) 第 1–16 层给原图', short: '(c) 原图', score: 1872.43 },
] as const;

/** AAAI 表 3：Video-LLaVA */
export const TABLE3 = [
  { label: 'Video-LLaVA', flops: '100.00%', tgif: 0.25, vmme: 0.3, avg: 0.28 },
  { label: '+ FastV', flops: '53.13%', tgif: 0.21, vmme: 0.3, avg: 0.26 },
  { label: '+ VTW (K=16)', flops: '50.00%', tgif: 0.27, vmme: 0.3, avg: 0.29 },
];

/** AAAI 表 4：LLaVA-NeXT-7B，SQA_Image，单张 RTX 3090 */
export const TABLE4 = {
  rows: [
    { key: 'model', label: '(a) 模型显存', base: 14.1, fastv: 14.1, vtw: 14.1, unit: 'G', ratio: '1.00×' },
    { key: 'peak', label: '(b) 推理峰值显存', base: 17.1, fastv: 17.1, vtw: 16.1, unit: 'G', ratio: '0.94×' },
    { key: 'sample', label: '(b)−(a) 单样本显存', base: 3.1, fastv: 3.1, vtw: 2.0, unit: 'G', ratio: '0.65×' },
    { key: 'tflops', label: 'TFLOPs', base: 22.9, fastv: 12.9, vtw: 12.3, unit: '', ratio: '0.54×' },
    { key: 'lat', label: '每样本延迟', base: 0.52, fastv: 0.4, vtw: 0.33, unit: 's', ratio: '0.63×' },
  ],
};

/** AAAI 表 5：阈值 η → 选出的 K → SQA_Image 准确率（LLaVA-1.5-7B） */
export const TABLE5 = [
  { eta: 0.006, K: 12, acc: 69.01 },
  { eta: 0.005, K: 13, acc: 69.26 },
  { eta: 0.004, K: 14, acc: 69.46 },
  { eta: 0.003, K: 15, acc: 69.7 },
  { eta: 0.002, K: 15, acc: 69.7 },
  { eta: 0.001, K: 15, acc: 69.7 },
];

/** AAAI 表 6：位置编码处理（LLaVA-1.5-7B） */
export const TABLE6 = [
  { label: 'LLaVA-1.5-7B', sqa: 69.61, mmmu: 35.6, pope: 85.83 },
  { label: 'Rearrange（重排）', sqa: 69.56, mmmu: 35.9, pope: 85.41 },
  { label: 'Keep（保留）', sqa: 69.66, mmmu: 36.3, pope: 85.96 },
];

/** arXiv v3 附录表 9：MME 14 个子任务（只在 arXiv 版） */
export const MME_SUB = ['存在', '计数', '位置', '颜色', 'OCR', '海报', '名人', '场景', '地标', '艺术品', '常识推理', '数值计算', '文本翻译', '代码推理'];
export const TABLE9: { model: string; method: string; label: string; total: number; v: number[] }[] = [
  { model: '7b', method: 'base', label: 'LLaVA-1.5-7B', total: 1866.1, v: [190, 155, 128.33, 170, 140, 146.6, 137.06, 158, 163.75, 119.5, 112.86, 70, 107.5, 67.5] },
  { model: '7b', method: 'fastv', label: '+ FastV', total: 1864.35, v: [180, 155, 133.33, 180, 137.5, 142.52, 138.82, 160, 164.5, 121.25, 116.43, 55, 112.5, 67.5] },
  { model: '7b', method: 'vtw', label: '+ VTW (K=16)', total: 1872.43, v: [190, 160, 128.33, 170, 137.5, 145.58, 135.59, 135.59, 163.75, 123.25, 121.43, 65, 115, 57.5] },
  { model: '13b', method: 'base', label: 'LLaVA-1.5-13B', total: 1827.26, v: [185, 155, 133.33, 170, 125, 160.54, 152.06, 161.25, 170.5, 118.5, 128.57, 42.5, 77.5, 47.5] },
  { model: '13b', method: 'fastv', label: '+ FastV', total: 1855.11, v: [185, 155, 133.33, 175, 132.5, 159.52, 152.82, 161.75, 168.25, 117, 126.43, 42.5, 82.5, 57.5] },
  { model: '13b', method: 'vtw', label: '+ VTW（表中标 K=16）', total: 1828.79, v: [185, 155, 131.67, 175, 125, 157.48, 153.82, 161.25, 170, 118.5, 128.57, 42.5, 77.5, 47.5] },
  { model: 'next', method: 'base', label: 'LLaVA-NeXT-7B', total: 1846.33, v: [195, 135, 143.33, 170, 132.5, 159.52, 142.94, 162.25, 155.75, 123.25, 129.29, 42.5, 100, 55] },
  { model: 'next', method: 'fastv', label: '+ FastV', total: 1786.17, v: [195, 125, 136.67, 170, 117.5, 156.46, 140.29, 162.25, 156.75, 123.75, 130, 32.5, 87.5, 52.5] },
  { model: 'next', method: 'vtw', label: '+ VTW (K=16)', total: 1857.35, v: [195, 135, 133.33, 170, 132.5, 159.52, 144.71, 163, 158.75, 126.25, 129.29, 42.5, 105, 62.5] },
];

/** arXiv v3 附录表 8：其他 MLLM（只比视觉 token 成本） */
export const TABLE8 = [
  { model: 'Qwen2-VL-2B-instruct（28 层）', K: 18, cost: '64%', bench: ['AI2D', 'SQA_Img', 'MMMU_Val', 'MMB_EN', 'POPE', 'MME'], base: [72.02, 77.69, 36.0, 71.9, 87.86, 1880.74], vtw: [71.7, 77.94, 37.0, 70.03, 87.83, 1888.43] },
  { model: 'InternVL2-4B（32 层）', K: 16, cost: '50%', bench: ['AI2D', 'SQA_Img', 'MMMU_Val', 'MMB_EN', 'POPE', 'MME'], base: [78.89, 96.33, 45.77, 77.49, 84.6, 2073.49], vtw: [79.05, 96.23, 45.22, 77.49, 84.31, 2081.02] },
];

/** 官方 README 截图（固定 commit）：LLaVA-1.5-7B，scienceqa_img，2017 题，batch size 1 */
export const README_RUN = {
  n: 2017,
  base: { acc: 0.6961, stderr: 0.0102, time: '08:08', sec: 488, itps: 4.13 },
  vtw: { acc: 0.6971, stderr: 0.0102, time: '05:41', sec: 341, itps: 5.91, K: 15 },
};

/** DivPrune（CVPR 2025）表 1 中 VTW 一行（DivPrune 自己的 TFLOP 口径与指标） */
export const DIVPRUNE_VTW = [
  { model: 'LLaVA-1.5-7B', K: 4, ratio: '18.46%', mmeP: 681, mmeOrig: 1506, pope: 25.35, popeOrig: 85.84, sqa: 65.29, sqaOrig: 69.41 },
  { model: 'LLaVA-1.5-13B', K: 4, ratio: '16.16%', mmeP: 622, mmeOrig: 1522, pope: 0.4, popeOrig: 85.99, sqa: 66.24, sqaOrig: 72.88 },
  { model: 'LLaVA-1.6-7B', K: 3, ratio: '11.23%', mmeP: 606, mmeOrig: 1520, pope: 7.13, popeOrig: 86.38, sqa: 65.74, sqaOrig: 70.15 },
];
