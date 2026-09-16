// 布纹 / 像素格 计算引擎（第 1–3 章共用）
//
// 这一套的目的：让"纹理被采样吃掉"这件事里的每一个数值都是**真算出来的**，
// 而不是用一条衰减曲线假装。做法是先把真实布纹以高分辨率烘成一张画布，
// 后面所有的"格子平均值"都是对这张画布做真实的面积平均。
//
// 与 halftoneKit.ts 的分工：halftoneKit 管布景与生活道具（制版台、印样、网屏），
// fabricKit 管"被采样的纹理"这一侧的数学。两者都由协调者统一编写，不被 packet 修改。

import { clamp } from '../lib/canvasKit';

// ---------------------------------------------------------------- 布纹

export const THREAD = 10;                 // 一根织线的宽度（显示像素）
export const FAB_W = 2200;                // 烘出来的布纹尺寸，够宽以便左右移动
export const FAB_H = 560;

const NT = 512;                           // 每根线的随机参数表长度
const wOff = new Float32Array(NT), fOff = new Float32Array(NT);
const wExp = new Float32Array(NT), fExp = new Float32Array(NT);
(function seed() {
  let s = 20260915;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < NT; i++) {
    wOff[i] = (rnd() - 0.5) * 0.09;   // 每根线的明暗略不同
    fOff[i] = (rnd() - 0.5) * 0.09;
    wExp[i] = 0.48 + rnd() * 0.42;    // 每根线的粗细略不同
    fExp[i] = 0.48 + rnd() * 0.42;
  }
})();

/**
 * 平纹织物的亮度函数。经纬线交替压在上面 —— 真实织物本来就不规则，
 * 所以每根线的粗细和明暗都不同；这一点同时避免了织纹与格子尺寸发生共振。
 */
export function fabricShade(x: number, y: number): number {
  const u = x / THREAD, v = y / THREAD;
  const fu = u - Math.floor(u), fv = v - Math.floor(v);
  const cu = Math.floor(u), cv = Math.floor(v);
  const iW = ((cu % NT) + NT) % NT, iF = ((cv % NT) + NT) % NT;
  const warpProf = Math.pow(Math.sin(fu * Math.PI), wExp[iW]);
  const weftProf = Math.pow(Math.sin(fv * Math.PI), fExp[iF]);
  const warpOnTop = ((cu + cv) & 1) === 0;
  const top = (warpOnTop ? warpProf : weftProf) + (warpOnTop ? wOff[iW] : fOff[iF]);
  const bottom = (warpOnTop ? weftProf : warpProf) + (warpOnTop ? fOff[iF] : wOff[iW]);
  return clamp(0.26 + 0.48 * top + 0.26 * bottom, 0, 1);
}

let _fab: HTMLCanvasElement | null = null;

