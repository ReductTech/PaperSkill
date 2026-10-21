// 自建的合成红外帧（教学示意，不是任何数据集中的图像）。
// 用确定性的随机数生成：天空、云层、建筑轮廓、建筑上的热点（杂波），以及两个暗弱的小目标。
// 同时实现一个最简单的“局部对比”检测器，以及按作者公开评测代码 metrics.py 的口径计算
// Pd（质心距离 < 3 像素即命中）、Fa（未匹配预测连通域的像素 / 全部像素）与 IoU。

export const N = 160;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueNoise(rand: () => number, size: number, cells: number) {
  const g: number[] = [];
  for (let i = 0; i < (cells + 1) * (cells + 1); i++) g.push(rand());
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const v00 = g[y0 * (cells + 1) + x0];
      const v10 = g[y0 * (cells + 1) + x0 + 1];
      const v01 = g[(y0 + 1) * (cells + 1) + x0];
      const v11 = g[(y0 + 1) * (cells + 1) + x0 + 1];
      out[y * size + x] = (v00 * (1 - sx) + v10 * sx) * (1 - sy) + (v01 * (1 - sx) + v11 * sx) * sy;
    }
  }
  return out;
}

export interface Target {
  x: number;
  y: number;
  amp: number;
  sigma: number;
}

export interface Scene {
  img: Float32Array; // 0..1 灰度
  gt: Uint8Array; // 目标像素真值
  targets: Target[];
  clutter: { x: number; y: number }[];
  contrast: Float32Array; // 归一化局部对比 0..1
}

let cached: Scene | null = null;

export function makeScene(): Scene {
  if (cached) return cached;
  const rand = mulberry32(20240130);
  const img = new Float32Array(N * N);
  const n1 = valueNoise(rand, N, 5);
  const n2 = valueNoise(rand, N, 11);
  const n3 = valueNoise(rand, N, 23);
  // 建筑轮廓：一组随机宽度与高度的矩形块
  const roof = new Float32Array(N);
  const facade = new Float32Array(N);
  let x = 0;
  while (x < N) {
    const w = 10 + Math.floor(rand() * 18);
    const h = 26 + Math.floor(rand() * 30);
    const f = 0.46 + rand() * 0.1;
    for (let i = x; i < Math.min(N, x + w); i++) {
      roof[i] = N - h;
      facade[i] = f;
    }
    x += w;
  }
  for (let yy = 0; yy < N; yy++) {
    for (let xx = 0; xx < N; xx++) {
      const i = yy * N + xx;
      const cloudField = 0.55 * n1[i] + 0.3 * n2[i] + 0.15 * n3[i];
      const cloud = Math.max(0, Math.min(1, (cloudField - 0.46) * 3.2));
      let v = 0.17 + 0.1 * (yy / N) + 0.26 * cloud * (1 - yy / (N * 1.3));
      if (yy >= roof[xx]) {
        v = facade[xx] + 0.07 * n3[i] - 0.04 * ((yy - roof[xx]) / 60);
      }
      img[i] = v;
    }
  }
  const gauss = (cx: number, cy: number, amp: number, s: number) => {
    for (let yy = Math.max(0, Math.floor(cy - 4 * s)); yy <= Math.min(N - 1, Math.ceil(cy + 4 * s)); yy++) {
      for (let xx = Math.max(0, Math.floor(cx - 4 * s)); xx <= Math.min(N - 1, Math.ceil(cx + 4 * s)); xx++) {
        const d2 = (xx - cx) * (xx - cx) + (yy - cy) * (yy - cy);
        img[yy * N + xx] += amp * Math.exp(-d2 / (2 * s * s));
      }
    }
  };
  // 杂波：建筑上的热点（窗口、灯具）与云边缘的亮斑——它们和目标一样是“局部亮点”
  const clutter: { x: number; y: number }[] = [];
  const pickRoofSpot = (cx: number) => ({ x: cx, y: roof[Math.round(cx)] + 6 + Math.floor(rand() * 10) });
  const roofAmps = [0.3, 0.22, 0.18, 0.15];
  [22, 61, 98, 137].forEach((cx, k) => {
    const p = pickRoofSpot(cx + Math.floor(rand() * 6));
    clutter.push(p);
    gauss(p.x, p.y, roofAmps[k], 1.0);
  });
  for (const [p, a] of [
    [{ x: 118, y: 40 }, 0.17],
    [{ x: 44, y: 58 }, 0.12],
  ] as [{ x: number; y: number }, number][]) {
    clutter.push(p);
    gauss(p.x, p.y, a, 1.1);
  }
  // 两个目标：一个在晴空（较暗），一个靠近云边
  const targets: Target[] = [
    { x: 78.4, y: 30.6, amp: 0.25, sigma: 1.0 },
    { x: 136.2, y: 66.3, amp: 0.19, sigma: 0.95 },
  ];
  for (const t of targets) gauss(t.x, t.y, t.amp, t.sigma);
  // 传感器噪声
  for (let i = 0; i < N * N; i++) {
    const u = rand() + rand() + rand() - 1.5;
    img[i] = Math.max(0, Math.min(1, img[i] + 0.022 * u));
  }
  const gt = new Uint8Array(N * N);
  for (const t of targets) {
    for (let yy = Math.floor(t.y - 3); yy <= Math.ceil(t.y + 3); yy++) {
      for (let xx = Math.floor(t.x - 3); xx <= Math.ceil(t.x + 3); xx++) {
        const d2 = (xx - t.x) * (xx - t.x) + (yy - t.y) * (yy - t.y);
        if (Math.exp(-d2 / (2 * t.sigma * t.sigma)) > 0.35) gt[yy * N + xx] = 1;
      }
    }
  }
  cached = { img, gt, targets, clutter, contrast: localContrast(img) };
  return cached;
}

