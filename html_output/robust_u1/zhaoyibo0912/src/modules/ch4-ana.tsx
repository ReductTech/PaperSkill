import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 类比动画（560×140，自动循环 3.4 s = 直线扫过 3.0 s + 停留 0.4 s）：
// 一把刷子沿直线匀速扫过照片，身后被扫过的区域由褪色 #76906a 变为恢复色彩；
// 淡淡的直线导轨强调「不绕弯」。静态道具：台灯、显影盘。
const W = 560;
const H = 140;
const SWEEP_MS = 3000;
const LOOP = 3400;
const PHOTO = { x: 240, y: 30, w: 110, h: 80 };
const CL = PHOTO.x + 3;
const CR = PHOTO.x + PHOTO.w - 3;
const CT = PHOTO.y + 3;
const CB = PHOTO.y + PHOTO.h - 3;
const FCX = PHOTO.x + PHOTO.w / 2;
const FCY = PHOTO.y + PHOTO.h / 2;
const FR = 22;

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

// 同一套五官几何，按当前描边色 + 透明度绘制（褪色版 / 完整版共用）。
function faceGeometry(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
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
  faceGeometry(ctx, cx, cy, r, '#21324a', 0.15 + 0.85 * c);
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

function drawBrush(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-14, -8);
  ctx.lineTo(-14, 8);
  ctx.closePath();
  ctx.fillStyle = '#76906a';
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-64, 0);
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

function drawTray(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.save();
  roundRectPath(ctx, x, y, w, 22, 5);
  ctx.fillStyle = '#76906a';
  ctx.fill();
  ctx.strokeStyle = '#27446e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 9);
  ctx.lineTo(x + w - 8, y + 9);
  ctx.stroke();
  ctx.restore();
}

/* ---------- 组件 ---------- */

export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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
      const sweep = clamp(tRaw, 0, 1);
      clearScene(ctx, W, H);
      drawLamp(ctx, 44, H - 28);
      drawTray(ctx, 408, 102, 100);

      // 淡淡的直线导轨：强调恢复路径不绕弯
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(198, FCY);
      ctx.lineTo(392, FCY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 照片：一半褪色、仍有损坏
      drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 0.5);

      // 未扫过的内容：褪色 #76906a
      ctx.save();
      roundRectPath(ctx, CL, CT, CR - CL, CB - CT, 4);
      ctx.clip();
      faceGeometry(ctx, FCX, FCY, FR, '#76906a', 0.5);
      ctx.restore();

      // 已扫过的区域：颜色回来（损坏大幅减少 + 语义色恢复 + 完整五官）
      const tipX = lerp(CL, CR, sweep);
      if (tipX > CL) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(CL, CT, tipX - CL, CB - CT);
        ctx.clip();
        drawPhoto(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, 0.06);
        const wash = 0.06 + 0.12 * easeInOutQuad(clamp((sweep - 0.5) / 0.5, 0, 1));
        ctx.fillStyle = `rgba(34, 141, 92, ${wash.toFixed(3)})`;
        ctx.fillRect(CL, CT, tipX - CL, CB - CT);
        drawFace(ctx, FCX, FCY, FR, 0.94);
        ctx.restore();
      }
      if (sweep >= 0.98) drawFace(ctx, FCX, FCY, FR, 1);

      // 刷子：笔直向左→右，一次通过
      drawBrush(ctx, tipX, FCY + 2, 0.5);
    };

    const t0 = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - t0) % LOOP;
      render(clamp(elapsed / SWEEP_MS, 0, 1));
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

export default Ch4Ana;
