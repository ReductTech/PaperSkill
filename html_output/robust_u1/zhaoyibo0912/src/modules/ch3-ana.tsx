import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §3 类比动画（560×140，自动循环 3.4 s）：
// 一支铅笔沿褪色人像的虚线轮廓一笔一笔描画，身后的线由虚线 #68778f 变为实线 #21324a，
// 循环末尾眼睛与微笑浮现（目标达成）。静态道具：台灯、立在相框后的原片副本。
const W = 560;
const H = 140;
const LOOP = 3400;
const PHOTO = { x: 240, y: 30, w: 110, h: 80 };
const FCX = PHOTO.x + PHOTO.w / 2;
const FCY = PHOTO.y + PHOTO.h / 2;
const FR = 20;

/* ---------- 复用画布工具（签名固定） ---------- */

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// 确定性伪随机：同一损伤参数下噪点位置稳定，不逐帧抖动。
function rand(i: number): number {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  const top = h - 26;
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, top, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, top + 3);
  ctx.lineTo(w, top + 3);
  ctx.stroke();
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
): void {
  const d = clamp(damage, 0, 1);
  roundRectPath(ctx, x, y, w, h, 7);
  ctx.fillStyle = stateColor || '#d7deea';
  ctx.fill();
  const ix = x + 3;
  const iy = y + 3;
  const iw = w - 6;
  const ih = h - 6;
  roundRectPath(ctx, ix, iy, iw, ih, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.save();
  roundRectPath(ctx, ix, iy, iw, ih, 4);
  ctx.clip();

  const n = Math.round(140 * d);
  for (let k = 0; k < n; k++) {
    const sx = ix + rand(k * 3 + 1) * iw;
    const sy = iy + rand(k * 3 + 2) * ih;
    const sr = 1 + rand(k * 3 + 3) * 2;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = k % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const nc = d <= 0 ? 0 : Math.max(1, Math.round(2 + 2 * d));
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let k = 0; k < nc; k++) {
    let px = ix + rand(k * 7 + 11) * iw;
    let py = iy + rand(k * 7 + 13) * ih;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let s = 0; s < 3; s++) {
      px += (rand(k * 17 + s * 3 + 19) - 0.5) * 26;
      py += (rand(k * 17 + s * 3 + 23) - 0.5) * 26;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyesSmile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#21324a';
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.35, cy - r * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.12, r * 0.5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  clarity: number
): void {
  const c = clamp(clarity, 0, 1);
  const a = 0.15 + 0.85 * c;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawEyesSmile(ctx, cx, cy, r, a);
  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 4, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-11, -5);
  ctx.lineTo(-11, 5);
  ctx.closePath();
  ctx.fillStyle = '#21324a';
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-11, 0);
  ctx.lineTo(-46, 0);
  ctx.stroke();
  ctx.restore();
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  roundRectPath(ctx, x - 18, y - 8, 36, 9, 3);
  ctx.fillStyle = '#76906a';
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y - 44);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 42);
  ctx.lineTo(x + 20, y - 42);
  ctx.lineTo(x + 11, y - 66);
  ctx.lineTo(x - 11, y - 66);
  ctx.closePath();
  ctx.fillStyle = '#b8c9a7';
  ctx.fill();
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/* ---------- 组件 ---------- */

export const Ch3Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // 窄屏下按比例缩放，避免画面被横向压扁
    canvas.style.height = 'auto';

    const render = (tRaw: number) => {
      const t = clamp(tRaw, 0, 1);
      clearScene(ctx, W, H);
      drawLamp(ctx, 44, H - 28);
      // 静态道具：立在相框后的原片副本（绿框 = 干净原片）
      drawPhoto(ctx, 404, 42, 64, 48, 0.04, '#228d5c');
      drawFace(ctx, 436, 66, 10, 0.9);
      // 主照片：褪色 + 轻度损坏
      drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 0.3);

      const p = easeInOutQuad(t);

      // 尚未描画的褪色虚线轮廓
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(FCX, FCY, FR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 已经描好的实线轮廓（自顶端起顺时针推进）
      const a0 = -Math.PI / 2;
      const a1 = lerp(a0, a0 + Math.PI * 2, p);
      ctx.save();
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(FCX, FCY, FR, a0, a1);
      ctx.stroke();
      ctx.restore();

      // 循环末尾：眼睛与微笑浮现
      const fa = easeInOutQuad(clamp((p - 0.82) / 0.12, 0, 1));
      if (fa > 0) drawEyesSmile(ctx, FCX, FCY, FR, fa);
      if (p >= 0.95) drawFace(ctx, FCX, FCY, FR, 1);

      // 铅笔：笔尖落在描画点上，笔身朝轮廓外侧
      const tipX = FCX + FR * Math.cos(a1);
      const tipY = FCY + FR * Math.sin(a1);
      drawPencil(ctx, tipX, tipY, a1 + Math.PI);
    };

    const t0 = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - t0) % LOOP;
      render(elapsed / LOOP);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ch3Ana;
