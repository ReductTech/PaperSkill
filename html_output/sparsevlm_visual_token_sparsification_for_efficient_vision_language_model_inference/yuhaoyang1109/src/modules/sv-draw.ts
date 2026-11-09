// 画布共用的绘图件：32 层 token 塔（封面与 §7 共用）、小方块 token、坐标轴文字。
// 颜色只取 sv-palette 的 C。
import { C } from './sv-palette';
import { clamp, rgba, rr, txt } from '../live/stage';
import type { LayerStep } from './sv-data';

export interface TowerOpts {
  /** 进度：已经算到第几层（可为小数，0–32） */
  upto: number;
  /** 每行左侧是否标层号 */
  labels?: boolean;
  /** 图像之外的 token 数（画成每行末尾的浅紫段） */
  nonVis?: number;
  /** 高亮的层（选中） */
  focus?: number;
  /** 剪枝层标记 */
  pruneLayers?: number[];
  maxVis?: number;
  font?: number;
}

/** 每层“进入计算”的视觉 token：保留部分（蓝）+ 最近一次回收合成的 token（青）。 */
export function layerParts(steps: LayerStep[], l: number) {
  const s = steps[l];
  let merged = 0;
  for (let k = l - 1; k >= 0; k--) {
    if (steps[k].clusters !== undefined) {
      merged = steps[k].clusters!;
      break;
    }
  }
  return { kept: s.enter - merged, merged, total: s.enter };
}

/**
 * 画一座 32 层的塔：第 0 层在最下面。每行是一条横条，长度 ∝ 进入该层计算的 token 数。
 * 已算过的行实色；正在算的行按小数部分淡入；剪枝层上方一行在淡入时画出被删部分的虚线残影。
 */
export function drawTower(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, steps: LayerStep[], o: TowerOpts) {
  const n = steps.length;
  const lab = o.labels ? 30 : 0;
  const maxVis = o.maxVis ?? 576;
  const nonVis = o.nonVis ?? 0;
  const barW = w - lab;
  const unit = barW / (maxVis + nonVis);
  const gap = h / n > 9 ? 2 : 1;
  const rh = h / n - gap;
  const fs = o.font ?? 11;
  for (let l = 0; l < n; l++) {
    const ry = y + h - (l + 1) * (h / n) + gap / 2;
    const reveal = clamp(o.upto - l, 0, 1);
    // 底轨
    ctx.fillStyle = rgba(C.stageLine, 0.6);
    rr(ctx, x + lab, ry, barW, rh, Math.min(3, rh / 2));
    ctx.fill();
    const marks = o.pruneLayers?.length ? [0, ...o.pruneLayers, n - 1] : [0, 8, 16, 24, n - 1];
    if (o.labels && marks.includes(l)) {
      txt(ctx, String(l), x + lab - 6, ry + rh / 2, { size: fs, color: o.pruneLayers?.includes(l) ? C.ink : C.faint, align: 'right', weight: o.pruneLayers?.includes(l) ? 800 : 500 });
    }
    if (reveal <= 0) continue;
    const p = layerParts(steps, l);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * reveal;
    // 被删部分的残影：上一层更宽时，画出差值（虚线框），随 reveal 淡出
    if (l > 0 && steps[l - 1].enter > p.total) {
      const ghostW = (steps[l - 1].enter - p.total) * unit;
      ctx.save();
      ctx.globalAlpha = (1 - reveal) * 0.9 + 0.12;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = C.prunedLine;
      ctx.fillStyle = rgba(C.pruned, 0.5);
      rr(ctx, x + lab + p.total * unit, ry + 0.5, ghostW, rh - 1, Math.min(3, rh / 2));
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = C.vis;
    rr(ctx, x + lab, ry, p.kept * unit, rh, Math.min(3, rh / 2));
    ctx.fill();
    if (p.merged > 0) {
      ctx.fillStyle = C.merged;
      ctx.fillRect(x + lab + p.kept * unit, ry, p.merged * unit, rh);
    }
    if (nonVis > 0) {
      ctx.fillStyle = C.text;
      rr(ctx, x + lab + p.total * unit + 1, ry, nonVis * unit, rh, Math.min(3, rh / 2));
      ctx.fill();
    }
    ctx.restore();
    if (o.focus === l) {
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      rr(ctx, x + lab - 2, ry - 1.5, barW + 4, rh + 3, 4);
      ctx.stroke();
    }
  }
}
