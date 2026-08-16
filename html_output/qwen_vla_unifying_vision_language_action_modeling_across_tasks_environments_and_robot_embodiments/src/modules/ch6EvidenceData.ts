/** Centralized paper evidence numbers for §6 modules. */

export type BenchmarkId = 'libero' | 'robocasa' | 'simpler' | 'robotwin-e' | 'robotwin-h';

export interface ModelScores {
  name: string;
  id: string;
  isQwen?: boolean;
  isGeneralist?: boolean;
  scores: Partial<Record<BenchmarkId, number | null>>;
}

export const BENCHMARKS: { id: BenchmarkId; label: string; scene: string }[] = [
  { id: 'libero', label: 'LIBERO', scene: 'tabletop' },
  { id: 'robocasa', label: 'RoboCasa', scene: 'kitchen' },
  { id: 'simpler', label: 'Simpler', scene: 'widowx' },
  { id: 'robotwin-e', label: 'RoboTwin-E', scene: 'dual-arm' },
  { id: 'robotwin-h', label: 'RoboTwin-H', scene: 'dual-arm-hard' },
];

export const TABLE4_MODELS: ModelScores[] = [
  { id: 'pi0', name: 'π0', scores: { libero: 94.4, robocasa: null, simpler: null, 'robotwin-e': 65.9, 'robotwin-h': 58.4 } },
  { id: 'starvla', name: 'StarVLA-OFT', scores: { libero: 96.6, robocasa: 48.8, simpler: 64.6, 'robotwin-e': 50.4, 'robotwin-h': null } },
  { id: 'groot', name: 'GR00T N1.6', scores: { libero: 97.2, robocasa: 49.9, simpler: 63.2, 'robotwin-e': 47.6, 'robotwin-h': null } },
  { id: 'pi05', name: 'π0.5', scores: { libero: 97.6, robocasa: 37.0, simpler: 46.9, 'robotwin-e': 82.7, 'robotwin-h': 76.8 } },
  { id: 'abot', name: 'ABot-M0', scores: { libero: 98.6, robocasa: 58.3, simpler: null, 'robotwin-e': 86.0, 'robotwin-h': 85.0 } },
  { id: 'being', name: 'Being-H0.5', scores: { libero: 97.6, robocasa: 53.3, simpler: null, 'robotwin-e': null, 'robotwin-h': null } },
  { id: 'qwen-base', name: 'Qwen-VLA-Base', isQwen: true, isGeneralist: true, scores: { libero: 90.8, robocasa: 40.4, simpler: 64.3, 'robotwin-e': 64.3, 'robotwin-h': 66.4 } },
  { id: 'qwen-instruct', name: 'Qwen-VLA-Instruct', isQwen: true, isGeneralist: true, scores: { libero: 97.9, robocasa: 56.7, simpler: 73.7, 'robotwin-e': 86.1, 'robotwin-h': 87.2 } },
];

export type OodCategory = 'color' | 'instance' | 'position' | 'background' | 'instruction';

export const OOD_CATEGORIES: { id: OodCategory; zh: string; en: string }[] = [
  { id: 'color', zh: '颜色泛化', en: 'Color' },
  { id: 'instance', zh: '实例泛化', en: 'Instance' },
  { id: 'position', zh: '位置泛化', en: 'Position' },
  { id: 'background', zh: '背景泛化', en: 'Background' },
  { id: 'instruction', zh: '指令泛化', en: 'Instruction' },
];

export interface OodModel {
  id: string;
  name: string;
  isQwen?: boolean;
  variant?: string;
  scores: Record<OodCategory, number>;
  avg: number;
}

export const OOD_MODELS: OodModel[] = [
  { id: 'groot', name: 'GR00T N1.6', scores: { color: 46.2, instance: 38.5, position: 3.8, background: 19.2, instruction: 19.2 }, avg: 25.4 },
  { id: 'pi05', name: 'π0.5', scores: { color: 57.7, instance: 61.5, position: 19.2, background: 26.9, instruction: 42.3 }, avg: 41.5 },
  { id: 'qwen-wo', name: 'Qwen w/o pretrain', isQwen: true, variant: 'Qwen-VLA-aloha', scores: { color: 42.3, instance: 30.8, position: 34.6, background: 30.8, instruction: 42.3 }, avg: 36.2 },
  { id: 'qwen-w', name: 'Qwen w/ pretrain', isQwen: true, variant: 'Qwen-VLA-aloha', scores: { color: 88.5, instance: 76.9, position: 53.8, background: 80.8, instruction: 84.6 }, avg: 76.9 },
];

export const NAV_R2R = { ne: 5.1, os: 69.0, sr: 57.5, spl: 51.2 };
export const NAV_RXR = { ne: 5.8, sr: 59.6, spl: 47.8, ndtw: 57.1 };

export const DOMINO_MODELS = [
  { id: 'qwen-base', name: 'Qwen-VLA-Base', sr: 21.1, ms: 37.4, zeroShot: true },
  { id: 'qwen-instruct', name: 'Qwen-VLA-Instruct', sr: 26.6, ms: 39.5, zeroShot: true, badge: '零样本动态操纵' },
  { id: 'lingbot', name: 'LingBot-VA', sr: 24.1, ms: 36.1, zeroShot: true },
  { id: 'pi05', name: 'π0.5', sr: 7.5, ms: 20.4, zeroShot: true },
  { id: 'openvla', name: 'OpenVLA-OFT', sr: 6.7, ms: 20.0, zeroShot: true },
];

export function getBenchmarkScore(model: ModelScores, bench: BenchmarkId): number | null {
  const v = model.scores[bench];
  return v === undefined ? null : v;
}

export function getSpecialistsForBenchmark(bench: BenchmarkId): { model: ModelScores; score: number }[] {
  return TABLE4_MODELS.filter((m) => !m.isQwen)
    .map((m) => ({ model: m, score: getBenchmarkScore(m, bench) }))
    .filter((x): x is { model: ModelScores; score: number } => x.score !== null);
}

export function getBestSpecialist(bench: BenchmarkId): { model: ModelScores; score: number } | null {
  const list = getSpecialistsForBenchmark(bench);
  if (!list.length) return null;
  return list.reduce((a, b) => (b.score > a.score ? b : a));
}

export function getQwenInstructScore(bench: BenchmarkId): number | null {
  const q = TABLE4_MODELS.find((m) => m.id === 'qwen-instruct');
  return q ? getBenchmarkScore(q, bench) : null;
}

export function computeDelta(bench: BenchmarkId): { qwen: number; best: number; bestName: string; delta: number } | null {
  const qwen = getQwenInstructScore(bench);
  const best = getBestSpecialist(bench);
  if (qwen === null || !best) return null;
  return { qwen, best: best.score, bestName: best.model.name, delta: qwen - best.score };
}

/** Smooth count-up hook helper */
export function tweenValue(from: number, to: number, t: number): number {
  const eased = 1 - (1 - t) ** 3;
  return from + (to - from) * eased;
}