/** 局部对比：中心 3×3 均值 − 周围 8 个 3×3 邻块均值中的最大值（只保留正值），再归一化。 */
export function localContrast(img: Float32Array): Float32Array {
  const m = new Float32Array(N * N);
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += img[(y + dy) * N + x + dx];
      m[y * N + x] = s / 9;
    }
  }
  const out = new Float32Array(N * N);
  let mx = 0;
  for (let y = 4; y < N - 4; y++) {
    for (let x = 4; x < N - 4; x++) {
      const c = m[y * N + x];
      let best = -1;
      for (let dy = -3; dy <= 3; dy += 3) {
        for (let dx = -3; dx <= 3; dx += 3) {
          if (dx === 0 && dy === 0) continue;
          best = Math.max(best, m[(y + dy) * N + x + dx]);
        }
      }
      const d = Math.max(0, c - best);
      out[y * N + x] = d;
      if (d > mx) mx = d;
    }
  }
  if (mx > 0) for (let i = 0; i < out.length; i++) out[i] /= mx;
  return out;
}

export interface Region {
  pixels: number[];
  cx: number;
  cy: number;
  matched: boolean;
}

/** 8 连通域标记。 */
export function regions(mask: Uint8Array): Region[] {
  const seen = new Uint8Array(N * N);
  const out: Region[] = [];
  const stack: number[] = [];
  for (let i = 0; i < N * N; i++) {
    if (!mask[i] || seen[i]) continue;
    const pix: number[] = [];
    stack.push(i);
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop() as number;
      pix.push(p);
      const px = p % N;
      const py = (p - px) / N;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const qx = px + dx;
          const qy = py + dy;
          if (qx < 0 || qy < 0 || qx >= N || qy >= N) continue;
          const q = qy * N + qx;
          if (mask[q] && !seen[q]) {
            seen[q] = 1;
            stack.push(q);
          }
        }
      }
    }
    let sx = 0;
    let sy = 0;
    for (const p of pix) {
      sx += p % N;
      sy += Math.floor(p / N);
    }
    out.push({ pixels: pix, cx: sx / pix.length, cy: sy / pix.length, matched: false });
  }
  return out;
}

export interface Eval {
  pred: Uint8Array;
  regions: Region[];
  hits: boolean[]; // 每个真值目标是否被命中
  pd: number; // 0..1
  fa: number; // 比例（未乘 1e6）
  iou: number; // 0..1
  falsePixels: number;
}

/** 以阈值 t 对局部对比图二值化，并按作者 metrics.py 的口径评估。 */
export function evaluate(scene: Scene, t: number): Eval {
  const pred = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) pred[i] = scene.contrast[i] > t ? 1 : 0;
  // 生长：把与种子相连、亮度高于局部背景一半对比的像素也算进预测（让预测有面积，便于计算 IoU）
  const grown = new Uint8Array(pred);
  for (let i = 0; i < N * N; i++) {
    if (!pred[i]) continue;
    const x = i % N;
    const y = (i - x) / N;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const q = (y + dy) * N + x + dx;
        if (q >= 0 && q < N * N && scene.contrast[q] > t * 0.5) grown[q] = 1;
      }
    }
  }
  const regs = regions(grown);
  const gtRegs = regions(scene.gt);
  const hits = gtRegs.map(() => false);
  const pool = regs.slice();
  gtRegs.forEach((g, gi) => {
    for (let k = 0; k < pool.length; k++) {
      const r = pool[k];
      if (Math.hypot(r.cx - g.cx, r.cy - g.cy) < 3) {
        r.matched = true;
        hits[gi] = true;
        pool.splice(k, 1);
        break;
      }
    }
  });
  let falsePixels = 0;
  for (const r of regs) if (!r.matched) falsePixels += r.pixels.length;
  let inter = 0;
  let uni = 0;
  for (let i = 0; i < N * N; i++) {
    if (grown[i] && scene.gt[i]) inter++;
    if (grown[i] || scene.gt[i]) uni++;
  }
  return {
    pred: grown,
    regions: regs,
    hits,
    pd: hits.filter(Boolean).length / Math.max(1, gtRegs.length),
    fa: falsePixels / (N * N),
    iou: uni ? inter / uni : 0,
    falsePixels,
  };
}

/** 扫描一组阈值，得到 (Fa, Pd) 折线。 */
export function sweep(scene: Scene, steps = 48) {
  const pts: { t: number; pd: number; fa: number; iou: number }[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = 0.04 + (0.96 - 0.04) * (k / steps);
    const e = evaluate(scene, t);
    pts.push({ t, pd: e.pd, fa: e.fa, iou: e.iou });
  }
  return pts;
}

/** 把灰度场景画到 ImageData 上（红外常用的“白热”显示）。 */
export function toImageData(ctx: CanvasRenderingContext2D, field: Float32Array, gamma = 1, lo = 0.12, hi = 0.85) {
  const id = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = Math.max(0, Math.min(1, (field[i] - lo) / (hi - lo)));
    const g = Math.round(255 * Math.pow(v, gamma));
    id.data[i * 4] = g;
    id.data[i * 4 + 1] = g;
    id.data[i * 4 + 2] = Math.min(255, g + 4);
    id.data[i * 4 + 3] = 255;
  }
  return id;
}
