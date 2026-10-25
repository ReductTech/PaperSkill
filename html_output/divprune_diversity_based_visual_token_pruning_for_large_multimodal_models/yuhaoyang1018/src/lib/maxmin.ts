// Max-Min 多样性选择的教学实现（纯函数，无 React 依赖）。
// 与论文 Algorithm 1 对应：第一阶段选“最近邻距离最大”的 token，第二阶段反复选
// “到已选集合最近距离最大”的候选。页面动画中的点云是二维教学示意，真实实现是
// 4096 维投影层输出上的余弦距离（见 llava_arch.py L147–171）。

export interface Pt {
  x: number;
  y: number;
  /** 所属簇（仅教学示意用） */
  c: number;
}

export type DistFn = (a: number, b: number) => number;

/** 可复现的伪随机数（mulberry32） */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number): number {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface ClusterSpec {
  cx: number;
  cy: number;
  sx: number;
  sy: number;
  n: number;
}

/** 生成成簇的二维点云（坐标约在 [0,1]） */
export function makeCloud(seed: number, specs: ClusterSpec[]): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  specs.forEach((s, c) => {
    for (let i = 0; i < s.n; i++) {
      const x = Math.min(0.98, Math.max(0.02, s.cx + gauss(r) * s.sx));
      const y = Math.min(0.98, Math.max(0.02, s.cy + gauss(r) * s.sy));
      pts.push({ x, y, c });
    }
  });
  return pts;
}

/** 均匀随机点 */
export function makeUniform(seed: number, n: number, margin = 0.08): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    pts.push({ x: margin + r() * (1 - 2 * margin), y: margin + r() * (1 - 2 * margin), c: 0 });
  }
  return pts;
}

export function euclidOf(pts: Pt[]): DistFn {
  return (a, b) => Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y);
}

/** 第一阶段：每个候选到“其他候选”的最近距离（i ≠ j），对应 Algorithm 1 第 5–9 行 */
export function stage1Scores(n: number, d: DistFn): { D: number[]; nn: number[] } {
  const D: number[] = [];
  const nn: number[] = [];
  for (let i = 0; i < n; i++) {
    let best = Infinity;
    let arg = -1;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const v = d(i, j);
      if (v <= best) {
        best = v;
        arg = j;
      }
    }
    D.push(best);
    nn.push(arg);
  }
  return { D, nn };
}

export interface GreedyStep {
  /** 0 = 第一阶段；t ≥ 1 = 第二阶段第 t 轮 */
  round: number;
  /** 本轮开始时的已选集合（按选择顺序） */
  selectedBefore: number[];
  /** 本轮每个候选的得分 D（已选的为 NaN） */
  D: number[];
  /** 每个候选得分对应的“最近者”索引（第一阶段为最近邻，第二阶段为最近的已选 token） */
  nearest: number[];
  /** 本轮选中的索引 k = R[argmax(D)] */
  pick: number;
}

function argmaxFirst(D: number[]): number {
  let arg = -1;
  let best = -Infinity;
  for (let i = 0; i < D.length; i++) {
    const v = D[i];
    if (Number.isNaN(v)) continue;
    if (v > best) {
      best = v;
      arg = i;
    }
  }
  return arg;
}

/** 按 Algorithm 1 逐步执行，返回每一轮的完整中间状态（用于分步演示）。 */
export function greedyMaxMinSteps(n: number, k: number, d: DistFn): GreedyStep[] {
  const steps: GreedyStep[] = [];
  if (n === 0 || k <= 0) return steps;
  const s1 = stage1Scores(n, d);
  const p0 = argmaxFirst(s1.D);
  steps.push({ round: 0, selectedBefore: [], D: s1.D, nearest: s1.nn, pick: p0 });
  const sel = [p0];
  const inSel = new Array(n).fill(false);
  inSel[p0] = true;
  while (sel.length < Math.min(k, n)) {
    const D: number[] = [];
    const nearest: number[] = [];
    for (let i = 0; i < n; i++) {
      if (inSel[i]) {
        D.push(NaN);
        nearest.push(-1);
        continue;
      }
      let best = Infinity;
      let arg = -1;
      for (const j of sel) {
        const v = d(i, j);
        if (v <= best) {
          best = v;
          arg = j;
        }
      }
      D.push(best);
      nearest.push(arg);
    }
    const p = argmaxFirst(D);
    steps.push({ round: sel.length, selectedBefore: sel.slice(), D, nearest, pick: p });
    sel.push(p);
    inSel[p] = true;
  }
  return steps;
}

