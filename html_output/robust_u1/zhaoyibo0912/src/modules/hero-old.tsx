import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Hero — 传统方法一侧：一张蒙尘的老照片永远修不回来。
// 灰尘不断飘过照片，人脸始终停在 clarity 0.2，红色角标提示这条路走不通。
// 一个 520×240 的画布，循环 3.2 s（与 hero-new 同一周期，便于左右对照）。

const W = 520;
const H = 240;
const LOOP = 3.2; // seconds — shared with hero-new

// ---------- drawing kit (local helpers, fixed signatures) ----------
type Ctx = CanvasRenderingContext2D;

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Deterministic PRNG: 同一张照片的损伤斑点在不同帧之间保持不动。
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clearScene(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.fillRect(0, h - 26, w, 26);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h - 23);
  ctx.lineTo(w, h - 23);
  ctx.stroke();
}

function drawPhoto(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  damage: number,
  stateColor?: string
) {
  const d = clamp(damage, 0, 1);
  const rng = makeRng(90210);
  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  const n = Math.round(140 * d);
  for (let i = 0; i < n; i++) {
    const sx = x + rng() * w;
    const sy = y + rng() * h;
    const s = 1 + rng() * 2;
    ctx.fillStyle = i % 2 === 0 ? '#76906a' : '#b8c9a7';
    ctx.fillRect(sx, sy, s, s);
  }
  const nc = Math.round(2 + 2 * d);
  ctx.strokeStyle = '#76906a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < nc; i++) {
    let px = x + rng() * w;
    let py = y + rng() * h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 0; k < 3; k++) {
      px += (rng() - 0.5) * 28;
      py += (rng() - 0.5) * 28;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = stateColor ?? '#d7deea';
  ctx.stroke();
  ctx.restore();
}

function drawFace(ctx: Ctx, cx: number, cy: number, r: number, clarity: number) {
  const c = clamp(clarity, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.85 * c;
  ctx.strokeStyle = '#21324a';
  ctx.fillStyle = '#21324a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - r * 0.36, cy - r * 0.18, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.18, Math.max(1.6, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.1, r * 0.5, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.restore();

  if (c >= 0.95) {
    ctx.save();
    ctx.strokeStyle = '#228d5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + r + 16, 9, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLamp(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y - 62);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 62);
  ctx.lineTo(x + 12, y - 62);
  ctx.lineTo(x + 26, y - 92);
  ctx.lineTo(x - 26, y - 92);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 角标色带：沿照片边框的一角描一条粗色带，用来标记这一侧的成败。
function drawCornerBand(ctx: Ctx, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + 9, y);
  ctx.arcTo(x, y, x, y + 9, 9);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

const PHOTO_X = 165;
const PHOTO_Y = 70;
const PHOTO_W = 190;
const PHOTO_H = 140;

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const render = (t: number) => {
      clearScene(ctx, W, H);

      // 静态道具：台灯 + 斜靠在后面的原片副本
      drawLamp(ctx, 56, H - 26);
      ctx.save();
      ctx.translate(190, 100);
      ctx.rotate(-0.14);
      drawPhoto(ctx, -72, -56, 144, 104, 0);
      ctx.restore();

      // 永久损坏的照片：damage 固定 0.7，人脸停在 clarity 0.2
      drawPhoto(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 0.7);
      drawFace(ctx, PHOTO_X + PHOTO_W / 2, PHOTO_Y + 55, 34, 0.2);

      // 8 颗灰尘持续飘过照片
      ctx.save();
      const span = PHOTO_W + 60;
      for (let i = 0; i < 8; i++) {
        const speed = 24 + (i % 4) * 7;
        const dx = ((i * 37) % span + t * speed) % span;
        const x = PHOTO_X - 30 + dx;
        const y = PHOTO_Y + 10 + ((i * 53) % (PHOTO_H - 24)) + Math.sin(t * 1.6 + i * 1.1) * 3;
        ctx.globalAlpha = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + i));
        ctx.fillStyle = '#76906a';
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 红色角标：这条路修不回来
      drawCornerBand(ctx, PHOTO_X, PHOTO_Y, 46, '#c43f52');

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render((performance.now() / 1000) % LOOP);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    </div>
  );
};

export default HeroOld;
