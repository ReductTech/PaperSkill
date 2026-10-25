// FLOPs 复算：按论文 Eq. (1) 的每层复杂度 Ω(s) = 2s²h + 12sh²（MHA + FFN，FFN 放大 4 倍）。
// 本页口径（推断，论文未说明）：Eq. (1) 计的是乘加次数，表中 TFLOPs ≈ 2 × ΣΩ（1 次乘加 = 2 次浮点运算）。
// 依据：从表 2 的 8.48 TFLOPs 反推 LLaVA-1.5-7B 的平均输入长度 ≈ 641，与 576 个视觉 token + 约 65 个文字 token 相符。

export interface ModelSpec {
  id: string;
  label: string;
  /** 隐藏维度 h */
  h: number;
  /** 解码层数 N */
  N: number;
  note: string;
}

export const MODELS: ModelSpec[] = [
  { id: 'l15-7b', label: 'LLaVA-1.5-7B', h: 4096, N: 32, note: 'Vicuna-7B：h = 4096，32 层' },
  { id: 'l15-13b', label: 'LLaVA-1.5-13B', h: 5120, N: 40, note: 'Vicuna-13B：h = 5120，40 层' },
  { id: 'next-7b', label: 'LLaVA-NeXT-7B', h: 4096, N: 32, note: 'Vicuna-7B 底座；视觉 token 数随图片分辨率变化' },
  { id: 'vllava-7b', label: 'Video-LLaVA-7B', h: 4096, N: 32, note: '表 3 只计视觉 token 的 FLOPs' },
  { id: 'qwen2vl-2b', label: 'Qwen2-VL-2B', h: 1536, N: 28, note: 'arXiv 附录表 8：28 层，只比视觉 token 成本' },
  { id: 'internvl2-4b', label: 'InternVL2-4B', h: 3072, N: 32, note: 'arXiv 附录表 8：32 层，只比视觉 token 成本' },
];

export const modelOf = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0];

export type Method = 'base' | 'vtw' | 'fastv';
/** code：前 K 层带视觉（官方代码 layer_idx == K 时撤出，0 起计）；eq5：前 K−1 层带视觉（Eq. (5) 字面） */
export type LayerConv = 'code' | 'eq5';
/** all：全部 token 的 Eq.(1)×2；vision：只计视觉 token（表 3、附录表 8 的口径，线性近似） */
export type Scope = 'all' | 'vision';

export interface FlopsConfig {
  model: string;
  /** 平均输入长度 s（含视觉 token） */
  s: number;
  /** 视觉 token 数 V */
  V: number;
  method: Method;
  K: number;
  /** FastV 剪掉的视觉 token 比例 R */
  R: number;
  conv: LayerConv;
  scope: Scope;
}

export const omega = (s: number, h: number) => 2 * s * s * h + 12 * s * h * h;

/** 带视觉 token 的完整层数 */
export function fullLayers(cfg: FlopsConfig): number {
  const m = modelOf(cfg.model);
  if (cfg.method === 'base') return m.N;
  if (cfg.method === 'fastv') return Math.min(m.N, cfg.K);
  const k = cfg.conv === 'code' ? cfg.K : cfg.K - 1;
  return Math.max(0, Math.min(m.N, k));
}

export interface FlopsResult {
  /** 方法的 TFLOPs（scope = vision 时为 null） */
  tflops: number | null;
  /** 原模型的 TFLOPs（scope = vision 时为 null） */
  baseTflops: number | null;
  /** 比例（%） */
  ratio: number;
  full: number;
}