/** 只要最终选择顺序 */
export function greedyMaxMin(n: number, k: number, d: DistFn): number[] {
  return greedyMaxMinSteps(n, k, d).map((s) => s.pick);
}

/** 子集内最近的一对及其距离（Eq.(3) 方括号内的 min） */
export function minPair(set: number[], d: DistFn): { v: number; a: number; b: number } {
  let v = Infinity;
  let a = -1;
  let b = -1;
  for (let i = 0; i < set.length; i++) {
    for (let j = i + 1; j < set.length; j++) {
      const x = d(set[i], set[j]);
      if (x < v) {
        v = x;
        a = set[i];
        b = set[j];
      }
    }
  }
  return { v: set.length < 2 ? NaN : v, a, b };
}

/** 穷举所有大小为 k 的子集，返回 max-min 最优解（只用于很小的 n） */
export function bruteBest(n: number, k: number, d: DistFn): { set: number[]; v: number } {
  let best: number[] = [];
  let bestV = -Infinity;
  const cur: number[] = [];
  const rec = (start: number, curMin: number) => {
    if (cur.length === k) {
      if (curMin > bestV) {
        bestV = curMin;
        best = cur.slice();
      }
      return;
    }
    for (let i = start; i <= n - (k - cur.length); i++) {
      let m = curMin;
      for (const j of cur) m = Math.min(m, d(i, j));
      if (m <= bestV) continue; // 剪枝：已不可能更优
      cur.push(i);
      rec(i + 1, m);
      cur.pop();
    }
  };
  rec(0, Infinity);
  return { set: best, v: bestV };
}

/** 按分数取前 k（教学示意的“重要性 Top-k”） */
export function topK(scores: number[], k: number): number[] {
  return scores
    .map((s, i) => [s, i] as [number, number])
    .sort((p, q) => q[0] - p[0] || p[1] - q[1])
    .slice(0, k)
    .map((p) => p[1]);
}

/** 可复现的随机子集 */
export function randomSubset(n: number, k: number, seed: number): number[] {
  const r = rng(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(k, n));
}

/**
 * Min-Max 的贪心近似（教学示意）：从“最中心”的点出发，每次加入使子集最大两两距离
 * 增幅最小的点。论文 §4.6 只用文字描述了 Min-Max 策略，未给出其求解细节。
 */
export function greedyMinMax(n: number, k: number, d: DistFn): number[] {
  if (n === 0) return [];
  let start = 0;
  let bestSum = Infinity;
  for (let i = 0; i < n; i++) {
    const ds: number[] = [];
    for (let j = 0; j < n; j++) if (j !== i) ds.push(d(i, j));
    ds.sort((a, b) => a - b);
    const s = ds.slice(0, k).reduce((a, b) => a + b, 0);
    if (s < bestSum) {
      bestSum = s;
      start = i;
    }
  }
  const sel = [start];
  const inSel = new Array(n).fill(false);
  inSel[start] = true;
  while (sel.length < Math.min(k, n)) {
    let arg = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (inSel[i]) continue;
      let m = 0;
      for (const j of sel) m = Math.max(m, d(i, j));
      if (m < best) {
        best = m;
        arg = i;
      }
    }
    sel.push(arg);
    inSel[arg] = true;
  }
  return sel;
}

/** 覆盖误差：每个原始点到最近已选点的平均距离（越小越“有代表性”） */
export function coverError(n: number, sel: number[], d: DistFn): number {
  if (!sel.length) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) {
    let m = Infinity;
    for (const j of sel) m = Math.min(m, d(i, j));
    s += m;
  }
  return s / n;
}

