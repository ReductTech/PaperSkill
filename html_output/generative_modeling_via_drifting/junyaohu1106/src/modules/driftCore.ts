// Executable toy computations for the Drifting tutorial.
// Eq. numbers refer to "Generative Modeling via Drifting" (arXiv:2602.04770v2).
export type Pt = [number, number];

export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}
export function cluster(seed: number, n: number, cx: number, cy: number, sx: number, sy = sx): Pt[] {
  const r = makeRng(seed);
  return Array.from({ length: n }, () => [cx + gaussian(r) * sx, cy + gaussian(r) * sy] as Pt);
}
export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const norm = (v: Pt) => Math.hypot(v[0], v[1]);
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Eq. (12). */
export const kernel = (d: number, tau: number) => Math.exp(-d / tau);

export interface MeanShift { v: Pt; weights: number[]; raw: number[]; z: number }

/** Empirical Eq. (8)-(9). `skip` removes one index, like `dist_neg += eye(N)*1e6` in Alg. 2. */
export function meanShift(x: Pt, ys: Pt[], tau: number, skip = -1): MeanShift {
  const raw = ys.map((y, i) => (i === skip ? 0 : kernel(dist(x, y), tau)));
  const z = raw.reduce((s, k) => s + k, 0);
  if (!(z > 1e-280)) return { v: [0, 0], weights: raw.map(() => 0), raw, z: 0 };
  const weights = raw.map(k => k / z);
  let vx = 0;
  let vy = 0;
  ys.forEach((y, i) => { vx += weights[i] * (y[0] - x[0]); vy += weights[i] * (y[1] - x[1]); });
  return { v: [vx, vy], weights, raw, z };
}

export interface Drift { plus: MeanShift; minus: MeanShift; V: Pt }

/** Eq. (10), with `a`/`b` used for the destructive cases of Table 1. */
export function driftAt(x: Pt, pos: Pt[], neg: Pt[], tau: number, a = 1, b = 1, skip = -1): Drift {
  const plus = meanShift(x, pos, tau);
  const minus = meanShift(x, neg, tau, skip);
  return { plus, minus, V: [a * plus.v[0] - b * minus.v[0], a * plus.v[1] - b * minus.v[1]] };
}

/** Eq. (2) applied directly to samples; `eta` is a teaching step size. */
export function driftStep(pts: Pt[], pos: Pt[], tau: number, eta: number, a = 1, b = 1, skipSelf = true): Pt[] {
  return pts.map((x, i) => {
    const { V } = driftAt(x, pos, pts, tau, a, b, skipSelf ? i : -1);
    return [x[0] + eta * V[0], x[1] + eta * V[1]] as Pt;
  });
}

/** Value of Eq. (6), which equals the mean squared norm of V. */
export function meanSquaredDrift(pts: Pt[], pos: Pt[], tau: number, a = 1, b = 1, skipSelf = true) {
  let total = 0;
  pts.forEach((x, i) => { const { V } = driftAt(x, pos, pts, tau, a, b, skipSelf ? i : -1); total += V[0] * V[0] + V[1] * V[1]; });
  return total / Math.max(pts.length, 1);
}

/** Mean distance from each generated sample to its nearest target (a toy readout, not FID). */
export function meanNearest(pts: Pt[], targets: Pt[]) {
  return pts.reduce((s, x) => s + Math.min(...targets.map(t => dist(x, t))), 0) / Math.max(pts.length, 1);
}

/** Flow-matching toy (not an experiment in this paper): Euler steps of the marginal velocity
 *  for a point-mass mixture along x_t=(1-t)eps+t*y. One step lands on the targets' mean. */
export function eulerFlow(eps: Pt, ys: Pt[], origin: Pt, sigma: number, steps: number): Pt[] {
  let x: Pt = [eps[0], eps[1]];
  const path: Pt[] = [x];
  for (let k = 0; k < steps; k++) {
    const t = k / steps;
    const logW = ys.map(y => {
      const mx = origin[0] * (1 - t) + t * y[0];
      const my = origin[1] * (1 - t) + t * y[1];
      return -((x[0] - mx) ** 2 + (x[1] - my) ** 2) / (2 * ((1 - t) * sigma) ** 2);
    });
    const top = Math.max(...logW);
    const w = logW.map(l => Math.exp(l - top));
    const z = w.reduce((s, v) => s + v, 0);
    const ey: Pt = [ys.reduce((s, y, i) => s + w[i] * y[0], 0) / z, ys.reduce((s, y, i) => s + w[i] * y[1], 0) / z];
    // Marginal velocity E[y - eps | x_t]; eps is recovered from x_t and y in expectation.
    const ux = (ey[0] - x[0]) / (1 - t);
    const uy = (ey[1] - x[1]) / (1 - t);
    x = [x[0] + ux / steps, x[1] + uy / steps];
    path.push(x);
  }
  return path;
}

// ---- A small MLP trained with Alg. 1, using hand-written backprop and Adam. ----
export interface Mlp { sizes: number[]; W: Float64Array[]; b: Float64Array[]; m: Float64Array[]; s: Float64Array[]; t: number }