/** 把布纹烘到一张离屏画布。只做一次。 */
export function fabricCanvas(): HTMLCanvasElement {
  if (_fab) return _fab;
  const c = document.createElement('canvas');
  c.width = FAB_W; c.height = FAB_H;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(FAB_W, FAB_H);
    const d = img.data;
    for (let y = 0; y < FAB_H; y++) {
      for (let x = 0; x < FAB_W; x++) {
        const v = Math.round(fabricShade(x, y) * 255);
        const i = (y * FAB_W + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }
  _fab = c;
  return c;
}

/**
 * 把布纹的一块画到画布上。ox/oy 允许是小数 —— 那就等于把布纹整体挪了亚像素，
 * 正是"第二帧错开半格"要用的动作。
 */
export function drawFabricPatch(
  ctx: CanvasRenderingContext2D,
  dx: number, dy: number, dw: number, dh: number,
  ox = 0, oy = 0
): void {
  const src = fabricCanvas();
  ctx.drawImage(src, ox, oy, dw, dh, dx, dy, dw, dh);
}

// ---------------------------------------------------------------- 采样

export interface CellGrid {
  cols: number;
  rows: number;
  cw: number;          // 每格宽（显示像素）
  ch: number;          // 每格高
  ox: number;          // 这块区域在布纹坐标里的左上角
  oy: number;
  shiftX: number;      // 网格相位偏移（显示像素）
  vals: Float32Array;  // 长度 cols*rows，0..255
}

/**
 * 对布纹的一块区域做真实的面积平均：每个格子 = 该格覆盖区域内所有像素的平均值。
 * shiftX/shiftY 让整张网格平移一个亚像素量，用来模拟"第二帧的格子错开了"。
 *
 * 注意：这是真实求和，不是解析近似 —— 格子横跨几根线，结果里就真的只剩平均数。
 */
export function cellMeans(
  ox: number, oy: number, dw: number, dh: number,
  cell: number, shiftX = 0, shiftY = 0, offsetY = 0
): CellGrid {
  const src = fabricCanvas();
  const cols = Math.max(1, Math.floor(dw / cell));
  const rows = Math.max(1, Math.floor(dh / cell));
  const cw = dw / cols, ch = dh / rows;

  // 一次读入覆盖区域（含偏移余量）的像素
  const padX = Math.ceil(Math.abs(shiftX)) + 2;
  const padY = Math.ceil(Math.abs(shiftY)) + 2;
  const rx0 = Math.max(0, Math.floor(ox) - padX);
  const ry0 = Math.max(0, Math.floor(oy) - padY);
  const rx1 = Math.min(src.width, Math.ceil(ox + dw + padX));
  const ry1 = Math.min(src.height, Math.ceil(oy + dh + padY));
  const rw = Math.max(1, rx1 - rx0), rh = Math.max(1, ry1 - ry0);
  const g = src.getContext('2d');
  const data = g ? g.getImageData(rx0, ry0, rw, rh).data : null;

  const vals = new Float32Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 这一格在布纹坐标里覆盖的范围
      const x0 = ox + c * cw + shiftX;
      const x1 = x0 + cw;
      const y0 = oy + r * ch + shiftY + offsetY;
      const y1 = y0 + ch;
      let sum = 0, cnt = 0;
      if (data) {
        const ix0 = Math.max(0, Math.floor(x0)), ix1 = Math.min(src.width, Math.ceil(x1));
        const iy0 = Math.max(0, Math.floor(y0)), iy1 = Math.min(src.height, Math.ceil(y1));
        for (let y = iy0; y < iy1; y++) {
          const rowBase = (y - ry0) * rw;
          for (let x = ix0; x < ix1; x++) {
            sum += data[(rowBase + (x - rx0)) * 4];
            cnt++;
          }
        }
      }
      vals[r * cols + c] = cnt ? sum / cnt : 0;
    }
  }
  return { cols, rows, cw, ch, ox, oy, shiftX, vals };
}

// ---------------------------------------------------------------- 绘制

/** 把格子值画成平色块 —— 这正是相机真实给出的东西。 */
export function drawCellGrid(
  ctx: CanvasRenderingContext2D,
  dx: number, dy: number, g: CellGrid,
  colorize?: (v: number, c: number, r: number) => string
): void {
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const v = g.vals[r * g.cols + c];
      const grey = Math.round(v);
      ctx.fillStyle = colorize ? colorize(v, c, r) : `rgb(${grey},${grey},${grey})`;
      ctx.fillRect(dx + c * g.cw, dy + r * g.ch, g.cw + 1, g.ch + 1);
    }
  }
}

/** 把格子值用双线性插值放大 —— "把这些数放大回去"，平滑但没有织纹。 */
export function drawCellGridSmooth(
  ctx: CanvasRenderingContext2D,
  dx: number, dy: number, dw: number, dh: number, g: CellGrid
): void {
  const step = Math.max(3, Math.min(g.cw, g.ch) / 5);
  const at = (c: number, r: number) =>
    g.vals[clamp(r, 0, g.rows - 1) * g.cols + clamp(c, 0, g.cols - 1)];
  for (let y = 0; y < dh; y += step) {
    for (let x = 0; x < dw; x += step) {
      const fx = x / g.cw - 0.5, fy = y / g.ch - 0.5;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = clamp(fx - x0, 0, 1), ty = clamp(fy - y0, 0, 1);
      const v = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty)
              + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
      const grey = Math.round(v);
      ctx.fillStyle = `rgb(${grey},${grey},${grey})`;
      ctx.fillRect(dx + x, dy + y, step + 1, step + 1);
    }
  }
}

// ---------------------------------------------------------------- 多帧融合

/**
 * 用若干帧的采样点重建一张更细的网格。
 *
 * 做法：把每一帧的格子中心当作一个**采样点**（值 = 该格的平均值），把多帧的
 * 采样点并成一组按 x 排序的点，再用线性插值在细网格上重建。
 *
 * 为什么不是"按覆盖面积加权平均格子均值"：那样做只是把若干个粗平均值混在一起，
 * 是在平滑，不是在恢复细节 —— 实测融合误差几乎是平的、甚至比单帧还差。
 * 插值才是诚实的：两帧相位不同时，采样点在 x 上**交错**开，间距减半，
 * 插值出来的曲线自然更接近真实布纹。这正是多帧超分的真实原理。
 *
 * 错位为 0（或整格）时两帧的采样点完全重合，并起来还是原来的间距 —— 白搭。
 */