export function computeFlops(cfg: FlopsConfig): FlopsResult {
  const m = modelOf(cfg.model);
  const full = fullLayers(cfg);
  const V = Math.max(0, Math.min(cfg.V, cfg.s));
  if (cfg.scope === 'vision') {
    // 只计视觉 token：每层成本 ∝ 该层视觉 token 数
    let kept = 0;
    if (cfg.method === 'base') kept = m.N;
    else if (cfg.method === 'vtw') kept = full;
    else kept = full + (m.N - full) * (1 - cfg.R);
    return { tflops: null, baseTflops: null, ratio: (100 * kept) / m.N, full };
  }
  const base = 2 * m.N * omega(cfg.s, m.h);
  let tot = base;
  if (cfg.method === 'vtw') tot = 2 * (full * omega(cfg.s, m.h) + (m.N - full) * omega(cfg.s - V, m.h));
  if (cfg.method === 'fastv') tot = 2 * (full * omega(cfg.s, m.h) + (m.N - full) * omega(cfg.s - V * cfg.R, m.h));
  return { tflops: tot / 1e12, baseTflops: base / 1e12, ratio: (100 * tot) / base, full };
}

export type CheckKind = 'match' | 'mismatch' | 'anchor' | 'other' | 'none';

export interface Preset {
  id: string;
  label: string;
  where: string;
  cfg: FlopsConfig;
  /** 论文报告的 TFLOPs 与比例 */
  paperTf?: number;
  paperRatio?: number;
  /** 这一行是否被用来反推 s / V（反推锚点，不能算独立核对） */
  anchor?: string;
  /** 口径与 VTW 原文不同，只做外推、不做核对 */
  foreign?: string;
}

