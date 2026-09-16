import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 生活隐喻（560×140，自动循环 3.0 s）：
// 一块除尘布在蒙尘的旧照片上来回擦拭，灰尘被抹开、留下一道被抹散的痕迹，
// 但人像始终停在 clarity 0.25 —— 表面清理救不回丢失的像素。

const W = 560;
const H = 140;
const LOOP = 3.0; // seconds

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

// Deterministic PRNG: 斑点位置每帧一致，只有数量随 damage 变化。
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
  roundRect(ctx, x, y, w, h, 5);
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
      px += (rng() - 0.5) * 20;
      py += (rng() - 0.5) * 20;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
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
  ctx.arc(cx - r * 0.36, cy - r * 0.18, Math.max(1.5, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + r * 0.36, cy - r * 0.18, Math.max(1.5, r * 0.08), 0, Math.PI * 2);
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
    ctx.arc(cx, cy + r + 12, 8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawCloth(ctx: Ctx, x: number, y: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#b8c9a7';
  roundRect(ctx, -20, -13, 40, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#76906a';
  roundRect(ctx, -15, -6, 36, 22, 8);
  ctx.fill();
  ctx.restore();
}

function drawLamp(ctx: Ctx, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = '#76906a';
  ctx.beginPath();
  ctx.ellipse(x, y - 4, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y - 58);
  ctx.stroke();
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 58);
  ctx.lineTo(x + 11, y - 58);
  ctx.lineTo(x + 24, y - 86);
  ctx.lineTo(x - 24, y - 86);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const PHOTO_X = 230;
const PHOTO_Y = 35;
const PHOTO_W = 100;
const PHOTO_H = 75;

export const Ch1Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

      // 静态道具：台灯 + 桌边相框
      drawLamp(ctx, 56, H - 26);
      drawPhoto(ctx, 470, 66, 64, 48, 0);

      // 布来回擦拭：0→1→0，用 easeInOutQuad 让两端慢下来
      const ph = (t % LOOP) / LOOP;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      const e = easeInOutQuad(tri);

      // 灰尘只被抹掉一点点，人像始终停在 clarity 0.25
      drawPhoto(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, 0.72 - 0.1 * e);
      drawFace(ctx, PHOTO_X + PHOTO_W / 2, PHOTO_Y + 30, 20, 0.25);

      // 布擦过之后留下的那道被抹散的尘痕
      const clothX = lerp(PHOTO_X + 18, PHOTO_X + PHOTO_W - 12, e);
      ctx.save();
      ctx.fillStyle = 'rgba(184,201,167,0.55)';
      ctx.beginPath();
      ctx.moveTo(PHOTO_X + 4, PHOTO_Y + 17);
      ctx.lineTo(clothX, PHOTO_Y + 19);
      ctx.lineTo(clothX, PHOTO_Y + 55);
      ctx.lineTo(PHOTO_X + 4, PHOTO_Y + 53);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 唯一的运动主体：除尘布
      drawCloth(ctx, clothX, PHOTO_Y + 36, -0.25);

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

export default Ch1Ana;
