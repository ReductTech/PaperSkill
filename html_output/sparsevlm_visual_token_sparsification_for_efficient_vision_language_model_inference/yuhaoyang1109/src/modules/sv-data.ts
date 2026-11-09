// 论文数字（ICML 2025 正式版，PMLR 267）与固定提交代码常数。所有交互读数都从这里取，不在模块里另写一份。

export const COMMIT = '734d9003879689713a132b83297dfad060a5c9af';
export const VIDEO_COMMIT = 'f05b898452f81a43590a8bba67dd3cfae76a748d';
export const videoCode = (path: string, a: number) => `${REPO}/blob/${VIDEO_COMMIT}/${path}#L${a}`;
export const REPO = 'https://github.com/Gumpest/SparseVLMs';
export const code = (path: string, a: number, b?: number) => `${REPO}/blob/${COMMIT}/${path}#L${a}${b ? `-L${b}` : ''}`;
export const PMLR_PDF = 'https://raw.githubusercontent.com/mlresearch/v267/main/assets/zhang25s/zhang25s.pdf';
export const PMLR_PAGE = 'https://proceedings.mlr.press/v267/zhang25s.html';

// ---------------------------------------------------------------- 表 1（p.6）
export const BENCHES = ['GQA', 'MMB', 'MME', 'POPE', 'SQA', 'SEED', 'VQAText', 'MMVet'] as const;
export type Bench = (typeof BENCHES)[number];
export const VANILLA = { raw: [61.9, 64.6, 1864, 85.9, 69.5, 60.3, 58.3, 30.9], flops: 4.62, lat: 57.82 };
export type Method = 'ToMe' | 'FastV' | 'PDrop' | 'SparseVLM';
export const METHODS: Method[] = ['ToMe', 'FastV', 'PDrop', 'SparseVLM'];
export const METHOD_VENUE: Record<Method, string> = { ToMe: 'ICLR23', FastV: 'ECCV24', PDrop: 'CVPR25', SparseVLM: 'ICML25' };
export type Budget = 192 | 128 | 64;
export const BUDGETS: Budget[] = [192, 128, 64];
export interface Row {
  raw: number[];
  pct: number[];
  avg: number;
  flops: number;
  lat: number;
}
export const TABLE1: Record<Budget, Record<Method, Row>> = {
  192: {
    ToMe: { raw: [54.3, 60.5, 1563, 72.4, 65.2, 53.1, 52.1, 27.9], pct: [87.7, 93.5, 83.9, 84.3, 93.8, 88.1, 89.5, 90.3], avg: 88.9, flops: 2.05, lat: 34.06 },
    FastV: { raw: [52.6, 61.0, 1605, 64.8, 69.1, 52.1, 52.5, 26.7], pct: [85.0, 94.4, 86.1, 75.4, 99.4, 86.4, 90.1, 86.4], avg: 87.9, flops: 2.11, lat: 34.87 },
    PDrop: { raw: [57.1, 63.2, 1766, 82.3, 70.2, 54.7, 56.1, 30.5], pct: [92.2, 97.8, 94.7, 95.8, 101.0, 90.7, 96.2, 98.7], avg: 95.9, flops: 2.03, lat: 36.74 },
    SparseVLM: { raw: [59.5, 64.1, 1787, 85.3, 68.7, 58.7, 57.8, 33.1], pct: [96.1, 99.2, 95.9, 99.3, 98.8, 97.3, 99.1, 107.1], avg: 99.1, flops: 2.14, lat: 36.5 },
  },
  128: {
    ToMe: { raw: [52.4, 53.3, 1343, 62.8, 59.6, 50.9, 49.1, 27.2], pct: [84.7, 82.4, 72.1, 73.1, 85.8, 84.4, 84.4, 88.0], avg: 81.9, flops: 1.62, lat: 30.0 },
    FastV: { raw: [49.6, 56.1, 1490, 53.4, 68.6, 48.1, 50.5, 26.3], pct: [80.1, 86.8, 79.9, 62.2, 98.7, 79.8, 86.6, 85.1], avg: 82.4, flops: 1.7, lat: 30.7 },
    PDrop: { raw: [56.0, 61.1, 1664, 82.3, 69.9, 53.3, 55.1, 30.8], pct: [90.5, 95.4, 89.3, 95.8, 100.6, 88.4, 94.5, 99.7], avg: 94.3, flops: 1.62, lat: 37.77 },
    SparseVLM: { raw: [58.4, 64.5, 1746, 85.0, 68.6, 58.2, 56.7, 29.0], pct: [94.3, 99.8, 93.7, 99.0, 98.7, 96.5, 97.3, 93.9], avg: 96.7, flops: 1.72, lat: 33.28 },
  },
  64: {
    ToMe: { raw: [48.6, 43.7, 1138, 52.5, 50.0, 44.0, 45.3, 24.1], pct: [78.5, 67.5, 61.1, 61.1, 71.9, 73.0, 77.8, 78.0], avg: 71.1, flops: 1.19, lat: 26.52 },
    FastV: { raw: [46.1, 47.2, 1255, 38.2, 68.7, 43.7, 47.8, 19.6], pct: [74.5, 73.1, 67.3, 44.5, 98.8, 72.5, 82.0, 63.4], avg: 72.0, flops: 1.29, lat: 27.3 },
    PDrop: { raw: [41.9, 33.3, 1092, 55.9, 69.2, 40.0, 45.9, 30.7], pct: [67.7, 51.6, 58.6, 65.1, 99.6, 66.3, 78.7, 99.4], avg: 73.4, flops: 1.18, lat: 43.41 },
    SparseVLM: { raw: [53.8, 60.1, 1589, 77.5, 69.8, 52.2, 53.4, 24.9], pct: [86.9, 93.0, 85.2, 90.2, 100.4, 86.6, 91.6, 80.6], avg: 89.3, flops: 1.3, lat: 29.89 },
  },
};