// 反推值（公式外推）：
// LLaVA-1.5-7B：2·32·Ω(s) = 8.48e12 → s ≈ 641.4；LLaVA-1.5-13B：2·40·Ω(s) = 16.50e12 → s ≈ 642.2；
// LLaVA-NeXT-7B（表 2，MME）：28.73 与 14.80 两个数联立 → s ≈ 2057.5，V ≈ 1990.2；
// LLaVA-NeXT-7B（表 4，SQA）：22.9 与 12.3 联立 → s ≈ 1664.5，V ≈ 1533.3。
export const PRESETS: Preset[] = [
  {
    id: 't2-7b-vtw',
    label: '表 2 · 7B · VTW K=16',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 4.68,
    paperRatio: 55.19,
    anchor: 's = 641.4 由同表原模型 8.48 TFLOPs 反推；本行比例是独立核对',
  },
  {
    id: 't2-7b-fastv',
    label: '表 2 · 7B · FastV',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-7b', s: 641.4, V: 576, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 4.91,
    paperRatio: 57.9,
  },
  {
    id: 't2-13b-vtw',
    label: '表 2 · 13B · VTW K=20',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-13b', s: 642.2, V: 576, method: 'vtw', K: 20, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 9.1,
    paperRatio: 55.15,
    anchor: 's = 642.2 由同表原模型 16.50 TFLOPs 反推；本行比例是独立核对',
  },
  {
    id: 't2-13b-fastv',
    label: '表 2 · 13B · FastV',
    where: 'AAAI 表 2',
    cfg: { model: 'l15-13b', s: 642.2, V: 576, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 9.56,
    paperRatio: 57.94,
  },
  {
    id: 't2-next-vtw',
    label: '表 2 · NeXT · VTW K=16',
    where: 'AAAI 表 2',
    cfg: { model: 'next-7b', s: 2057.5, V: 1990.2, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 14.8,
    paperRatio: 51.51,
    anchor: 's、V 都由本行与原模型 28.73 联立反推，因此本行“吻合”是构造出来的，不算核对',
  },
  {
    id: 't2-next-fastv',
    label: '表 2 · NeXT · FastV',
    where: 'AAAI 表 2',
    cfg: { model: 'next-7b', s: 2057.5, V: 1990.2, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 15.67,
    paperRatio: 54.54,
  },
  {
    id: 't4-next-vtw',
    label: '表 4 · NeXT · SQA · VTW',
    where: 'AAAI 表 4',
    cfg: { model: 'next-7b', s: 1664.5, V: 1533.3, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 12.3,
    paperRatio: 53.71,
    anchor: 's、V 由本行（12.3）与原模型（22.9）联立反推，不算核对；论文写作 0.54×',
  },
  {
    id: 't4-next-fastv',
    label: '表 4 · NeXT · SQA · FastV',
    where: 'AAAI 表 4',
    cfg: { model: 'next-7b', s: 1664.5, V: 1533.3, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'all' },
    paperTf: 12.9,
    paperRatio: 56.33,
  },
  {
    id: 't3-video-vtw',
    label: '表 3 · 视频 · VTW K=16',
    where: 'AAAI 表 3（只计视觉 token）',
    cfg: { model: 'vllava-7b', s: 2048, V: 2048, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 50.0,
  },
  {
    id: 't3-video-fastv',
    label: '表 3 · 视频 · FastV',
    where: 'AAAI 表 3（只计视觉 token）',
    cfg: { model: 'vllava-7b', s: 2048, V: 2048, method: 'fastv', K: 2, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 53.13,
  },
  {
    id: 'ax8-qwen',
    label: '附录表 8 · Qwen2-VL-2B K=18',
    where: 'arXiv v3 附录表 8',
    cfg: { model: 'qwen2vl-2b', s: 1000, V: 1000, method: 'vtw', K: 18, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 64,
  },
  {
    id: 'ax8-intern',
    label: '附录表 8 · InternVL2-4B K=16',
    where: 'arXiv v3 附录表 8',
    cfg: { model: 'internvl2-4b', s: 1000, V: 1000, method: 'vtw', K: 16, R: 0.5, conv: 'code', scope: 'vision' },
    paperRatio: 50,
  },
  {
    id: 'dp-vtw-7b',
    label: 'DivPrune 里的 VTW · 7B K=4',
    where: 'DivPrune（CVPR 2025）表 1 + 补充材料 §5',
    cfg: { model: 'l15-7b', s: 641.4, V: 576, method: 'vtw', K: 4, R: 0.5, conv: 'code', scope: 'all' },
    foreign: 'DivPrune 用自己的 TFLOP 公式和数据集，报告 18.46%；与本页按 VTW 口径算出的数字不可直接比较',
  },
];

export const presetOf = (id: string) => PRESETS.find((p) => p.id === id);

/** 与论文数字比较：比例差 ≤ 0.01 个百分点、TFLOPs 差 ≤ 0.005 视为一致（舍入范围内） */
export function checkAgainst(p: Preset | undefined, r: FlopsResult, cfg: FlopsConfig): { kind: CheckKind; text: string } {
  if (!p) return { kind: 'none', text: '自定义配置：论文没有报告这个配置，结果属于公式外推。' };
  const same = JSON.stringify(p.cfg) === JSON.stringify(cfg);
  if (!same) return { kind: 'none', text: '已偏离论文配置：结果属于公式外推，不与论文数字比较。' };
  if (p.foreign) return { kind: 'other', text: p.foreign };
  if (p.paperRatio === undefined) return { kind: 'none', text: '论文没有报告这一配置。' };
  const dr = r.ratio - p.paperRatio;
  const roundTol = p.paperRatio % 1 === 0 ? 0.5 : 0.01; // 论文只给到整数百分比时按整数舍入比较
  const okRatio = Math.abs(dr) <= roundTol + 1e-9;
  const okTf = p.paperTf === undefined || r.tflops === null || Math.abs(r.tflops - p.paperTf) <= 0.005 + 1e-9;
  const sign = dr >= 0 ? '+' : '−';
  if (p.anchor && /不算核对/.test(p.anchor)) {
    return { kind: 'anchor', text: `反推锚点：${p.anchor}。` };
  }
  if (okRatio && okTf) return { kind: 'match', text: `与论文一致（舍入范围内）：本页 ${r.ratio.toFixed(2)}%，论文 ${p.paperRatio}%。` };
  return {
    kind: 'mismatch',
    text: `与本页复算不一致，原因未知：本页 ${r.ratio.toFixed(2)}%，论文 ${p.paperRatio}%（差 ${sign}${Math.abs(dr).toFixed(2)} 个百分点）。`,
  };
}