function interpFromSources(sources: CellGrid[], target: CellGrid): CellGrid {
  const out = new Float32Array(target.cols * target.rows);
  const cwA = sources[0].cw, chA = sources[0].ch;
  const rowScale = Math.max(1, Math.round(chA / target.ch));   // 细网格有几行落在一个粗格行里

  for (let r = 0; r < target.rows; r++) {
    const coarseRow = Math.min(sources[0].rows - 1, Math.floor(r / rowScale));

    // 这一行上，所有帧的采样点
    const pts: { x: number; v: number }[] = [];
    for (const g of sources) {
      const row = Math.min(g.rows - 1, coarseRow);
      for (let c = 0; c < g.cols; c++) {
        pts.push({ x: g.ox + g.shiftX + (c + 0.5) * g.cw, v: g.vals[row * g.cols + c] });
      }
    }
    pts.sort((p, q) => p.x - q.x);

    for (let c = 0; c < target.cols; c++) {
      const x = target.ox + (c + 0.5) * target.cw;
      let v: number;
      if (x <= pts[0].x) v = pts[0].v;
      else if (x >= pts[pts.length - 1].x) v = pts[pts.length - 1].v;
      else {
        let lo = 0;
        while (lo < pts.length - 2 && pts[lo + 1].x < x) lo++;
        const dx = pts[lo + 1].x - pts[lo].x;
        const t = dx > 1e-6 ? (x - pts[lo].x) / dx : 0;
        v = pts[lo].v * (1 - t) + pts[lo + 1].v * t;
      }
      out[r * target.cols + c] = v;
    }
  }
  void cwA;
  return { ...target, vals: out };
}

/** 两帧拼起来：采样点并成一组再插值。 */
export function fuseGrids(gA: CellGrid, gB: CellGrid, target: CellGrid): CellGrid {
  return interpFromSources([gA, gB], target);
}

/** 只用一帧重建 —— 和融合用同一套插值方法，唯一的差别是采样点少了一半，便于公平对比。 */
export function resampleGrid(g: CellGrid, target: CellGrid): CellGrid {
  return interpFromSources([g], target);
}

/**
 * 重建结果与真实布纹的平均绝对误差（0–255）。
 *
 * 比法很重要：拿一个格子的**平均值**去和该格中心的**单个像素**比是错的
 * （苹果比橘子，对任何重建都会得到几十的误差）。正确做法是把这一格覆盖区域内
 * 真实像素的**平均值**算出来，再和重建值比 —— 这才是"这一格重建得准不准"。
 */
export function meanAbsError(g: CellGrid): number {
  const src = fabricCanvas();
  const gg = src.getContext('2d');
  if (!gg) return 0;

  const rx0 = Math.max(0, Math.floor(g.ox));
  const ry0 = Math.max(0, Math.floor(g.oy));
  const rx1 = Math.min(src.width, Math.ceil(g.ox + g.cols * g.cw + Math.abs(g.shiftX) + 2));
  const ry1 = Math.min(src.height, Math.ceil(g.oy + g.rows * g.ch + 2));
  const rw = Math.max(1, rx1 - rx0), rh = Math.max(1, ry1 - ry0);
  const data = gg.getImageData(rx0, ry0, rw, rh).data;

  let sum = 0, cnt = 0;
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const x0 = g.ox + g.shiftX + c * g.cw, x1 = x0 + g.cw;
      const y0 = g.oy + r * g.ch, y1 = y0 + g.ch;
      const ix0 = Math.max(0, Math.floor(x0)), ix1 = Math.min(src.width, Math.ceil(x1));
      const iy0 = Math.max(0, Math.floor(y0)), iy1 = Math.min(src.height, Math.ceil(y1));
      let s = 0, n = 0;
      for (let y = iy0; y < iy1; y++) {
        const rb = (y - ry0) * rw;
        for (let x = ix0; x < ix1; x++) { s += data[(rb + (x - rx0)) * 4]; n++; }
      }
      if (n) { sum += Math.abs(g.vals[r * g.cols + c] - s / n); cnt++; }
    }
  }
  return cnt ? sum / cnt : 0;
}