/** 本页复算：原值 / 原模型 × 100，与表中百分比相差超过 0.15 个点的格子 */
export function pctMismatch(b: Budget, m: Method): { i: number; calc: number; paper: number }[] {
  const r = TABLE1[b][m];
  return r.raw
    .map((v, i) => ({ i, calc: (v / VANILLA.raw[i]) * 100, paper: r.pct[i] }))
    .filter((x) => Math.abs(x.calc - x.paper) > 0.15);
}
export const avgOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// ---------------------------------------------------------------- 表 2（p.6）Qwen2-VL
export const TABLE2 = [
  { tokens: '动态（约 1311–1326）', mmb: 80.5, pope: 86.4, vqa: 84.3, avg: 83.7 },
  { tokens: '600', mmb: 79.6, pope: 86.5, vqa: 80.3, avg: 82.1 },
  { tokens: '500', mmb: 78.8, pope: 86.3, vqa: 79.0, avg: 81.4 },
  { tokens: '400', mmb: 79.0, pope: 85.8, vqa: 77.1, avg: 80.7 },
];

// ---------------------------------------------------------------- 表 3（p.7）Video-LLaVA，2048 → 194
export const VIDEO_SETS = ['TGIF', 'MSVD', 'MSRVTT', 'ActivityNet'] as const;
export const TABLE3 = {
  base: { acc: [18.9, 72.0, 57.1, 43.6], score: [2.54, 3.95, 3.45, 3.81], avgAcc: 47.9, avgScore: 3.44 },
  FastV: { acc: [10.2, 58.3, 52.3, 41.3], score: [2.29, 3.62, 3.42, 3.76], avgAcc: 40.5, avgScore: 3.27, pct: [54.0, 81.0, 91.6, 94.7] },
  SparseVLM: { acc: [14.9, 71.7, 56.1, 45.1], score: [2.41, 3.94, 3.43, 3.81], avgAcc: 47.0, avgScore: 3.4, pct: [78.8, 99.6, 98.3, 103.4] },
};

// ---------------------------------------------------------------- 图 5（p.7）评分员消融，LLaVA-7B，64 档（图上读数）
export const FIG5 = {
  TextVQA: { all: 52.6, text: 53.0, raters: 53.4 },
  POPE: { all: 66.1, text: 74.8, raters: 77.5 },
};

