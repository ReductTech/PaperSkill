// 按图 4、图 5 的形状手绘的示意曲线（教学示意，不是原始数据）。
// 关键点：浅层系统 token 急升、视觉 token 急降；中深层视觉 token 约 5%；输出越长越少看图。

type Pt = [number, number];

function interp(points: Pt[], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

// 图 4 · LLaVA-1.5-7B（32 层，横轴 0–31）
const L7 = {
  sys: [[0, 0.1], [1, 0.16], [2, 0.72], [3, 0.79], [5, 0.75], [8, 0.62], [10, 0.52], [13, 0.48], [16, 0.58], [19, 0.68], [22, 0.77], [26, 0.76], [28, 0.79], [30, 0.7], [31, 0.55]] as Pt[],
  vis: [[0, 0.42], [1, 0.22], [2, 0.07], [3, 0.05], [10, 0.05], [20, 0.06], [29, 0.05], [30, 0.06], [31, 0.1]] as Pt[],
  ins: [[0, 0.3], [1, 0.33], [2, 0.05], [5, 0.06], [8, 0.12], [11, 0.19], [14, 0.18], [18, 0.12], [22, 0.07], [27, 0.05], [30, 0.1], [31, 0.14]] as Pt[],
};
// 图 4 · LLaVA-1.5-13B（40 层，横轴 0–39）
const L13 = {
  sys: [[0, 0.08], [1, 0.2], [2, 0.75], [4, 0.8], [7, 0.7], [10, 0.57], [14, 0.52], [18, 0.62], [22, 0.75], [27, 0.8], [33, 0.83], [37, 0.76], [39, 0.6]] as Pt[],
  vis: [[0, 0.4], [1, 0.2], [2, 0.06], [3, 0.04], [20, 0.05], [36, 0.05], [39, 0.1]] as Pt[],
  ins: [[0, 0.28], [1, 0.3], [2, 0.04], [6, 0.08], [10, 0.15], [14, 0.17], [18, 0.12], [24, 0.06], [32, 0.04], [39, 0.1]] as Pt[],
};

export type ModelKey = '7b' | '13b';
export const LAYERS: Record<ModelKey, number> = { '7b': 32, '13b': 40 };

/** 第 i 层（0 起）四类 token 的注意力比例（和为 1） */
export function layerShares(model: ModelKey, i: number) {
  const c = model === '7b' ? L7 : L13;
  const sys = interp(c.sys, i);
  const vis = interp(c.vis, i);
  const ins = interp(c.ins, i);
  const out = Math.max(0.02, 1 - sys - vis - ins);
  const tot = sys + vis + ins + out;
  return { sys: sys / tot, vis: vis / tot, ins: ins / tot, out: out / tot };
}

// 图 5（对层取平均）：横轴为第几个输出 token（0–400）
const O7 = {
  sys: [[0, 0.69], [100, 0.665], [200, 0.655], [300, 0.645], [400, 0.64]] as Pt[],
  vis: [[0, 0.1], [20, 0.085], [60, 0.07], [150, 0.05], [250, 0.042], [400, 0.032]] as Pt[],
  ins: [[0, 0.21], [10, 0.12], [40, 0.07], [100, 0.04], [200, 0.025], [400, 0.012]] as Pt[],
};

/** 第 n 个输出 token（对层取平均）四类 token 的注意力比例 */
export function outputShares(n: number) {
  const sys = interp(O7.sys, n);
  const vis = interp(O7.vis, n);
  const ins = interp(O7.ins, n);
  const out = Math.max(0, 1 - sys - vis - ins);
  return { sys, vis, ins, out };
}