export function makeMlp(sizes: number[], seed: number): Mlp {
  const r = makeRng(seed);
  const W: Float64Array[] = [];
  const b: Float64Array[] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const w = new Float64Array(sizes[l] * sizes[l + 1]);
    const scale = Math.sqrt(2 / sizes[l]);
    for (let i = 0; i < w.length; i++) w[i] = gaussian(r) * scale;
    W.push(w);
    b.push(new Float64Array(sizes[l + 1]));
  }
  const params = [...W, ...b];
  return { sizes, W, b, m: params.map(p => new Float64Array(p.length)), s: params.map(p => new Float64Array(p.length)), t: 0 };
}

const act = (x: number) => (x > 0 ? x : 0.1 * x);
const dact = (x: number) => (x > 0 ? 1 : 0.1);

export function forward(net: Mlp, input: Pt): Pt {
  let h: number[] = [input[0], input[1]];
  for (let l = 0; l < net.W.length; l++) {
    const inN = net.sizes[l];
    const outN = net.sizes[l + 1];
    const next = new Array<number>(outN).fill(0);
    for (let o = 0; o < outN; o++) {
      let sum = net.b[l][o];
      for (let i = 0; i < inN; i++) sum += net.W[l][o * inN + i] * h[i];
      next[o] = l < net.W.length - 1 ? act(sum) : sum;
    }
    h = next;
  }
  return [h[0], h[1]];
}

/** One step of Alg. 1: the MSE gradient wrt x is -2V, with V frozen by stop-gradient. */
export function trainStep(net: Mlp, noise: Pt[], yPos: Pt[], tau: number, lr: number): { loss: number; x: Pt[] } {
  const layers = net.W.length;
  const gW = net.W.map(w => new Float64Array(w.length));
  const gB = net.b.map(v => new Float64Array(v.length));
  const caches: { hs: number[][]; pre: number[][] }[] = [];
  const x: Pt[] = noise.map(e => {
    const hs: number[][] = [[e[0], e[1]]];
    const pre: number[][] = [];
    let h = hs[0];
    for (let l = 0; l < layers; l++) {
      const inN = net.sizes[l];
      const outN = net.sizes[l + 1];
      const z = new Array<number>(outN).fill(0);
      const next = new Array<number>(outN).fill(0);
      for (let o = 0; o < outN; o++) {
        let sum = net.b[l][o];
        for (let i = 0; i < inN; i++) sum += net.W[l][o * inN + i] * h[i];
        z[o] = sum;
        next[o] = l < layers - 1 ? act(sum) : sum;
      }
      pre.push(z);
      hs.push(next);
      h = next;
    }
    caches.push({ hs, pre });
    return [h[0], h[1]] as Pt;
  });
  let loss = 0;
  x.forEach((xi, n) => {
    const { V } = driftAt(xi, yPos, x, tau, 1, 1, n);
    loss += V[0] * V[0] + V[1] * V[1];
    let grad: number[] = [(-2 * V[0]) / x.length, (-2 * V[1]) / x.length];
    const { hs, pre } = caches[n];
    for (let l = layers - 1; l >= 0; l--) {
      const inN = net.sizes[l];
      const outN = net.sizes[l + 1];
      const dz = grad.map((g, o) => (l < layers - 1 ? g * dact(pre[l][o]) : g));
      const prev = new Array<number>(inN).fill(0);
      for (let o = 0; o < outN; o++) {
        gB[l][o] += dz[o];
        for (let i = 0; i < inN; i++) {
          gW[l][o * inN + i] += dz[o] * hs[l][i];
          prev[i] += net.W[l][o * inN + i] * dz[o];
        }
      }
      grad = prev;
    }
  });
  net.t += 1;
  const params = [...net.W, ...net.b];
  const grads = [...gW, ...gB];
  params.forEach((p, k) => {
    const m = net.m[k];
    const s = net.s[k];
    const g = grads[k];
    for (let i = 0; i < p.length; i++) {
      m[i] = 0.9 * m[i] + 0.1 * g[i];
      s[i] = 0.999 * s[i] + 0.001 * g[i] * g[i];
      const mh = m[i] / (1 - 0.9 ** net.t);
      const sh = s[i] / (1 - 0.999 ** net.t);
      p[i] -= (lr * mh) / (Math.sqrt(sh) + 1e-8);
    }
  });
  return { loss: loss / x.length, x };
}

export type Shape = 'modes' | 'checker' | 'swiss';
export function sampleShape(shape: Shape, n: number, rand: () => number): Pt[] {
  return Array.from({ length: n }, () => {
    if (shape === 'modes') {
      const s = rand() < 0.5 ? -1 : 1;
      return [s * 0.65 + gaussian(rand) * 0.13, s * 0.35 + gaussian(rand) * 0.13] as Pt;
    }
    if (shape === 'checker') {
      for (;;) {
        const px = rand() * 2 - 1;
        const py = rand() * 2 - 1;
        const cell = Math.floor((px + 1) * 2) + Math.floor((py + 1) * 2);
        if (cell % 2 === 0) return [px, py] as Pt;
      }
    }
    const t = 1.5 * Math.PI * (1 + 2 * rand());
    return [(t * Math.cos(t)) / 15 + gaussian(rand) * 0.02, (t * Math.sin(t)) / 15 + gaussian(rand) * 0.02] as Pt;
  });
}