// ---------------------------------------------------------------- 表 4（p.8）回收（TR）消融，LLaVA-7B
export const TABLE4 = {
  tokens: [64, 96, 128, 192],
  GQA: { base: [52.2, 55.2, 58.1, 59.4], tr: [53.8, 56.4, 58.4, 59.5], avgBase: 56.2, avgTr: 57.0 },
  POPE: { base: [72.8, 77.5, 83.7, 85.2], tr: [77.5, 81.9, 85.0, 85.3], avgBase: 79.8, avgTr: 82.4 },
};

// ---------------------------------------------------------------- VisionZip（CVPR 2025）表 1 引用的 SparseVLM(2024.10)
// 列集合与正式版不同（多 VQAv2、MMMU、LLaVA-B），只取两边都有的 8 列并排展示，不跨版本比较平均分。
export const VZ_CITED: Record<Budget, { raw: (number | null)[]; avg: number }> = {
  192: { raw: [57.6, 62.5, 1721, 83.6, 69.1, 55.8, 56.1, 31.5], avg: 96.4 },
  128: { raw: [56.0, 60.0, 1696, 80.5, 67.1, 53.4, 54.9, 30.0], avg: 93.4 },
  64: { raw: [52.7, 56.2, 1505, 75.1, 62.2, 51.1, 51.8, 23.3], avg: 85.8 },
};
export const VZ_VANILLA = [61.9, 64.7, 1862, 85.9, 69.5, 58.6, 58.2, 31.1];

// ---------------------------------------------------------------- 代码常数（score.py / modelling_sparse_llama.py）
export const PRUNE_LAYERS = [2, 6, 15];
export const SCHEDULE: Record<Budget, number[]> = { 192: [300, 200, 110], 128: [303, 110, 36], 64: [66, 30, 17] };
export const RECYCLE_RATIO = 0.3;
export const CLUSTER_DIV = 10;
export const N_LAYERS = 32;
export const D_MODEL = 4096;
export const D_FFN = 11008;

export interface LayerStep {
  layer: number;
  /** 进入该层计算的视觉 token 数 */
  enter: number;
  /** 该层处理后（代码记录 num_token 时）的视觉 token 数 */
  after: number;
  kept?: number;
  deleted?: number;
  recycled?: number;
  clusters?: number;
}

/** 按代码逐层推算：剪枝层先算完整一层，再按配额保留、回收 30%、每 10 个聚 1 簇（向下取整后 +1）。 */
export function scheduleSteps(keep: number[], v0 = 576): LayerStep[] {
  let v = v0;
  const out: LayerStep[] = [];
  for (let l = 0; l < N_LAYERS; l++) {
    const enter = v;
    const at = PRUNE_LAYERS.indexOf(l);
    if (at >= 0) {
      const kept = Math.min(keep[at], v - 1);
      const deleted = v - kept;
      const recycled = Math.floor(deleted * RECYCLE_RATIO) + 1;
      const clusters = Math.floor(recycled / CLUSTER_DIV) + 1;
      v = kept + clusters;
      out.push({ layer: l, enter, after: v, kept, deleted, recycled, clusters });
    } else out.push({ layer: l, enter, after: v });
  }
  return out;
}
export const codeAvg = (s: LayerStep[]) => avgOf(s.map((x) => x.after));
export const enterAvg = (s: LayerStep[]) => avgOf(s.map((x) => x.enter));

/** 代码里的每层 FLOPs 计数式（modelling_sparse_llama.py 第 221 行）：4nd² + 2n²d + 3ndm */
export const layerFlops = (n: number, d = D_MODEL, m = D_FFN) => 4 * n * d * d + 2 * n * n * d + 3 * n * d * m;
/** 整次预填充的理论 FLOPs（T）：nonVis 为图像之外的 token 数（系统 + 问题 + 模板） */
export function prefillTFlops(visPerLayer: number[], nonVis: number) {
  return visPerLayer.reduce((a, v) => a + layerFlops(v + nonVis), 0) / 1e12;
}
/** 为对齐原模型 4.62 T 反推的非视觉 token 数（本页假设） */
export const NONVIS_FIT = 118;

/** LLaVA-7B 每个 token 的 KV Cache：2（K、V）× 32 层 × 4096 × 2 字节（fp16） */
export const KV_BYTES_PER_TOKEN_ALL_LAYERS = 2 * 32 * 4096 * 2;
