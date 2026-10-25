// TFLOPs 复算：与官方仓库 tflops.py（commit 799e2d9）逐行同口径。
// 论文 Eq.(5) 印刷为 “4μd² − 2μ²d + 2μdm”，而 tflops.py L6 为 “+ 2n²d”。
// 只有 “+” 号能复现 Table 1/2 的数字（本页已逐项核对），因此默认使用 “+”。
import { pyRound } from './maxmin';

export interface ModelPreset {
  id: string;
  label: string;
  d: number;
  m: number;
  T: number;
  /** 各数据集的平均文本 token 数（tflops.py 硬编码） */
  text: number[];
  /** 各数据集的视觉 token 数 */
  visual: number[];
  datasets: string[];
  /** tflops.py 中 DivPrune 的保留比例 r */
  r: number;
  note: string;
}

const IMG_DS = ['COCO', 'Flickr', 'GQA', 'MMB', 'MME', 'MMMU', 'Nocaps', 'OKVQA', 'POPE', 'SQA', 'SEEDB'];
const IMG_TEXT = [15, 15, 23, 83, 25, 113, 15, 39, 21, 91, 57];
const L16_VIS = [2225, 1922, 2239, 1927, 2108, 1882, 2292, 2249, 2250, 1598, 2116];

export const MODELS: ModelPreset[] = [
  {
    id: 'l15-7b',
    label: 'LLaVA 1.5-7B',
    d: 4096,
    m: 11008,
    T: 32,
    text: IMG_TEXT,
    visual: IMG_TEXT.map(() => 576),
    datasets: IMG_DS,
    r: 0.098,
    note: '576 个视觉 token / 图',
  },
  {
    id: 'l15-13b',
    label: 'LLaVA 1.5-13B',
    d: 5120,
    m: 13824,
    T: 40,
    text: IMG_TEXT,
    visual: IMG_TEXT.map(() => 576),
    datasets: IMG_DS,
    r: 0.098,
    note: '576 个视觉 token / 图',
  },
  {
    id: 'l16-7b',
    label: 'LLaVA 1.6-7B',
    d: 4096,
    m: 11008,
    T: 32,
    text: IMG_TEXT,
    visual: L16_VIS,
    datasets: IMG_DS,
    r: 0.098,
    note: '每个数据集的平均视觉 token 数不同（1598–2292）',
  },
  {
    id: 'video-7b',
    label: 'LLaVA-NeXT-Video-7B',
    d: 4096,
    m: 11008,
    T: 32,
    text: [28, 63, 21, 38, 196],
    visual: [1152, 1152, 1152, 1152, 1152],
    datasets: ['ActivityNet', 'SeedBench-V', 'VChatGPT', 'NextQA', 'EgoSchema'],
    r: 0.1,
    note: '8 帧 × 144 = 1152 个视觉 token',
  },
];

export interface FlopOpts {
  /** μ² 项的符号：+1 = 代码 / FastV 口径；−1 = 论文 Eq.(5) 印刷口径 */
  sign: 1 | -1;
  /** FFN 系数：2 = 论文口径；3 = SwiGLU 三矩阵口径（本页外推） */
  ffn: 2 | 3;
  /** 额外计入的前缀文本 token（0 = 论文口径；35 = 代码中 SYS_TOKEN_LEN，本页外推） */
  prefix: number;
}

export const PAPER_OPTS: FlopOpts = { sign: 1, ffn: 2, prefix: 0 };

/** 单层 FLOPs：4nd² ± 2n²d + c·ndm（与 tflops.py find_flop 的括号内一致） */
export function layerFlop(n: number, d: number, m: number, o: FlopOpts): number {
  return 4 * n * d * d + o.sign * 2 * n * n * d + o.ffn * n * d * m;
}

export interface MethodCfg {
  /** 在第 K 层之后剪枝（K = 0 即进入第一层解码器之前） */
  K: number;
  /** 由视觉 token 数 v 计算保留个数 */
  kept: (v: number) => number;
}

/** tflops.py：reduced = int(round((1-r)*v))，保留 = v − reduced */
export function keepByRatio(r: number): (v: number) => number {
  return (v) => v - pyRound((1 - r) * v);
}

