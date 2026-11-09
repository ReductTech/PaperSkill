import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import { C, drawPhoto, roundRect, useElicCanvas } from './elicKit';

const AW = 560;
const AH = 140;

function loop(t: number) {
  const period = 3000;
  return ((t % period) + period) % period / period;
}

function drawAlbumSlot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = C.env;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.support;
  ctx.stroke();
  ctx.restore();
}

function scene1(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const slot = { x: 410, y: 32, w: 118, h: 76 };
  drawAlbumSlot(ctx, slot.x, slot.y, slot.w, slot.h);
  const fit = 0.86 + 0.14 * Math.sin(Math.min(p, 1) * Math.PI * 0.5);
  const w = slot.w * (1.35 - 0.49 * fit);
  const h = slot.h * (1.35 - 0.49 * fit);
  drawPhoto(ctx, slot.x + slot.w / 2 - w / 2, slot.y + slot.h / 2 - h / 2, w, h, 0.75, fit > 0.95 ? 'green' : 'red');
}

function scene2(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const x = 30;
  const y = 30;
  const w = 360;
  const h = 80;
  drawPhoto(ctx, x, y, w, h, 0.6, 'neutral');
  ctx.save();
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 6, y);
    ctx.lineTo(x + (w * i) / 6, y + h);
    ctx.stroke();
  }
  ctx.restore();
  const lx = x + p * (w - 90);
  roundRect(ctx, lx, y - 8, 90, h + 16, 8);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = 'rgba(39, 68, 110, 0.12)';
  ctx.fill();
}

function scene3(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const x = 40;
  const y = 20;
  const w = 480;
  const h = 100;
  drawPhoto(ctx, x, y, w, h, 0.45, 'neutral');
  const cx = x + w * (0.35 + 0.3 * p);
  const cy = y + h * 0.5;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  drawPhoto(ctx, cx - 38, cy - 25, 76, 50, 0.95, 'green');
}

function scene4(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const dial = { x: 80, y: 20, r: 42 };
  drawPhoto(ctx, 210, 20, 300, 100, 0.35 + 0.6 * p, p > 0.75 ? 'green' : p > 0.25 ? 'blue' : 'red');
  ctx.beginPath();
  ctx.arc(dial.x, dial.y, dial.r, 0, Math.PI * 2);
  ctx.fillStyle = C.bg;
  ctx.fill();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 4;
  ctx.stroke();
  const ang = -0.6 + 1.2 * p;
  ctx.beginPath();
  ctx.moveTo(dial.x, dial.y);
  ctx.lineTo(dial.x + Math.cos(ang - Math.PI / 2) * dial.r * 0.8, dial.y + Math.sin(ang - Math.PI / 2) * dial.r * 0.8);
  ctx.strokeStyle = C.orange;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function scene5(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const ref = { x: 50, y: 25, w: 200, h: 90 };
  const target = { w: 200, h: 90 };
  drawPhoto(ctx, ref.x, ref.y, ref.w, ref.h, 0.8, 'green');
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 2;
  roundRect(ctx, ref.x, ref.y, ref.w, ref.h, 6);
  ctx.stroke();
  ctx.restore();
  const tx = 310 + (1 - p) * 40;
  drawPhoto(ctx, tx, ref.y, target.w, target.h, 0.55, p > 0.8 ? 'green' : 'blue');
}

function scene6(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  drawPhoto(ctx, 90, 20, 380, 100, p, 'blue');
}

function scene7(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const x = 80;
  const y = 25;
  const w = 340;
  const h = 90;
  drawPhoto(ctx, x, y, w, h, 0.8, 'neutral');
  ctx.fillStyle = C.red;
  for (let i = 0; i < 36; i++) {
    const nx = x + 12 + ((i * 61) % w);
    const ny = y + 12 + ((i * 37) % (h - 20));
    const cleaned = nx < x + p * w;
    ctx.globalAlpha = cleaned ? 0 : 0.75;
    ctx.fillRect(nx, ny, 4, 4);
  }
  ctx.globalAlpha = 1;
  const bx = x + p * w;
  roundRect(ctx, bx - 18, y - 12, 34, h + 24, 8);
  ctx.fillStyle = C.green;
  ctx.fill();
}

function scene8(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  ctx.save();
  roundRect(ctx, 390, 45, 110, 72, 8);
  ctx.fillStyle = C.depth;
  ctx.fill();
  ctx.restore();
  const lx = 220 + p * 145;
  roundRect(ctx, lx, 48, 60, 66, 8);
  ctx.fillStyle = p > 0.8 ? C.green : C.blue;
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(lx + 60, 48);
  ctx.lineTo(lx + 60, 114);
  ctx.stroke();
}

function scene9(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  drawPhoto(ctx, 30, 20, 320, 100, 0.8, 'neutral');
  const scale = 0.55 + 0.45 * Math.min(p * 3, 1);
  const w = 150 * scale;
  const h = 100 * scale;
  drawPhoto(ctx, 420, 60 - h / 2, w, h, 0.55, 'green');
}

function scene10(ctx: CanvasRenderingContext2D, t: number) {
  const p = loop(t);
  const laneY = [28, 82];
  const finish = 470;
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(finish, 16);
  ctx.lineTo(finish, 128);
  ctx.stroke();
  laneY.forEach((ly, i) => {
    const speed = i === 0 ? 1 : 0.72;
    const px = 20 + Math.min(p * speed, 1) * (finish - 120);
    drawPhoto(ctx, px, ly, 96, 38, 0.7, i === 0 ? 'green' : 'red');
  });
}

const scenes: Record<number, (ctx: CanvasRenderingContext2D, t: number) => void> = {
  1: scene1,
  2: scene2,
  3: scene3,
  4: scene4,
  5: scene5,
  6: scene6,
  7: scene7,
  8: scene8,
  9: scene9,
  10: scene10,
};

export const ElicAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const num = Number(chapterId.replace('chap-', '')) || 1;
  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, AW, AH);
    (scenes[num] || scene1)(ctx, t);
  };
  useElicCanvas(ref, AW, AH, draw);
  return <canvas ref={ref} width={AW} height={AH} />;
};

function drawGrouping(ctx: CanvasRenderingContext2D, w: number, h: number, even: boolean) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  const counts = even ? [32, 32, 32, 32, 32, 32, 32, 32, 32, 32] : [16, 16, 32, 64, 192];
  const total = counts.reduce((a, b) => a + b, 0);
  const left = 30;
  const bw = w - 60;
  let x = left;
  counts.forEach((c, i) => {
    const width = (c / total) * bw;
    roundRect(ctx, x, 60, width - 5, 60, 5);
    ctx.fillStyle = even ? C.red : C.green;
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(c), x + (width - 5) / 2, 140);
    x += width;
  });
  ctx.fillStyle = C.muted;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(even ? '10 组均匀 · 慢' : '5 组非均匀 · 快', left, 34);
}

export const ElicHeroSide: React.FC<WidgetProps> = ({ moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const even = moduleId === 'old';
  const draw = (ctx: CanvasRenderingContext2D) => drawGrouping(ctx, 560, 180, even);
  useElicCanvas(ref, 560, 180, draw);
  return <canvas ref={ref} width={560} height={180} />;
};