/** Python 的 round()：银行家舍入（与官方代码 int(round(...)) 一致） */
export function pyRound(x: number): number {
  const f = Math.floor(x);
  const diff = x - f;
  if (Math.abs(diff - 0.5) < 1e-12) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}

/** log10 C(n, k)（用于“子集数量爆炸”演示） */
export function log10Choose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  let s = 0;
  const kk = Math.min(k, n - k);
  for (let i = 1; i <= kk; i++) s += Math.log10(n - kk + i) - Math.log10(i);
  return s;
}

// ---------------------------------------------------------------------------
// 教学用“图像块特征”：程序生成一张 24×24 的小场景，每个块是一个 4 维特征向量。
// 仅用于演示（选择顺序 vs 序列顺序、不同距离与策略），不是真实 CLIP 特征。
// ---------------------------------------------------------------------------

export interface Patch {
  r: number;
  g: number;
  b: number;
  /** 特征向量（教学示意） */
  f: number[];
  region: number;
}

export const GRID = 24;

export function makeScene(seed = 7): Patch[] {
  const r = rng(seed);
  const patches: Patch[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      let base: [number, number, number];
      let region: number;
      const sun = Math.hypot(x - 18.5, y - 4.5) < 2.6;
      const roof = y >= 9 && y <= 12 && x >= 4 + (12 - y) && x <= 13 - (12 - y) + 0;
      const wall = y >= 13 && y <= 18 && x >= 5 && x <= 12;
      const door = y >= 15 && y <= 18 && x >= 8 && x <= 9;
      const tree = Math.hypot(x - 18, y - 13) < 2.8;
      const trunk = x >= 17 && x <= 18 && y >= 15 && y <= 18;
      if (sun) {
        base = [250, 196, 74];
        region = 1;
      } else if (door) {
        base = [74, 52, 40];
        region = 5;
      } else if (roof) {
        base = [196, 70, 52];
        region = 2;
      } else if (wall) {
        base = [232, 222, 200];
        region = 3;
      } else if (trunk) {
        base = [110, 78, 52];
        region = 6;
      } else if (tree) {
        base = [58, 128, 76];
        region = 4;
      } else if (y >= 19) {
        base = [118, 168, 82];
        region = 7;
      } else {
        const t = y / 19;
        base = [150 + 60 * t, 196 + 30 * t, 236];
        region = 0;
      }
      const jit = () => (r() - 0.5) * 16;
      const R = Math.max(0, Math.min(255, base[0] + jit()));
      const G = Math.max(0, Math.min(255, base[1] + jit()));
      const B = Math.max(0, Math.min(255, base[2] + jit()));
      // 特征：归一化颜色 + 一个常数分量（避免余弦距离完全忽略亮度）
      patches.push({ r: R, g: G, b: B, f: [R / 255, G / 255, B / 255, 0.35], region });
    }
  }
  return patches;
}

export type Metric = 'cos' | 'l1' | 'l2';

export function featDist(patches: Patch[], metric: Metric): DistFn {
  const F = patches.map((p) => p.f);
  const norms = F.map((v) => Math.hypot(...v));
  return (a, b) => {
    const u = F[a];
    const v = F[b];
    if (metric === 'cos') {
      let dot = 0;
      for (let i = 0; i < u.length; i++) dot += u[i] * v[i];
      return 1 - dot / (norms[a] * norms[b]);
    }
    if (metric === 'l1') {
      let s = 0;
      for (let i = 0; i < u.length; i++) s += Math.abs(u[i] - v[i]);
      return s;
    }
    let s = 0;
    for (let i = 0; i < u.length; i++) s += (u[i] - v[i]) ** 2;
    return Math.sqrt(s);
  };
}

/** 用距离矩阵加速（n ≤ 600 时可接受） */
export function cachedDist(n: number, d: DistFn): DistFn {
  const M = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = d(i, j);
      M[i * n + j] = v;
      M[j * n + i] = v;
    }
  }
  return (a, b) => M[a * n + b];
}