export interface FlopResult {
  /** 剪枝后平均 TFLOPs */
  pruned: number;
  /** 原模型平均 TFLOPs */
  full: number;
  /** 平均比例（%）：各数据集比例的算术平均，与 tflops.py 一致 */
  ratio: number;
  perDataset: { name: string; n: number; kept: number; ratio: number; full: number; pruned: number }[];
}

export function computeFlops(model: ModelPreset, cfg: MethodCfg, o: FlopOpts = PAPER_OPTS): FlopResult {
  const { d, m, T } = model;
  const per = model.text.map((t, i) => {
    const v = model.visual[i];
    const N = t + o.prefix;
    const n = N + v;
    const kept = Math.max(0, Math.min(v, cfg.kept(v)));
    const nn = N + kept;
    const full = T * layerFlop(n, d, m, o);
    const K = Math.max(0, Math.min(T, cfg.K));
    const pruned = K * layerFlop(n, d, m, o) + (T - K) * layerFlop(nn, d, m, o);
    return { name: model.datasets[i], n, kept, ratio: (pruned / full) * 100, full: full / 1e12, pruned: pruned / 1e12 };
  });
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    pruned: avg(per.map((p) => p.pruned)),
    full: avg(per.map((p) => p.full)),
    ratio: avg(per.map((p) => p.ratio)),
    perDataset: per,
  };
}

/** 保留规则：按比例 r（tflops.py 的取整方式，逐数据集计算）或固定个数 */
export type KeepRule = { kind: 'ratio'; r: number } | { kind: 'count'; n: number };

export function keepOf(rule: KeepRule): (v: number) => number {
  return rule.kind === 'ratio' ? keepByRatio(rule.r) : () => rule.n;
}

/** 论文表格中可核对的配置（用于“复现 ✓ / 不一致”判定） */
export interface PaperRow {
  id: string;
  model: string;
  method: string;
  where: string;
  K: number;
  rule: KeepRule;
  kept: (v: number) => number;
  keptDesc: string;
  paperTflop: number;
  paperRatio: number;
  /** 只对部分数据集取平均（Table 3 用 MMB/MMMU/POPE/SQA 四列） */
  subset?: number[];
}

