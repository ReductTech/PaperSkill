import React from 'react';
import { lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Shared darkroom-developing drawing kit. Registered under componentId 'photokit' so
// assemble-chapter-packets.js copies it into src/modules/; other widgets import its
// named helpers. PhotoKit itself renders nothing.

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// A paper "photo print" showing a lighthouse on a hill. t = 0..1 development/clarity:
// 0 = foggy undeveloped, 1 = crisp developed.
export function photo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number
): void {
  roundRect(ctx, x, y, w, h, 7);
  ctx.fillStyle = '#fdfcf9';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#c9c0ad';
  ctx.stroke();
  const ix = x + 7;
  const iy = y + 7;
  const iw = w - 14;
  const ih = h - 14;
  ctx.save();
  roundRect(ctx, ix, iy, iw, ih, 4);
  ctx.clip();
  ctx.fillStyle = lerpColor('#c7d3b8', '#9fc0e0', t);
  ctx.fillRect(ix, iy, iw, ih * 0.55);
  ctx.fillStyle = lerpColor('#b8c9a7', '#f7e6b0', t);
  ctx.beginPath();
  ctx.arc(ix + iw * 0.78, iy + ih * 0.2, iw * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lerpColor('#b8c9a7', '#228d5c', t);
  ctx.beginPath();
  ctx.moveTo(ix, iy + ih);
  ctx.lineTo(ix, iy + ih * 0.62);
  ctx.lineTo(ix + iw * 0.5, iy + ih * 0.58);
  ctx.lineTo(ix + iw, iy + ih * 0.66);
  ctx.lineTo(ix + iw, iy + ih);
  ctx.closePath();
  ctx.fill();
  const tw = iw * 0.1;
  const th = ih * 0.34;
  const tx = ix + iw * 0.34;
  const ty = iy + ih * 0.58 - th;
  ctx.fillStyle = lerpColor('#76906a', '#fdfcf9', t);
  ctx.fillRect(tx, ty, tw, th);
  ctx.fillStyle = lerpColor('#76906a', '#f07e47', t);
  ctx.beginPath();
  ctx.arc(tx + tw / 2, ty - tw * 0.2, tw * 0.62, 0, Math.PI * 2);
  ctx.fill();
  if (t < 1) {
    ctx.fillStyle = 'rgba(184, 201, 167, ' + (0.5 * (1 - t)).toFixed(3) + ')';
    ctx.fillRect(ix, iy, iw, ih);
  }
  ctx.restore();
}

export const PhotoKit: React.FC<WidgetProps> = () => null;