export const PAPER_ROWS: PaperRow[] = [
  { id: 't1-ours-7b', model: 'l15-7b', method: 'DivPrune', where: 'Table 1', K: 0, rule: { kind: 'ratio', r: 0.098 }, kept: keepByRatio(0.098), keptDesc: 'r = 0.098 → 保留 56', paperTflop: 0.512, paperRatio: 15.63 },
  { id: 't1-fastv-7b', model: 'l15-7b', method: 'FastV', where: 'Table 1 + supp §5', K: 3, rule: { kind: 'ratio', r: 0.001 }, kept: keepByRatio(0.001), keptDesc: 'K = 3，R = 0.001 按“保留比例”解读 → 保留 1', paperTflop: 0.514, paperRatio: 15.69 },
  { id: 't1-vtw-7b', model: 'l15-7b', method: 'VTW', where: 'Table 1 + supp §5', K: 4, rule: { kind: 'count', n: 0 }, kept: () => 0, keptDesc: 'K = 4，之后撤走全部视觉 token', paperTflop: 0.603, paperRatio: 18.46 },
  { id: 't1-ours-13b', model: 'l15-13b', method: 'DivPrune', where: 'Table 1', K: 0, rule: { kind: 'ratio', r: 0.098 }, kept: keepByRatio(0.098), keptDesc: 'r = 0.098 → 保留 56', paperTflop: 1.002, paperRatio: 15.71 },
  { id: 't1-fastv-13b', model: 'l15-13b', method: 'FastV', where: 'Table 1 + supp §5', K: 3, rule: { kind: 'ratio', r: 0.023 }, kept: keepByRatio(0.023), keptDesc: 'K = 3，R = 0.023 按“保留比例”解读 → 保留 13', paperTflop: 1.003, paperRatio: 15.73 },
  { id: 't1-vtw-13b', model: 'l15-13b', method: 'VTW', where: 'Table 1 + supp §5', K: 4, rule: { kind: 'count', n: 0 }, kept: () => 0, keptDesc: 'K = 4，之后撤走全部视觉 token', paperTflop: 1.03, paperRatio: 16.16 },
  { id: 't1-ours-16', model: 'l16-7b', method: 'DivPrune', where: 'Table 1', K: 0, rule: { kind: 'ratio', r: 0.098 }, kept: keepByRatio(0.098), keptDesc: 'r = 0.098（每个数据集按各自视觉 token 数计算）', paperTflop: 1.266, paperRatio: 10.79 },
  { id: 't1-fastv-16', model: 'l16-7b', method: 'FastV', where: 'Table 1 + supp §5', K: 3, rule: { kind: 'ratio', r: 0.001 }, kept: keepByRatio(0.001), keptDesc: 'K = 3，R = 0.001 按“保留比例”解读', paperTflop: 1.327, paperRatio: 11.3 },
  { id: 't1-vtw-16', model: 'l16-7b', method: 'VTW', where: 'Table 1 + supp §5', K: 3, rule: { kind: 'count', n: 0 }, kept: () => 0, keptDesc: 'K = 3，之后撤走全部视觉 token', paperTflop: 1.318, paperRatio: 11.23 },
  { id: 't2-ours', model: 'video-7b', method: 'DivPrune', where: 'Table 2', K: 0, rule: { kind: 'ratio', r: 0.1 }, kept: keepByRatio(0.1), keptDesc: 'r = 0.1 → 保留 115', paperTflop: 0.937, paperRatio: 14.1 },
  { id: 't2-fastv', model: 'video-7b', method: 'FastV', where: 'Table 2', K: 3, rule: { kind: 'ratio', r: 0.001 }, kept: keepByRatio(0.001), keptDesc: 'K = 3，R = 0.001（论文未单独给出视频模型的超参数）', paperTflop: 0.943, paperRatio: 14.2 },
  { id: 't2-vtw', model: 'video-7b', method: 'VTW', where: 'Table 2', K: 4, rule: { kind: 'count', n: 0 }, kept: () => 0, keptDesc: 'K = 4（论文未单独给出视频模型的超参数）', paperTflop: 1.124, paperRatio: 16.97 },
  { id: 't3-l0', model: 'l15-7b', method: 'DivPrune · Layer 0', where: 'Table 3', K: 0, rule: { kind: 'count', n: 56 }, kept: () => 56, keptDesc: '保留 56（= Table 1 同配置）', paperTflop: NaN, paperRatio: 19.61, subset: [3, 5, 8, 9] },
  { id: 't3-l1', model: 'l15-7b', method: 'DivPrune · Layer 1', where: 'Table 3', K: 1, rule: { kind: 'count', n: 39 }, kept: () => 39, keptDesc: '保留 39（本页按 Eq.(5) 反推）', paperTflop: NaN, paperRatio: 19.65, subset: [3, 5, 8, 9] },
  { id: 't3-l2', model: 'l15-7b', method: 'DivPrune · Layer 2', where: 'Table 3', K: 2, rule: { kind: 'count', n: 21 }, kept: () => 21, keptDesc: '保留 21（本页按 Eq.(5) 反推）', paperTflop: NaN, paperRatio: 19.7, subset: [3, 5, 8, 9] },
  { id: 't3-l3', model: 'l15-7b', method: 'DivPrune · Layer 3', where: 'Table 3', K: 3, rule: { kind: 'count', n: 2 }, kept: () => 2, keptDesc: '保留 2（本页按 Eq.(5) 反推）', paperTflop: NaN, paperRatio: 19.8, subset: [3, 5, 8, 9] },
];

export function getModel(id: string): ModelPreset {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}

/** 取数据集子集后的模型 */
export function subsetModel(model: ModelPreset, idx?: number[]): ModelPreset {
  if (!idx) return model;
  return {
    ...model,
    text: idx.map((i) => model.text[i]),
    visual: idx.map((i) => model.visual[i]),
    datasets: idx.map((i) => model.datasets[i]),
  };
}

/** 固定预算下，第 K 层剪枝最多能保留多少个视觉 token（本页外推） */
export function maxKeptForBudget(model: ModelPreset, K: number, budgetRatio: number, o: FlopOpts = PAPER_OPTS): number {
  let best = 0;
  const vMax = Math.max(...model.visual);
  for (let kept = 0; kept <= vMax; kept++) {
    const r = computeFlops(model, { K, kept: () => kept }, o).ratio;
    if (r <= budgetRatio + 1e-9) best = kept;
    else break;
  }
  return best;
}

export function fmt(x: number, digits = 2): string {
  if (!Number.isFinite(x)) return '—';
  return x.toFixed(digits);
}
